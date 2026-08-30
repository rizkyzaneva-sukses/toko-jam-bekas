// Biaya operasional toko — sewa, gaji, listrik, dan sejenisnya.
//
// Berbeda dengan biaya service yang menempel pada sebuah jam, biaya
// operasional adalah beban periode: diakui penuh pada bulan terjadinya,
// tidak menunggu barang terjual.

import { KategoriBiaya } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis, hapusKasReferensi } from "@/lib/kas";
import { rentangBulanWIB, toNumber } from "@/lib/utils";

export const LABEL_KATEGORI: Record<KategoriBiaya, string> = {
  SEWA: "Sewa Tempat",
  GAJI: "Gaji & Upah",
  LISTRIK: "Listrik",
  AIR: "Air",
  INTERNET: "Internet & Telepon",
  TRANSPORT: "Transport & Bensin",
  PERLENGKAPAN: "Perlengkapan Toko",
  PEMASARAN: "Pemasaran & Iklan",
  PAJAK_RETRIBUSI: "Pajak & Retribusi",
  LAINNYA: "Lainnya",
};

export interface DataBiaya {
  tanggal: Date;
  kategori: KategoriBiaya;
  deskripsi: string;
  jumlah: number;
  catatan?: string | null;
}

export async function buatBiaya(data: DataBiaya) {
  if (!data.deskripsi.trim()) throw new KesalahanBisnis("Deskripsi wajib diisi");
  if (data.jumlah <= 0) throw new KesalahanBisnis("Jumlah harus lebih dari Rp 0");

  return getPrisma().$transaction(async (tx) => {
    const biaya = await tx.biayaOperasional.create({
      data: {
        tanggal: data.tanggal,
        kategori: data.kategori,
        deskripsi: data.deskripsi.trim(),
        jumlah: data.jumlah,
        catatan: data.catatan?.trim() || null,
      },
    });

    await catatKasOtomatis(tx, {
      tanggal: data.tanggal,
      jenis: "BIAYA_OPERASIONAL",
      jumlah: data.jumlah,
      keterangan: `${LABEL_KATEGORI[data.kategori]} — ${biaya.deskripsi}`,
      referensiTipe: "BiayaOperasional",
      referensiId: biaya.id,
    });

    return biaya;
  });
}

export async function hapusBiaya(id: string) {
  return getPrisma().$transaction(async (tx) => {
    const biaya = await tx.biayaOperasional.findUnique({ where: { id } });
    if (!biaya) throw new KesalahanBisnis("Biaya tidak ditemukan", 404);

    await hapusKasReferensi(tx, "BiayaOperasional", id);
    await tx.biayaOperasional.delete({ where: { id } });
    return biaya;
  });
}

export interface RingkasanBiaya {
  total: number;
  perKategori: { kategori: KategoriBiaya; label: string; jumlah: number }[];
}

/** Total biaya operasional satu bulan, dirinci per kategori. */
export async function ringkasanBiaya(bulan: string): Promise<RingkasanBiaya> {
  const { dari, sampai } = rentangBulanWIB(bulan);

  const rows = await getPrisma().biayaOperasional.groupBy({
    by: ["kategori"],
    where: { tanggal: { gte: dari, lt: sampai } },
    _sum: { jumlah: true },
  });

  const perKategori = rows
    .map((r) => ({
      kategori: r.kategori,
      label: LABEL_KATEGORI[r.kategori],
      jumlah: toNumber(r._sum.jumlah),
    }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return {
    total: perKategori.reduce((t, k) => t + k.jumlah, 0),
    perKategori,
  };
}
