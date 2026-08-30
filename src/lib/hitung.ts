// Rumus bisnis murni — tanpa akses database, supaya bisa diuji langsung.
// Aturan lengkapnya ada di PRD-toko-jam-bekas.md §7 (Business Logic Hardcoded).

export type StatusBayarStr = "LUNAS" | "SEBAGIAN" | "BELUM_LUNAS";
export type PenanggungOngkirStr = "PEMBELI" | "TOKO";

/** HPP unit = harga beli + seluruh biaya service yang menempel padanya. */
export function hitungHpp(hargaBeli: number, totalBiayaService: number): number {
  return hargaBeli + totalBiayaService;
}

/** Laba per unit terjual = harga jual − HPP saat jual. */
export function hitungLabaUnit(hargaJual: number, hppSaatJual: number): number {
  return hargaJual - hppSaatJual;
}

export interface KomponenLabaRugi {
  omzet: number;
  modal: number;
  biayaService: number;
  kerugianRusak: number;
  /** Susut/rusak/hilang pada persediaan sparepart (stok opname) */
  kerugianSparepart?: number;
  ongkirToko: number;
}

/**
 * Laba kotor barang — hasil dari jual-beli jam saja.
 * = omzet − modal − biaya service − kerugian rusak − kerugian sparepart − ongkir toko
 */
export function hitungLabaKotorBarang(k: KomponenLabaRugi): number {
  return (
    k.omzet -
    k.modal -
    k.biayaService -
    k.kerugianRusak -
    (k.kerugianSparepart ?? 0) -
    k.ongkirToko
  );
}

/**
 * Laba bersih usaha — setelah dikurangi beban menjalankan toko
 * (sewa, gaji, listrik, dan sejenisnya).
 */
export function hitungLabaBersihUsaha(
  labaKotorBarang: number,
  biayaOperasional: number
): number {
  return labaKotorBarang - biayaOperasional;
}

/** Saldo kas = seluruh uang masuk − seluruh uang keluar. */
export function hitungSaldoKas(totalMasuk: number, totalKeluar: number): number {
  return totalMasuk - totalKeluar;
}

/**
 * Berapa seharusnya saldo kas, dihitung dari sisi lain.
 *
 *   Saldo Kas = Modal Disetor − Prive + Laba Kumulatif
 *               − Nilai Persediaan − Piutang
 *
 * Semua angkanya sejak app mulai dipakai, jadi tidak perlu saldo awal.
 * Kalau hasilnya sama dengan saldo kas sesungguhnya, berarti seluruh
 * transaksi sudah tercatat lengkap.
 */
export function saldoKasSeharusnya(input: {
  modalDisetor: number;
  prive: number;
  labaKumulatif: number;
  nilaiPersediaan: number;
  piutang: number;
}): number {
  return (
    input.modalDisetor -
    input.prive +
    input.labaKumulatif -
    input.nilaiPersediaan -
    input.piutang
  );
}

/**
 * Total yang ditagih ke pembeli.
 * Ongkir yang ditanggung TOKO tidak ditagih — ia jadi beban toko.
 */
export function hitungTotalTagihan(
  subtotal: number,
  ongkir: number,
  penanggung: PenanggungOngkirStr
): number {
  return penanggung === "PEMBELI" ? subtotal + ongkir : subtotal;
}

/** Status bayar dari total tagihan vs yang sudah dibayar. */
export function hitungStatusBayar(totalTagihan: number, totalDibayar: number): StatusBayarStr {
  if (totalDibayar >= totalTagihan) return "LUNAS";
  if (totalDibayar > 0) return "SEBAGIAN";
  return "BELUM_LUNAS";
}

/** Brand -> awalan kode unit. "Casio G-Shock" -> "CASIOGSHOCK" */
export function slugBrand(brand: string): string {
  const bersih = brand
    .toUpperCase()
    .normalize("NFD")
    .replace(/[^A-Z0-9]/g, "");
  return (bersih || "UNIT").slice(0, 12);
}

/** Bucket umur stok. Dashboard menyorot yang lebih dari 30 hari. */
export function bucketUmur(hari: number): "0-30" | "31-60" | "61-90" | ">90" {
  if (hari <= 30) return "0-30";
  if (hari <= 60) return "31-60";
  if (hari <= 90) return "61-90";
  return ">90";
}
