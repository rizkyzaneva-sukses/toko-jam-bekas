// Buku kas tunggal.
//
// Prinsip: setiap transaksi bisnis yang menggerakkan uang WAJIB menulis satu
// baris kas di dalam transaksi database yang sama. Kalau tidak, saldo kas akan
// berbeda dengan kenyataan dan tidak ada gunanya.
//
// Baris `otomatis` tidak bisa disunting atau dihapus dari layar — ia ikut
// hidup-mati bersama transaksi asalnya.

import { ArahKas, JenisKas, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { rentangBulanWIB, toNumber } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

/** Arah uang untuk setiap jenis mutasi kas. */
export const ARAH_KAS: Record<JenisKas, ArahKas> = {
  MODAL_MASUK: "MASUK",
  PRIVE: "KELUAR",
  LAINNYA_MASUK: "MASUK",
  LAINNYA_KELUAR: "KELUAR",
  PENYESUAIAN_MASUK: "MASUK",
  PENYESUAIAN_KELUAR: "KELUAR",
  BELI_UNIT: "KELUAR",
  BIAYA_SERVICE: "KELUAR",
  BELI_SPAREPART: "KELUAR",
  PENJUALAN: "MASUK",
  PELUNASAN_PIUTANG: "MASUK",
  ONGKIR_TOKO: "KELUAR",
  BIAYA_OPERASIONAL: "KELUAR",
};

/** Jenis yang boleh diinput sendiri oleh pengguna. Sisanya dibuat sistem. */
export const JENIS_KAS_MANUAL: JenisKas[] = [
  "MODAL_MASUK",
  "PRIVE",
  "LAINNYA_MASUK",
  "LAINNYA_KELUAR",
  "PENYESUAIAN_MASUK",
  "PENYESUAIAN_KELUAR",
];

export const LABEL_KAS: Record<JenisKas, string> = {
  MODAL_MASUK: "Setor Modal",
  PRIVE: "Prive (tarik pribadi)",
  LAINNYA_MASUK: "Pemasukan Lain",
  LAINNYA_KELUAR: "Pengeluaran Lain",
  PENYESUAIAN_MASUK: "Penyesuaian — Lebih",
  PENYESUAIAN_KELUAR: "Penyesuaian — Kurang",
  BELI_UNIT: "Beli Unit Jam",
  BIAYA_SERVICE: "Biaya Service",
  BELI_SPAREPART: "Beli Sparepart",
  PENJUALAN: "Penerimaan Penjualan",
  PELUNASAN_PIUTANG: "Pelunasan Piutang",
  ONGKIR_TOKO: "Ongkir Ditanggung Toko",
  BIAYA_OPERASIONAL: "Biaya Operasional",
};

export interface DataKas {
  tanggal: Date;
  jenis: JenisKas;
  jumlah: number;
  keterangan?: string | null;
  referensiTipe?: string | null;
  referensiId?: string | null;
}

/**
 * Tulis satu baris kas otomatis. Dipanggil dari dalam transaksi service layer.
 * Jumlah nol diabaikan supaya buku kas tidak penuh baris kosong.
 */
export async function catatKasOtomatis(tx: Tx, data: DataKas): Promise<void> {
  if (data.jumlah <= 0) return;
  await tx.kasEntry.create({
    data: {
      tanggal: data.tanggal,
      jenis: data.jenis,
      arah: ARAH_KAS[data.jenis],
      jumlah: new Prisma.Decimal(data.jumlah),
      keterangan: data.keterangan?.trim() || null,
      referensiTipe: data.referensiTipe ?? null,
      referensiId: data.referensiId ?? null,
      otomatis: true,
    },
  });
}

/** Hapus baris kas otomatis milik sebuah entitas — dipakai saat aksi dibatalkan. */
export async function hapusKasReferensi(
  tx: Tx,
  referensiTipe: string,
  referensiId: string,
  jenis?: JenisKas
): Promise<void> {
  await tx.kasEntry.deleteMany({
    where: { referensiTipe, referensiId, otomatis: true, ...(jenis ? { jenis } : {}) },
  });
}

/** Input manual: setor modal, prive, pemasukan/pengeluaran lain, penyesuaian. */
export async function catatKasManual(data: DataKas) {
  if (!JENIS_KAS_MANUAL.includes(data.jenis)) {
    throw new KesalahanBisnis(
      `${LABEL_KAS[data.jenis]} dicatat otomatis oleh sistem — tidak bisa diinput manual.`
    );
  }
  if (data.jumlah <= 0) throw new KesalahanBisnis("Jumlah harus lebih dari Rp 0");

  return getPrisma().kasEntry.create({
    data: {
      tanggal: data.tanggal,
      jenis: data.jenis,
      arah: ARAH_KAS[data.jenis],
      jumlah: new Prisma.Decimal(data.jumlah),
      keterangan: data.keterangan?.trim() || null,
      otomatis: false,
    },
  });
}

export async function hapusKasManual(id: string) {
  const baris = await getPrisma().kasEntry.findUnique({ where: { id } });
  if (!baris) throw new KesalahanBisnis("Baris kas tidak ditemukan", 404);
  if (baris.otomatis) {
    throw new KesalahanBisnis(
      "Baris ini dibuat otomatis dari transaksi lain. Batalkan transaksi asalnya, jangan hapus dari sini."
    );
  }
  await getPrisma().kasEntry.delete({ where: { id } });
  return baris;
}

/** Saldo kas sampai satu titik waktu. Tanpa argumen = saldo saat ini. */
export async function saldoKas(sampai?: Date): Promise<number> {
  const hasil = await getPrisma().kasEntry.groupBy({
    by: ["arah"],
    where: sampai ? { tanggal: { lt: sampai } } : undefined,
    _sum: { jumlah: true },
  });
  const masuk = toNumber(hasil.find((h) => h.arah === "MASUK")?._sum.jumlah);
  const keluar = toNumber(hasil.find((h) => h.arah === "KELUAR")?._sum.jumlah);
  return masuk - keluar;
}

export interface BarisKas {
  id: string;
  tanggal: string;
  jenis: JenisKas;
  label: string;
  arah: ArahKas;
  jumlah: number;
  keterangan: string | null;
  referensiTipe: string | null;
  referensiId: string | null;
  otomatis: boolean;
  saldoBerjalan: number;
}

export interface RingkasanKas {
  periode: { bulan: string };
  saldoAwal: number;
  saldoAkhir: number;
  totalMasuk: number;
  totalKeluar: number;
  modalMasuk: number;
  prive: number;
  perJenis: { jenis: JenisKas; label: string; arah: ArahKas; jumlah: number }[];
  baris: BarisKas[];
}

/** Mutasi kas satu bulan, lengkap dengan saldo berjalan per baris. */
export async function ringkasanKas(bulan: string): Promise<RingkasanKas> {
  const prisma = getPrisma();
  const { dari, sampai } = rentangBulanWIB(bulan);

  const [saldoAwal, entries] = await Promise.all([
    saldoKas(dari),
    prisma.kasEntry.findMany({
      where: { tanggal: { gte: dari, lt: sampai } },
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  let berjalan = saldoAwal;
  let totalMasuk = 0;
  let totalKeluar = 0;
  const perJenis = new Map<JenisKas, number>();

  const baris: BarisKas[] = entries.map((e) => {
    const jumlah = toNumber(e.jumlah);
    if (e.arah === "MASUK") {
      berjalan += jumlah;
      totalMasuk += jumlah;
    } else {
      berjalan -= jumlah;
      totalKeluar += jumlah;
    }
    perJenis.set(e.jenis, (perJenis.get(e.jenis) ?? 0) + jumlah);

    return {
      id: e.id,
      tanggal: e.tanggal.toISOString(),
      jenis: e.jenis,
      label: LABEL_KAS[e.jenis],
      arah: e.arah,
      jumlah,
      keterangan: e.keterangan,
      referensiTipe: e.referensiTipe,
      referensiId: e.referensiId,
      otomatis: e.otomatis,
      saldoBerjalan: berjalan,
    };
  });

  return {
    periode: { bulan },
    saldoAwal,
    saldoAkhir: berjalan,
    totalMasuk,
    totalKeluar,
    modalMasuk: perJenis.get("MODAL_MASUK") ?? 0,
    prive: perJenis.get("PRIVE") ?? 0,
    perJenis: [...perJenis.entries()]
      .map(([jenis, jumlah]) => ({
        jenis,
        label: LABEL_KAS[jenis],
        arah: ARAH_KAS[jenis],
        jumlah,
      }))
      .sort((a, b) => b.jumlah - a.jumlah),
    // Baris terbaru di atas saat ditampilkan
    baris: baris.reverse(),
  };
}

/** Total modal yang pernah disetor dikurangi prive, sepanjang waktu. */
export async function modalBersih(): Promise<{ disetor: number; prive: number }> {
  const hasil = await getPrisma().kasEntry.groupBy({
    by: ["jenis"],
    where: { jenis: { in: ["MODAL_MASUK", "PRIVE"] } },
    _sum: { jumlah: true },
  });
  return {
    disetor: toNumber(hasil.find((h) => h.jenis === "MODAL_MASUK")?._sum.jumlah),
    prive: toNumber(hasil.find((h) => h.jenis === "PRIVE")?._sum.jumlah),
  };
}
