// Logika bisnis unit jam: penomoran, alur status, QC, dan write-off.
// Semua mutasi stok lewat sini  -  route handler tidak boleh menyentuh Prisma langsung.

import { Prisma, type StatusUnit, type GradeUnit } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis, hapusKasReferensi } from "@/lib/kas";
import { kembalikanSparepart } from "@/lib/sparepart";
import { slugBrand } from "@/lib/hitung";
import { toNumber } from "@/lib/utils";

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
 * HPP = hargaBeli + --(semua biaya service).
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
      keterangan: `${unit.kodeUnit}  -  ${unit.brand} ${unit.model}`,
      referensiTipe: "Unit",
      referensiId: unit.id,
    });

    return unit;
  });
}

export interface DataEditUnit {
  brand?: string;
  model?: string;
  tglBeli?: Date;
  hargaBeli?: number;
  hargaJual?: number | null;
  grade?: GradeUnit | null;
  catatan?: string | null;
  catatanKondisi?: string | null;
  adaBox?: boolean;
  adaSurat?: boolean;
  adaBuku?: boolean;
  adaExtraLink?: boolean;
  adaSertifikat?: boolean;
}

/** Edit informasi unit (identitas, kondisi, kelengkapan, dan modal jika belum terjual). */
export async function editUnit(unitId: string, data: DataEditUnit) {
  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({
      where: { id: unitId },
    });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

    const dataUpdate: Prisma.UnitUpdateInput = {};

    if (data.brand !== undefined) {
      if (!data.brand.trim()) throw new KesalahanBisnis("Brand wajib diisi");
      dataUpdate.brand = data.brand.trim();
    }
    if (data.model !== undefined) {
      if (!data.model.trim()) throw new KesalahanBisnis("Model wajib diisi");
      dataUpdate.model = data.model.trim();
    }
    if (data.catatan !== undefined) {
      dataUpdate.catatan = data.catatan?.trim() || null;
    }
    if (data.catatanKondisi !== undefined) {
      dataUpdate.catatanKondisi = data.catatanKondisi?.trim() || null;
    }
    if (data.grade !== undefined) {
      dataUpdate.grade = data.grade;
    }
    if (data.adaBox !== undefined) dataUpdate.adaBox = data.adaBox;
    if (data.adaSurat !== undefined) dataUpdate.adaSurat = data.adaSurat;
    if (data.adaBuku !== undefined) dataUpdate.adaBuku = data.adaBuku;
    if (data.adaExtraLink !== undefined) dataUpdate.adaExtraLink = data.adaExtraLink;
    if (data.adaSertifikat !== undefined) dataUpdate.adaSertifikat = data.adaSertifikat;

    if (data.hargaJual !== undefined) {
      if (data.hargaJual !== null && data.hargaJual < 0) {
        throw new KesalahanBisnis("Harga jual tidak boleh negatif");
      }
      dataUpdate.hargaJual = data.hargaJual !== null ? new Prisma.Decimal(data.hargaJual) : null;
    }

    if (data.tglBeli !== undefined) {
      dataUpdate.tglBeli = data.tglBeli;
      // Sinkronkan juga tanggal baris KasEntry BELI_UNIT terkait
      await tx.kasEntry.updateMany({
        where: { referensiTipe: "Unit", referensiId: unit.id, jenis: "BELI_UNIT" },
        data: { tanggal: data.tglBeli },
      });
      // Sinkronkan juga tanggal stok ledger MASUK_BELI
      await tx.stokLedger.updateMany({
        where: { unitId: unit.id, jenis: "MASUK_BELI" },
        data: { tanggal: data.tglBeli },
      });
    }

    if (data.hargaBeli !== undefined) {
      if (data.hargaBeli <= 0) {
        throw new KesalahanBisnis("Harga beli harus lebih dari Rp 0");
      }

      if (unit.status === "TERJUAL" && data.hargaBeli !== toNumber(unit.hargaBeli)) {
        throw new KesalahanBisnis(
          "Harga beli unit yang sudah TERJUAL tidak dapat diubah karena nota penjualan sudah dibekukan."
        );
      }

      const totalService = toNumber(unit.totalBiayaService);
      const hppBaru = data.hargaBeli + totalService;

      dataUpdate.hargaBeli = new Prisma.Decimal(data.hargaBeli);
      dataUpdate.hpp = new Prisma.Decimal(hppBaru);

      // Sinkronkan jumlah kas keluar BELI_UNIT
      const brandModel = `${dataUpdate.brand ?? unit.brand} ${dataUpdate.model ?? unit.model}`;
      await tx.kasEntry.updateMany({
        where: { referensiTipe: "Unit", referensiId: unit.id, jenis: "BELI_UNIT" },
        data: {
          jumlah: new Prisma.Decimal(data.hargaBeli),
          keterangan: `${unit.kodeUnit}  -  ${brandModel}`,
        },
      });
    }

    return tx.unit.update({
      where: { id: unitId },
      data: dataUpdate,
    });
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
          keterangan: `QC lolos  -  grade ${data.grade}`,
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
        `Unit ${unit.kodeUnit} berstatus ${unit.status}  -  tidak bisa dipindah ke RUSAK`
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

/** Batalkan write-off  -  mengembalikan unit ke status sebelumnya. */
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

/**
 * Periksa apakah unit boleh dibatalkan (dihapus total).
 * Dipakai UI untuk menampilkan peringatan sebelum eksekusi.
 */
export interface DampakHapusUnit {
  id: string;
  kodeUnit: string;
  brand: string;
  model: string;
  status: StatusUnit;
  hargaBeli: number;
  totalBiayaService: number;
  hpp: number;
  bolehHapusTanpaPaksa: boolean;
  /** Alasan kalau harus pakai paksa (mis. sudah punya riwayat). */
  alasanBlokir: string | null;
  /** Unit yang sudah terjual tidak boleh dihapus dari sini. */
  sudahTerjual: boolean;
  noNota: string | null;
  jumlahQc: number;
  jumlahService: number;
  jumlahKomponenService: number;
  jumlahPergerakanLedger: number;
  jumlahBarisKas: number;
  totalKasKeluar: number;
  sparepartDipakai: { nama: string; qty: number }[];
  /** Kerugian yang timbul kalau unit ini dihapus padahal uangnya sudah keluar. */
  kerugianKas: number;
}

/** Rincian dampak penghapusan sebuah unit — untuk ditampilkan di dialog konfirmasi. */
export async function periksaDampakHapusUnit(unitId: string): Promise<DampakHapusUnit> {
  const u = await getPrisma().unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      kodeUnit: true,
      brand: true,
      model: true,
      status: true,
      hargaBeli: true,
      totalBiayaService: true,
      hpp: true,
      penjualanItem: {
        select: { penjualan: { select: { noNota: true } } },
      },
      qcRecords: { select: { id: true } },
      services: {
        select: {
          id: true,
          items: {
            select: {
              id: true,
              qty: true,
              sparepart: { select: { nama: true } },
            },
          },
        },
      },
      ledger: { select: { id: true, jenis: true } },
    },
  });
  if (!u) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

  const qcRecords = u.qcRecords.length;
  const jumlahService = u.services.length;
  const komponen = u.services.flatMap((s) => s.items);

  const barisKas = await getPrisma().kasEntry.findMany({
    where: { referensiTipe: "Unit", referensiId: u.id },
    select: { arah: true, jumlah: true },
  });
  const kasKeluar = barisKas
    .filter((k) => k.arah === "KELUAR")
    .reduce((a, k) => a + toNumber(k.jumlah), 0);

  const ledgerLain = u.ledger.filter((l) => l.jenis !== "MASUK_BELI").length;
  const sudahTerjual = !!u.penjualanItem;

  /**
   * Hapus hanya boleh saat unit masih di alur awal:
   *   - MASUK_QC  -> baru dibeli, belum lewat QC
   *   - READY     -> sudah lolos QC, masih di inventory (salah input masih bisa dibatalkan)
   *
   * Di luar itu (SERVICE, TERJUAL, dsb) atau sudah ada biaya service &
   * pergerakan stok lanjutan -> diblokir, pemilik harus beresin dari halaman
   * terkait (batalkan nota penjualan / selesaikan service) dulu.
   */
  const bolehStatus = u.status === "MASUK_QC" || u.status === "READY";
  const adaBiayaService = u.services.length > 0;

  let alasanBlokir: string | null = null;
  if (sudahTerjual) {
    alasanBlokir =
      `Unit ini sudah terjual di nota ${u.penjualanItem!.penjualan.noNota}. ` +
      `Batalkan nota penjualannya dulu, baru unit bisa dihapus.`;
  } else if (!bolehStatus) {
    alasanBlokir =
      `Status unit sekarang ${u.status} — hapus hanya boleh untuk unit yang masih di awal ` +
      `(belum QC / baru lolos QC).`;
  } else if (adaBiayaService) {
    alasanBlokir =
      "Unit sudah punya riwayat service — selesaikan / batalkan service-nya dulu.";
  }

  return {
    id: u.id,
    kodeUnit: u.kodeUnit,
    brand: u.brand,
    model: u.model,
    status: u.status,
    hargaBeli: toNumber(u.hargaBeli),
    totalBiayaService: toNumber(u.totalBiayaService),
    hpp: toNumber(u.hpp),
    bolehHapusTanpaPaksa: alasanBlokir === null,
    alasanBlokir,
    sudahTerjual,
    noNota: u.penjualanItem?.penjualan.noNota ?? null,
    jumlahQc: qcRecords,
    jumlahService,
    jumlahKomponenService: komponen.length,
    jumlahPergerakanLedger: ledgerLain,
    jumlahBarisKas: barisKas.length,
    totalKasKeluar: kasKeluar,
    sparepartDipakai: komponen
      .filter((i) => i.sparepart && i.qty)
      .map((i) => ({ nama: i.sparepart!.nama, qty: i.qty! })),
    kerugianKas: kasKeluar,
  };
}

/**
 * Batalkan / hapus unit yang salah input.
 *
 * Aman: unit masih di antrian QC, belum ada pergerakan stok lain, belum terjual.
 *   -> seluruh jejaknya (kas, ledger, QC) dibersihkan dan unit dihapus.
 *
 * Paksa (paksa = true): unit sudah lewat QC / ada biaya service.
 *   -> jejaknya tetap dibersihkan, tapi kas yang sudah keluar TIDAK kembali
 *      (uangnya sudah dibayarkan ke penjual). Saldo kas akan tercatat lebih
 *      kecil dari kenyataan sebesar `kerugianKas` — pemilik harus menyetor
 *      penyesuaian manual kalau memang uangnya bisa ditarik kembali.
 *
 * Unit TERJUAL selalu ditolak — batalkan nota penjualannya dulu.
 */
export async function hapusUnit(unitId: string, paksa = false) {
  return getPrisma().$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        kodeUnit: true,
        brand: true,
        model: true,
        status: true,
        hargaBeli: true,
        penjualanItem: { select: { id: true, penjualan: { select: { noNota: true } } } },
      },
    });
    if (!unit) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

    if (unit.penjualanItem) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} sudah terjual di nota ${unit.penjualanItem.penjualan.noNota}. ` +
          `Batalkan nota penjualannya dulu dari halaman Penjualan.`
      );
    }

    const jejak = await tx.stokLedger.count({
      where: { unitId: unit.id, jenis: { not: "MASUK_BELI" } },
    });

    // Hapus cuma boleh untuk unit yang masih di awal alur.
    const bolehStatus = unit.status === "MASUK_QC" || unit.status === "READY";
    if (!bolehStatus) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} berstatus ${unit.status} — hapus hanya boleh untuk unit ` +
          `yang belum lewat QC atau baru lolos QC.`
      );
    }

    const jumlahService = await tx.service.count({ where: { unitId: unit.id } });
    if (jumlahService > 0) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} sudah punya riwayat service. ` +
          `Selesaikan atau batalkan service-nya dulu sebelum menghapus unit.`
      );
    }

    if (jejak > 0 && !paksa) {
      throw new KesalahanBisnis(
        `Unit ${unit.kodeUnit} sudah punya riwayat QC. ` +
          `Kirim ulang dengan mode paksa kalau memang mau dihapus permanen.`
      );
    }

    // 1. Kembalikan sparepart yang terpakai ke stok + hapus mutasinya.
    const komponen = await tx.serviceItem.findMany({
      where: { service: { unitId: unit.id } },
      select: { id: true, sparepartId: true },
    });
    for (const k of komponen) {
      if (k.sparepartId) await kembalikanSparepart(tx, k.id);
    }

    // 2. Bersihkan kas otomatis milik unit + komponen service-nya.
    await hapusKasReferensi(tx, "Unit", unit.id);
    for (const k of komponen) {
      await hapusKasReferensi(tx, "ServiceItem", k.id);
    }

    // 3. Hapus ServiceItem lebih dulu (FK ke Sparepart tidak cascade),
    //    lalu Service / QcRecord / Ledger ikut terhapus lewat onDelete: Cascade.
    await tx.serviceItem.deleteMany({ where: { service: { unitId: unit.id } } });
    await tx.serviceItem.deleteMany({ where: { id: { in: komponen.map((k) => k.id) } } });
    await tx.stokLedger.deleteMany({ where: { unitId: unit.id } });
    await tx.qcRecord.deleteMany({ where: { unitId: unit.id } });
    await tx.service.deleteMany({ where: { unitId: unit.id } });

    await tx.unit.delete({ where: { id: unit.id } });

    return {
      id: unit.id,
      kodeUnit: unit.kodeUnit,
      brand: unit.brand,
      model: unit.model,
      hpp: toNumber(unit.hargaBeli),
      paksa,
      sparepartDikembalikan: komponen.filter((k) => k.sparepartId).length,
    };
  });
}

export interface DataStokLamaUnit {
  brand: string;
  model: string;
  hargaBeli: number;
  tglBeli: Date;
  status?: "READY" | "MASUK_QC";
  grade?: GradeUnit | null;
  hargaJual?: number | null;
  tglMasukInventory?: Date | null;
  adaBox?: boolean;
  adaSurat?: boolean;
  adaBuku?: boolean;
  adaExtraLink?: boolean;
  adaSertifikat?: boolean;
  catatanKondisi?: string | null;
  catatan?: string | null;
}

/**
 * Input stok lama (satuan).
 * Tidak memotong kas (kasEntry tidak dibuat), sesuai kebijakan user untuk saldo awal.
 */
export async function inputStokLama(data: DataStokLamaUnit, txExternal?: Tx) {
  if (!data.brand?.trim()) throw new KesalahanBisnis("Brand wajib diisi");
  if (!data.model?.trim()) throw new KesalahanBisnis("Model wajib diisi");
  if (data.hargaBeli <= 0) throw new KesalahanBisnis("Harga beli harus lebih dari Rp 0");

  const status = data.status ?? "READY";
  const gradeFinal = status === "READY" ? (data.grade ?? "B") : null;

  const jalankan = async (tx: Tx) => {
    const slug = slugBrand(data.brand);
    const urut = await nomorBerikutnya(tx, `UNIT:${slug}`);
    const kodeUnit = `${slug}-${String(urut).padStart(3, "0")}`;

    const tglMasuk = status === "READY" ? (data.tglMasukInventory ?? data.tglBeli) : null;

    const unit = await tx.unit.create({
      data: {
        kodeUnit,
        brand: data.brand.trim(),
        model: data.model.trim(),
        hargaBeli: new Prisma.Decimal(data.hargaBeli),
        hpp: new Prisma.Decimal(data.hargaBeli),
        totalBiayaService: new Prisma.Decimal(0),
        hargaJual:
          data.hargaJual !== undefined && data.hargaJual !== null && data.hargaJual > 0
            ? new Prisma.Decimal(data.hargaJual)
            : null,
        status,
        grade: gradeFinal,
        adaBox: data.adaBox ?? false,
        adaSurat: data.adaSurat ?? false,
        adaBuku: data.adaBuku ?? false,
        adaExtraLink: data.adaExtraLink ?? false,
        adaSertifikat: data.adaSertifikat ?? false,
        catatanKondisi: data.catatanKondisi?.trim() || null,
        catatan: data.catatan?.trim() || null,
        tglBeli: data.tglBeli,
        tglMasukInventory: tglMasuk,
      },
    });

    await tx.stokLedger.create({
      data: {
        unitId: unit.id,
        jenis: "MASUK_BELI",
        qty: 1,
        tanggal: data.tglBeli,
        keterangan: `Stok lama / awal: ${unit.kodeUnit}`,
      },
    });

    if (status === "READY") {
      await tx.qcRecord.create({
        data: {
          unitId: unit.id,
          hasil: "LOLOS",
          keterangan: "Stok awal langsung lolos QC",
          tanggal: tglMasuk ?? data.tglBeli,
        },
      });

      await tx.stokLedger.create({
        data: {
          unitId: unit.id,
          jenis: "MASUK_QC_LOLOS",
          qty: 0,
          tanggal: tglMasuk ?? data.tglBeli,
          keterangan: `Stok awal  -  grade ${gradeFinal}`,
        },
      });
    }

    return unit;
  };

  if (txExternal) {
    return jalankan(txExternal);
  }
  return getPrisma().$transaction(jalankan);
}

/** Import batch stok lama jam dari Excel/CSV */
export async function importStokLamaBatch(items: DataStokLamaUnit[]) {
  if (!items || items.length === 0) {
    throw new KesalahanBisnis("Tidak ada data unit untuk diimport");
  }

  return getPrisma().$transaction(async (tx) => {
    const hasil = [];
    for (const item of items) {
      const unit = await inputStokLama(item, tx);
      hasil.push(unit);
    }
    return hasil;
  });
}

