// Logika tiket service: tambah/hapus komponen, dan penyelesaian service.
// Setiap perubahan biaya memicu perhitungan ulang HPP unit.
//
// Dua sumber komponen:
//   1. Ambil dari stok sparepart  -> biaya = qty x harga rata-rata, kas TIDAK
//      berkurang (uangnya sudah keluar saat sparepart dibeli).
//   2. Beli langsung / jasa tukang -> biaya diketik manual, kas berkurang
//      saat itu juga.

import { Prisma, type JenisKomponen } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis, hapusKasReferensi } from "@/lib/kas";
import { kembalikanSparepart, pakaiSparepart } from "@/lib/sparepart";
import { hitungUlangHpp } from "@/lib/unit";

type Tx = Prisma.TransactionClient;

async function segarkanTotalService(tx: Tx, serviceId: string) {
  const agregat = await tx.serviceItem.aggregate({
    where: { serviceId },
    _sum: { biaya: true },
  });
  await tx.service.update({
    where: { id: serviceId },
    data: { totalBiaya: agregat._sum.biaya ?? new Prisma.Decimal(0) },
  });
}

export interface DataItemService {
  jenis: JenisKomponen;
  deskripsi?: string | null;
  /** Diisi kalau komponen dibeli langsung / jasa tukang */
  biaya?: number | null;
  /** Diisi kalau komponen diambil dari stok sparepart */
  sparepartId?: string | null;
  qty?: number | null;
}

/** Tambah satu komponen ke tiket service yang masih PROSES. */
export async function tambahItemService(serviceId: string, data: DataItemService) {
  const dariStok = !!data.sparepartId;

  if (!dariStok) {
    if (!data.biaya || data.biaya <= 0) {
      throw new KesalahanBisnis("Biaya harus lebih dari Rp 0");
    }
    if (data.jenis === "LAINNYA" && !data.deskripsi?.trim()) {
      throw new KesalahanBisnis('Deskripsi wajib diisi untuk jenis "LAINNYA"');
    }
  } else if (!data.qty || data.qty <= 0) {
    throw new KesalahanBisnis("Jumlah pemakaian sparepart harus lebih dari 0");
  }

  return getPrisma().$transaction(async (tx) => {
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        unitId: true,
        status: true,
        unit: { select: { kodeUnit: true } },
      },
    });
    if (!service) throw new KesalahanBisnis("Tiket service tidak ditemukan", 404);
    if (service.status !== "PROSES") {
      throw new KesalahanBisnis("Tiket service sudah selesai — tidak bisa ditambah biaya lagi");
    }

    const sekarang = new Date();

    // Dibuat dulu dengan biaya 0, lalu diisi setelah harga stok diketahui.
    const item = await tx.serviceItem.create({
      data: {
        serviceId,
        jenis: data.jenis,
        deskripsi: data.deskripsi?.trim() || null,
        biaya: new Prisma.Decimal(dariStok ? 0 : data.biaya!),
        sparepartId: data.sparepartId ?? null,
        qty: dariStok ? data.qty! : null,
      },
    });

    if (dariStok) {
      const total = await pakaiSparepart(
        tx,
        data.sparepartId!,
        data.qty!,
        sekarang,
        item.id,
        `Dipakai pada ${service.unit.kodeUnit}`
      );
      await tx.serviceItem.update({
        where: { id: item.id },
        data: { biaya: new Prisma.Decimal(total) },
      });
    } else {
      await catatKasOtomatis(tx, {
        tanggal: sekarang,
        jenis: "BIAYA_SERVICE",
        jumlah: data.biaya!,
        keterangan: `${service.unit.kodeUnit} (${data.jenis})${
          data.deskripsi?.trim() ? ` — ${data.deskripsi.trim()}` : ""
        }`,
        referensiTipe: "ServiceItem",
        referensiId: item.id,
      });
    }

    await segarkanTotalService(tx, serviceId);
    await hitungUlangHpp(tx, service.unitId);

    return item;
  });
}

/** Hapus satu komponen dari tiket service yang masih PROSES. */
export async function hapusItemService(itemId: string) {
  return getPrisma().$transaction(async (tx) => {
    const item = await tx.serviceItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        serviceId: true,
        sparepartId: true,
        service: { select: { unitId: true, status: true } },
      },
    });
    if (!item) throw new KesalahanBisnis("Komponen tidak ditemukan", 404);
    if (item.service.status !== "PROSES") {
      throw new KesalahanBisnis("Tiket service sudah selesai — biaya tidak bisa diubah");
    }

    if (item.sparepartId) {
      await kembalikanSparepart(tx, item.id);
    } else {
      await hapusKasReferensi(tx, "ServiceItem", item.id);
    }

    await tx.serviceItem.delete({ where: { id: itemId } });
    await segarkanTotalService(tx, item.serviceId);
    await hitungUlangHpp(tx, item.service.unitId);

    return { ok: true };
  });
}

/** Service selesai -> unit kembali ke antrian QC untuk diperiksa ulang. */
export async function selesaikanService(serviceId: string) {
  return getPrisma().$transaction(async (tx) => {
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      include: { unit: { select: { id: true, kodeUnit: true, status: true } } },
    });
    if (!service) throw new KesalahanBisnis("Tiket service tidak ditemukan", 404);
    if (service.status !== "PROSES") {
      throw new KesalahanBisnis("Tiket service ini sudah selesai");
    }
    if (service.unit.status !== "SERVICE") {
      throw new KesalahanBisnis(
        `Unit ${service.unit.kodeUnit} tidak sedang di bengkel (status: ${service.unit.status})`
      );
    }

    const sekarang = new Date();

    await tx.service.update({
      where: { id: serviceId },
      data: { status: "SELESAI", tglSelesai: sekarang },
    });

    await tx.unit.update({
      where: { id: service.unitId },
      data: { status: "MASUK_QC" },
    });

    await tx.stokLedger.create({
      data: {
        unitId: service.unitId,
        jenis: "MASUK_SERVICE_SELESAI",
        qty: 0,
        tanggal: sekarang,
        referensiId: serviceId,
        keterangan: "Service selesai, kembali ke antrian QC",
      },
    });

    return { ok: true };
  });
}
