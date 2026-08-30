// Stok sparepart — persediaan batre, strap, kaca, mesin, dll.
//
// Aturan uang yang paling penting di modul ini:
//   - Membeli sparepart  = uang KELUAR dari kas, nilainya masuk ke persediaan.
//   - Memakai sparepart  = TIDAK ada uang keluar. Nilainya berpindah dari
//     persediaan sparepart ke HPP unit jam.
// Kalau keduanya sama-sama memotong kas, biayanya terhitung dua kali.
//
// Harga pokok memakai rata-rata bergerak (moving average).

import { JenisKomponen, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis, hapusKasReferensi } from "@/lib/kas";
import { nomorBerikutnya } from "@/lib/unit";
import { rentangBulanWIB, toNumber } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

/** Rata-rata bergerak setelah pembelian baru. */
export function hitungHargaRataBaru(
  stokLama: number,
  rataLama: number,
  qtyMasuk: number,
  hargaMasuk: number
): number {
  const totalQty = stokLama + qtyMasuk;
  if (totalQty <= 0) return hargaMasuk;
  const nilai = stokLama * rataLama + qtyMasuk * hargaMasuk;
  return Math.round(nilai / totalQty);
}

export interface DataSparepart {
  nama: string;
  jenis: JenisKomponen;
  satuan?: string;
  minStok?: number;
  catatan?: string | null;
}

export async function buatSparepart(data: DataSparepart) {
  if (!data.nama.trim()) throw new KesalahanBisnis("Nama sparepart wajib diisi");

  return getPrisma().$transaction(async (tx) => {
    const urut = await nomorBerikutnya(tx, `SP:${data.jenis}`);
    const kode = `${data.jenis}-${String(urut).padStart(2, "0")}`;

    return tx.sparepart.create({
      data: {
        kode,
        nama: data.nama.trim(),
        jenis: data.jenis,
        satuan: data.satuan?.trim() || "pcs",
        minStok: data.minStok ?? 0,
        catatan: data.catatan?.trim() || null,
      },
    });
  });
}

export interface DataIsiStok {
  qty: number;
  hargaSatuan: number;
  tanggal: Date;
  keterangan?: string | null;
}

/** Pengisian stok — uang keluar dari kas, harga rata-rata dihitung ulang. */
export async function isiStokSparepart(sparepartId: string, data: DataIsiStok) {
  if (data.qty <= 0) throw new KesalahanBisnis("Jumlah harus lebih dari 0");
  if (data.hargaSatuan <= 0) throw new KesalahanBisnis("Harga satuan harus lebih dari Rp 0");

  return getPrisma().$transaction(async (tx) => {
    const sp = await tx.sparepart.findUnique({ where: { id: sparepartId } });
    if (!sp) throw new KesalahanBisnis("Sparepart tidak ditemukan", 404);

    const total = data.qty * data.hargaSatuan;
    const stokBaru = sp.stok + data.qty;
    const rataBaru = hitungHargaRataBaru(
      sp.stok,
      toNumber(sp.hargaRata),
      data.qty,
      data.hargaSatuan
    );

    await tx.sparepart.update({
      where: { id: sparepartId },
      data: { stok: stokBaru, hargaRata: new Prisma.Decimal(rataBaru) },
    });

    const mutasi = await tx.mutasiSparepart.create({
      data: {
        sparepartId,
        jenis: "MASUK_BELI",
        qty: data.qty,
        hargaSatuan: new Prisma.Decimal(data.hargaSatuan),
        total: new Prisma.Decimal(total),
        stokSesudah: stokBaru,
        keterangan: data.keterangan?.trim() || null,
        tanggal: data.tanggal,
      },
    });

    await catatKasOtomatis(tx, {
      tanggal: data.tanggal,
      jenis: "BELI_SPAREPART",
      jumlah: total,
      keterangan: `${sp.nama} — ${data.qty} ${sp.satuan}`,
      referensiTipe: "MutasiSparepart",
      referensiId: mutasi.id,
    });

    return mutasi;
  });
}

/**
 * Stok opname. Selisih kurang dicatat sebagai kerugian persediaan
 * (masuk ke Laporan L/R), selisih lebih menambah persediaan tanpa kas.
 */
export async function sesuaikanStokSparepart(
  sparepartId: string,
  stokBaru: number,
  tanggal: Date,
  keterangan: string
) {
  if (stokBaru < 0) throw new KesalahanBisnis("Stok tidak boleh negatif");
  if (!keterangan.trim()) throw new KesalahanBisnis("Alasan penyesuaian wajib diisi");

  return getPrisma().$transaction(async (tx) => {
    const sp = await tx.sparepart.findUnique({ where: { id: sparepartId } });
    if (!sp) throw new KesalahanBisnis("Sparepart tidak ditemukan", 404);

    const selisih = stokBaru - sp.stok;
    if (selisih === 0) throw new KesalahanBisnis("Stok tidak berubah — tidak ada yang dicatat");

    const rata = toNumber(sp.hargaRata);
    const qty = Math.abs(selisih);

    await tx.sparepart.update({ where: { id: sparepartId }, data: { stok: stokBaru } });

    return tx.mutasiSparepart.create({
      data: {
        sparepartId,
        jenis: selisih > 0 ? "PENYESUAIAN_TAMBAH" : "PENYESUAIAN_KURANG",
        qty,
        hargaSatuan: new Prisma.Decimal(rata),
        total: new Prisma.Decimal(qty * rata),
        stokSesudah: stokBaru,
        keterangan: keterangan.trim(),
        tanggal,
      },
    });
  });
}

/**
 * Ambil sparepart dari stok untuk dipakai pada sebuah service.
 * Mengembalikan total biaya yang akan menempel ke HPP unit.
 * Tidak menyentuh kas — uangnya sudah keluar saat sparepart dibeli.
 */
export async function pakaiSparepart(
  tx: Tx,
  sparepartId: string,
  qty: number,
  tanggal: Date,
  serviceItemId: string,
  keterangan: string
): Promise<number> {
  if (qty <= 0) throw new KesalahanBisnis("Jumlah pemakaian harus lebih dari 0");

  const sp = await tx.sparepart.findUnique({ where: { id: sparepartId } });
  if (!sp) throw new KesalahanBisnis("Sparepart tidak ditemukan", 404);
  if (sp.stok < qty) {
    throw new KesalahanBisnis(
      `Stok ${sp.nama} tinggal ${sp.stok} ${sp.satuan}, tidak cukup untuk ${qty}.`
    );
  }

  const rata = toNumber(sp.hargaRata);
  const total = qty * rata;
  const stokSesudah = sp.stok - qty;

  await tx.sparepart.update({ where: { id: sparepartId }, data: { stok: stokSesudah } });

  await tx.mutasiSparepart.create({
    data: {
      sparepartId,
      jenis: "KELUAR_PAKAI",
      qty,
      hargaSatuan: new Prisma.Decimal(rata),
      total: new Prisma.Decimal(total),
      stokSesudah,
      keterangan,
      referensiId: serviceItemId,
      tanggal,
    },
  });

  return total;
}

/** Kembalikan sparepart ke stok saat komponen service dihapus. */
export async function kembalikanSparepart(tx: Tx, serviceItemId: string): Promise<void> {
  const mutasi = await tx.mutasiSparepart.findFirst({
    where: { referensiId: serviceItemId, jenis: "KELUAR_PAKAI" },
  });
  if (!mutasi) return;

  const sp = await tx.sparepart.findUnique({ where: { id: mutasi.sparepartId } });
  if (sp) {
    await tx.sparepart.update({
      where: { id: sp.id },
      data: { stok: sp.stok + mutasi.qty },
    });
  }
  await tx.mutasiSparepart.delete({ where: { id: mutasi.id } });
}

export async function hapusSparepart(id: string) {
  return getPrisma().$transaction(async (tx) => {
    const sp = await tx.sparepart.findUnique({
      where: { id },
      select: { id: true, nama: true, stok: true },
    });
    if (!sp) throw new KesalahanBisnis("Sparepart tidak ditemukan", 404);

    const terpakai = await tx.serviceItem.count({ where: { sparepartId: id } });
    if (terpakai > 0) {
      throw new KesalahanBisnis(
        `${sp.nama} sudah pernah dipakai di ${terpakai} service — tidak bisa dihapus. Nonaktifkan saja supaya riwayatnya tetap utuh.`
      );
    }

    // Bersihkan baris kas dari pengisian stok yang pernah dilakukan
    const mutasi = await tx.mutasiSparepart.findMany({
      where: { sparepartId: id },
      select: { id: true },
    });
    for (const m of mutasi) {
      await hapusKasReferensi(tx, "MutasiSparepart", m.id);
    }

    await tx.sparepart.delete({ where: { id } });
    return sp;
  });
}

/** Total nilai persediaan sparepart saat ini. */
export async function nilaiPersediaanSparepart(): Promise<number> {
  const rows = await getPrisma().sparepart.findMany({
    select: { stok: true, hargaRata: true },
  });
  return rows.reduce((t, r) => t + r.stok * toNumber(r.hargaRata), 0);
}

/** Kerugian persediaan sparepart (penyesuaian kurang) dalam satu bulan. */
export async function kerugianSparepart(bulan: string): Promise<number> {
  const { dari, sampai } = rentangBulanWIB(bulan);
  const hasil = await getPrisma().mutasiSparepart.aggregate({
    where: { jenis: "PENYESUAIAN_KURANG", tanggal: { gte: dari, lt: sampai } },
    _sum: { total: true },
  });
  return toNumber(hasil._sum.total);
}
