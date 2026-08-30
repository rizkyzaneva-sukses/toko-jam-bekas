// Penamaan unit jam.
//
// Nama dasar   : "Seiko 1002"                                — dipakai untuk MENGELOMPOKKAN
// Nama lengkap : "Seiko 1002 (Ganti Batre, Ganti Strap)"     — dipakai untuk MENAMPILKAN
//
// Imbuhan dalam kurung diambil dari komponen yang pernah diganti pada unit itu.
// Ranking produk dan pengelompokan apa pun WAJIB memakai nama dasar — kalau tidak,
// satu model yang sama akan terpecah jadi banyak baris hanya karena servicenya beda.

import { LABEL_KOMPONEN, type JenisKomponenStr } from "@/lib/tipe";

const MAKS_HURUF_LAINNYA = 30;

function kapitalPerKata(teks: string): string {
  return teks
    .trim()
    .split(/\s+/)
    .map((k) => (k ? k[0].toUpperCase() + k.slice(1) : k))
    .join(" ");
}

export interface ItemServiceRingkas {
  jenis: JenisKomponenStr | string;
  deskripsi?: string | null;
}

/**
 * Label satu komponen service.
 * Jenis baku -> "Ganti Batre". Jenis LAINNYA -> memakai deskripsinya,
 * karena "Ganti Lainnya" tidak memberi tahu apa pun.
 */
export function labelService(item: ItemServiceRingkas): string {
  if (item.jenis === "LAINNYA") {
    const teks = (item.deskripsi ?? "").trim();
    if (!teks) return "Service Lain";
    const dipotong =
      teks.length > MAKS_HURUF_LAINNYA ? teks.slice(0, MAKS_HURUF_LAINNYA - 1) + "…" : teks;
    return kapitalPerKata(dipotong);
  }
  const nama = LABEL_KOMPONEN[item.jenis as JenisKomponenStr] ?? item.jenis;
  return `Ganti ${nama}`;
}

/**
 * Daftar label service sebuah unit, urut waktu, tanpa pengulangan.
 * Batre yang diganti dua kali tetap tampil sekali — yang penting jenis
 * pekerjaannya, bukan berapa kali dikerjakan.
 */
export function ringkasService(items: ItemServiceRingkas[]): string[] {
  const hasil: string[] = [];
  for (const item of items) {
    const label = labelService(item);
    if (!hasil.includes(label)) hasil.push(label);
  }
  return hasil;
}

/** "Seiko 1002" — kunci pengelompokan untuk ranking produk. */
export function namaDasar(brand: string, model: string): string {
  return [brand, model].filter(Boolean).join(" ").trim();
}

/** "Seiko 1002 (Ganti Batre, Ganti Strap)" — untuk ditampilkan. */
export function namaLengkap(brand: string, model: string, labelServis: string[]): string {
  const dasar = namaDasar(brand, model);
  if (labelServis.length === 0) return dasar;
  return `${dasar} (${labelServis.join(", ")})`;
}

/** Jalan pintas dari daftar item service langsung ke nama lengkap. */
export function namaUnitDariItems(
  brand: string,
  model: string,
  items: ItemServiceRingkas[]
): { namaDasar: string; namaLengkap: string; labelService: string[] } {
  const labelServis = ringkasService(items);
  return {
    namaDasar: namaDasar(brand, model),
    namaLengkap: namaLengkap(brand, model, labelServis),
    labelService: labelServis,
  };
}
