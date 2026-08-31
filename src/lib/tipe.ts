// Tipe yang dipakai bersama oleh API dan komponen klien.
// Semua nilai uang sudah berupa number biasa (bukan Decimal) saat sampai ke klien.

export type StatusUnitStr = "MASUK_QC" | "SERVICE" | "READY" | "TERJUAL" | "RUSAK";
export type GradeStr = "A" | "B" | "C";
export type JenisKomponenStr = "BATRE" | "STRAP" | "KACA" | "MESIN" | "LAINNYA";
export type TipePembeliStr = "B2B" | "B2C";
export type ChannelStr = "OFFLINE" | "WA_SOSMED";
export type PenanggungOngkirStr = "PEMBELI" | "TOKO";
export type MetodeBayarStr = "CASH" | "PIUTANG";
export type StatusBayarStr = "LUNAS" | "SEBAGIAN" | "BELUM_LUNAS";

export interface UnitRingkas {
  id: string;
  kodeUnit: string;
  brand: string;
  model: string;
  /** "Seiko 1002"  -  kunci pengelompokan, tidak berubah oleh service */
  namaDasar: string;
  /** "Seiko 1002 (Ganti Batre, Ganti Strap)"  -  untuk ditampilkan */
  namaLengkap: string;
  labelService: string[];
  status: StatusUnitStr;
  grade: GradeStr | null;
  hargaBeli: number;
  totalBiayaService: number;
  hpp: number;
  hargaJual: number;
  margin: number;
  tglBeli: string;
  tglMasukInventory: string | null;
  tglKeluar: string | null;
  umurHari: number | null;
  alasanRusak: string | null;
  catatan: string | null;
  catatanKondisi?: string | null;
  adaBox?: boolean;
  adaSurat?: boolean;
  adaBuku?: boolean;
  adaExtraLink?: boolean;
  adaSertifikat?: boolean;
}

export interface UnitDetail extends UnitRingkas {
  catatanKondisi: string | null;
  adaBox: boolean;
  adaSurat: boolean;
  adaBuku: boolean;
  adaExtraLink: boolean;
  adaSertifikat: boolean;
  qcRecords: { id: string; hasil: string; keterangan: string | null; tanggal: string }[];
  services: {
    id: string;
    status: string;
    totalBiaya: number;
    catatan: string | null;
    tglMasuk: string;
    tglSelesai: string | null;
    items: {
      id: string;
      jenis: JenisKomponenStr;
      deskripsi: string | null;
      biaya: number;
      dariStok: boolean;
      qty: number | null;
      namaSparepart: string | null;
    }[];
  }[];
  ledger: { id: string; jenis: string; qty: number; keterangan: string | null; tanggal: string }[];
  penjualan: {
    noNota: string;
    tanggal: string;
    pembeli: string;
    tipePembeli: TipePembeliStr;
    hargaJual: number;
    hppSaatJual: number;
    laba: number;
  } | null;
}

export interface MitraRingkas {
  id: string;
  nama: string;
  kontak: string | null;
  kota: string | null;
  catatan: string | null;
  aktif: boolean;
  totalTransaksi: number;
  totalOmzet: number;
  totalLaba: number;
  totalUnit: number;
  sisaPiutang: number;
}

export interface PenjualanRingkas {
  id: string;
  noNota: string;
  tanggal: string;
  tipePembeli: TipePembeliStr;
  pembeli: string;
  channel: ChannelStr;
  jumlahUnit: number;
  subtotal: number;
  ongkir: number;
  penanggungOngkir: PenanggungOngkirStr;
  totalTagihan: number;
  totalDibayar: number;
  sisaPiutang: number;
  metodeBayar: MetodeBayarStr;
  statusBayar: StatusBayarStr;
  jatuhTempo: string | null;
  laba: number;
  terlewat: boolean;
  catatan: string | null;
}

export interface PenjualanDetail extends PenjualanRingkas {
  items: {
    id: string;
    unitId: string;
    kodeUnit: string;
    brand: string;
    model: string;
    hargaJual: number;
    hppSaatJual: number;
    laba: number;
  }[];
  pembayaran: { id: string; jumlah: number; tanggal: string; catatan: string | null }[];
}

export interface AntrianService {
  id: string;
  unitId: string;
  kodeUnit: string;
  brand: string;
  model: string;
  namaDasar: string;
  namaLengkap: string;
  hargaBeli: number;
  hpp: number;
  status: string;
  catatan: string | null;
  tglMasuk: string;
  items: {
    id: string;
    jenis: JenisKomponenStr;
    deskripsi: string | null;
    biaya: number;
    dariStok: boolean;
    qty: number | null;
    namaSparepart: string | null;
    satuan: string | null;
  }[];
  totalBiaya: number;
}

export interface BarisLedger {
  id: string;
  unitId: string;
  jenis: string;
  qty: number;
  keterangan: string | null;
  tanggal: string;
  kodeUnit: string;
  brand: string;
  model: string;
  namaLengkap: string;
}

export const LABEL_LEDGER: Record<string, string> = {
  MASUK_BELI: "Masuk  -  Pembelian",
  MASUK_QC_LOLOS: "QC Lolos  -  Masuk Inventory",
  KELUAR_SERVICE: "Keluar  -  Masuk Service",
  MASUK_SERVICE_SELESAI: "Masuk  -  Service Selesai",
  KELUAR_JUAL: "Keluar  -  Penjualan",
  KELUAR_RUSAK: "Keluar  -  Barang Rusak",
};

export const LABEL_KOMPONEN: Record<JenisKomponenStr, string> = {
  BATRE: "Batre",
  STRAP: "Strap",
  KACA: "Kaca",
  MESIN: "Mesin",
  LAINNYA: "Lainnya",
};

export const LABEL_CHANNEL: Record<ChannelStr, string> = {
  OFFLINE: "Offline / COD",
  WA_SOSMED: "WhatsApp / Sosmed",
};

export const LABEL_STATUS_BAYAR: Record<StatusBayarStr, string> = {
  LUNAS: "Lunas",
  SEBAGIAN: "Sebagian",
  BELUM_LUNAS: "Belum bayar",
};
