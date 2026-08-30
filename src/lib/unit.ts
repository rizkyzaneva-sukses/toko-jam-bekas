// Logika bisnis unit jam: penomoran, alur status, QC, dan write-off.
// Semua mutasi stok lewat sini — route handler tidak boleh menyentuh Prisma langsung.

import { Prisma, type StatusUnit, type GradeUnit } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis, hapusKasReferensi } from "@/lib/kas";
import { slugBrand } from "@/lib/hitung";

type Tx = Prisma.TransactionClient;

export { slugBrand };

/**
 * Penomoran berurutan yang aman dari balapan.
 * Dipakai untuk kode unit (UNIT:SEIKO) dan nomor nota (NOTA:202608).
 */
export async function nomorBerikutnya(tx: Tx, kunci: string): Promise<number> {
  const counter = await tx.counter.upsert({
    where: { kunci },
    create: { kunci, nilai: 1 },
    update: { nilai: { increment: 1 } },
    select: { nilai: true },
  });
  return counter.nilai;
}

/**
 * Hitung ulang HPP unit dari seluruh biaya service yang menempel padanya.
 * HPP = hargaBeli + Σ(semua biaya service).
 */
export async function hitungUlangHpp(tx: Tx, unitId: string): Promise<void> {
  const unit = await tx.unit.findUnique({
    where: { id: unitId },
    select: { hargaBeli: true },
  });
  if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

  const agregat = await tx.serviceItem.aggregate({
    where: { service: { unitId } },
    _sum: { biaya: true },
  });

  const totalService = agregat._sum.biaya ?? new Prisma.Decimal(0);
  await tx.unit.update({
    where: { id: unitId },
    data: {
      totalBiayaService: totalService,
      hpp: new Prisma.Decimal(unit.hargaBeli).plus(totalService),
    },
  });
}

export interface DataBeliUnit {
  brand: string;
  model: string;
  hargaBeli: number;
  tglBeli: Date;
  catatan?: string | null;
}

/** Beli produk: buat unit baru + baris ledger MASUK_BELI. */
export async function buatUnit(data: DataBeliUnit) {
  if (data.hargaBeli <= 0) throw new KesalahanBisnis("Harga beli harus lebih dari Rp 0");

  return getPrisma().$transaction(async (tx) => {
    const slug = slugBrand(data.brand);
    const urut = await nomorBerikutnya(tx, `UNIT:${slug}`);
    const kodeUnit = `${slug}-${String(urut).padStart(3, "0")}`;

    const unit = await tx.unit.create({
      data: {
        kodeUnit,
        brand: data.brand.trim(),
        model: data.model.trim(),
        hargaBeli: new Prisma.Decimal(data.hargaBeli),
        hpp: new Prisma.Decimal(data.hargaBeli),
        totalBiayaService: new Prisma.Decimal(0),
        status: "MASUK_QC",
        tglBeli: data.tglBeli,
        catatan: data.catatan?.trim() || null,
      },
    });

    await tx.stokLedger.create({
      data: {
        unitId: unit.id,
        jenis: "MASUK_BELI",
        qty: 1,
        tanggal: data.tglBeli,
        keterangan: `Pembelian ${unit.kodeUnit}`,
      },
    });

    await catatKasOtomatis(tx, {
      tanggal: data.tglBeli,
      jenis: "BELI_UNIT",
      jumlah: data.hargaBeli,
      keterangan: `${unit.kodeUnit} — ${unit.brand} ${unit.model}`,
      referensiTipe: "Unit",
      referensiId: unit.id,
    });

    return unit;
  });
}

export interface DataQc {
  unitId: string;
  hasil: "LOLOS" | "GAGAL";
  keterangan?: string | null;
  // Hanya untuk hasil LOLOS:
  grade?: GradeUnit | null;
  hargaJual?: number | null;
  catatanKondisi?: string | null;
  adaBox?: boolean;
  adaSurat?: boolean;
  adaBuku?: boolean;
  adaExtraLink?: boolean;
  adaSertifikat?: boolean;
}

/**
 * QC LOLOS  -> unit masuk inventory (READY), tglMasukInventory dicatat.
 * QC GAGAL  -> unit masuk antrian service, tiket service PROSES dibuat.
 */
export async function prosesQc(data: DataQc) {
  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({ where: { id: data.unitId } });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);
    if (unit.status !== "MASUK_QC") {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} tidak sedang di antrian QC (status sekarang: ${unit.status})`
      );
    }

    await tx.qcRecord.create({
      data: {
        unitId: unit.id,
        hasil: data.hasil,
        keterangan: data.keterangan?.trim() || null,
      },
    });

    if (data.hasil === "LOLOS") {
      if (!data.grade) throw new KesalahanBisnis("Grade wajib diisi saat QC lolos");
      if (!data.hargaJual || data.hargaJual <= 0) {
        throw new KesalahanBisnis("Harga jual wajib diisi dan harus lebih dari Rp 0");
      }

      const sekarang = new Date();
      const diperbarui = await tx.unit.update({
        where: { id: unit.id },
        data: {
          status: "READY",
          grade: data.grade,
          hargaJual: new Prisma.Decimal(data.hargaJual),
          catatanKondisi: data.catatanKondisi?.trim() || null,
          adaBox: data.adaBox ?? false,
          adaSurat: data.adaSurat ?? false,
          adaBuku: data.adaBuku ?? false,
          adaExtraLink: data.adaExtraLink ?? false,
          adaSertifikat: data.adaSertifikat ?? false,
          tglMasukInventory: sekarang,
        },
      });

      await tx.stokLedger.create({
        data: {
          unitId: unit.id,
          jenis: "MASUK_QC_LOLOS",
          qty: 0,
          tanggal: sekarang,
          keterangan: `QC lolos — grade ${data.grade}`,
        },
      });

      return diperbarui;
    }

    // GAGAL -> service
    const diperbarui = await tx.unit.update({
      where: { id: unit.id },
      data: { status: "SERVICE" },
    });

    const serviceAktif = await tx.service.findFirst({
      where: { unitId: unit.id, status: "PROSES" },
    });
    if (!serviceAktif) {
      await tx.service.create({
        data: {
          unitId: unit.id,
          status: "PROSES",
          catatan: data.keterangan?.trim() || null,
          totalBiaya: new Prisma.Decimal(0),
        },
      });
    }

    await tx.stokLedger.create({
      data: {
        unitId: unit.id,
        jenis: "KELUAR_SERVICE",
        qty: 0,
        keterangan: data.keterangan?.trim() || "QC gagal, masuk service",
      },
    });

    return diperbarui;
  });
}

/**
 * Write-off: unit dinyatakan rusak total.
 * Seluruh HPP diakui sebagai kerugian pada tanggal ini.
 */
export async function tandaiRusak(unitId: string, alasan: string, tanggal: Date) {
  if (!alasan.trim()) throw new KesalahanBisnis("Alasan wajib diisi");

  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

    const bolehDari: StatusUnit[] = ["MASUK_QC", "SERVICE", "READY"];
    if (!bolehDari.includes(unit.status)) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} berstatus ${unit.status} — tidak bisa dipindah ke RUSAK`
      );
    }

    const diperbarui = await tx.unit.update({
      where: { id: unit.id },
      data: {
        status: "RUSAK",
        statusSebelumRusak: unit.status,
        alasanRusak: alasan.trim(),
        tglKeluar: tanggal,
      },
    });

    await tx.stokLedger.create({
      data: {
        unitId: unit.id,
        jenis: "KELUAR_RUSAK",
        qty: -1,
        tanggal,
        keterangan: alasan.trim(),
      },
    });

    return diperbarui;
  });
}

/** Batalkan write-off — mengembalikan unit ke status sebelumnya. */
export async function batalRusak(unitId: string) {
  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);
    if (unit.status !== "RUSAK") {
      throw new KesalahanBisnis(`Unit ${unit.kodeUnit} tidak berstatus RUSAK`);
    }

    await tx.stokLedger.deleteMany({
      where: { unitId: unit.id, jenis: "KELUAR_RUSAK" },
    });

    return tx.unit.update({
      where: { id: unit.id },
      data: {
        status: unit.statusSebelumRusak ?? "MASUK_QC",
        statusSebelumRusak: null,
        alasanRusak: null,
        tglKeluar: null,
      },
    });
  });
}

/** Hapus unit — hanya boleh kalau belum pernah ada pergerakan selain pembelian. */
export async function hapusUnit(unitId: string) {
  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({
      where: { id: unitId },
      select: { id: true, kodeUnit: true, status: true },
    });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);
    if (unit.status !== "MASUK_QC") {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} sudah punya riwayat. Gunakan "Pindahkan ke RUSAK", jangan dihapus.`
      );
    }

    const jejak = await tx.stokLedger.count({
      where: { unitId: unit.id, jenis: { not: "MASUK_BELI" } },
    });
    if (jejak > 0) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} sudah punya pergerakan stok. Gunakan "Pindahkan ke RUSAK".`
      );
    }

    await hapusKasReferensi(tx, "Unit", unit.id);
    await tx.unit.delete({ where: { id: unit.id } });
    return unit;
  });
}
