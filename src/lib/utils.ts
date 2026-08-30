import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "Asia/Jakarta";

/**
 * Prisma Decimal -> number biasa.
 * Nilai rupiah jauh di bawah batas aman number (2^53), jadi konversi ini aman
 * untuk perhitungan dan pengiriman JSON.
 */
export function toNumber(nilai: unknown): number {
  if (nilai === null || nilai === undefined) return 0;
  if (typeof nilai === "number") return nilai;
  const angka = Number(
    typeof nilai === "object" && nilai !== null && "toString" in nilai
      ? (nilai as { toString(): string }).toString()
      : nilai
  );
  return Number.isFinite(angka) ? angka : 0;
}

/** Rp 1.250.000 — tanpa desimal */
export function formatRupiah(nilai: number | string | null | undefined): string {
  const angka = Number(nilai ?? 0);
  if (!Number.isFinite(angka)) return "Rp 0";
  const minus = angka < 0;
  const teks =
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.abs(angka));
  return minus ? "-" + teks : teks;
}

/** 1.250.000 */
export function formatAngka(nilai: number | string | null | undefined, desimal = 0): string {
  const angka = Number(nilai ?? 0);
  if (!Number.isFinite(angka)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }).format(angka);
}

/** 12,3% — input berupa rasio (0.123) */
export function formatPersen(rasio: number, desimal = 1): string {
  if (!Number.isFinite(rasio)) return "0%";
  return formatAngka(rasio * 100, desimal) + "%";
}

/** 20 Agu 2026 (WIB) */
export function formatTanggal(tanggal: Date | string | null | undefined): string {
  if (!tanggal) return "-";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

/** 20 Agu 2026 14:30 (WIB) */
export function formatTanggalJam(tanggal: Date | string | null | undefined): string {
  if (!tanggal) return "-";
  const d = typeof tanggal === "string" ? new Date(tanggal) : tanggal;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

/** 'YYYY-MM-DD' menurut WIB — untuk input date dan pengelompokan laporan */
export function tanggalWIB(tanggal: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(tanggal);
}

/** Jumlah hari penuh dari `dari` sampai `sampai` (default: sekarang). */
export function selisihHari(dari: Date | string | null | undefined, sampai: Date = new Date()): number {
  if (!dari) return 0;
  const d = typeof dari === "string" ? new Date(dari) : dari;
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((sampai.getTime() - d.getTime()) / 86_400_000));
}

/**
 * Awal dan akhir sebuah bulan dalam WIB, dikembalikan sebagai Date UTC.
 * `bulan` format 'YYYY-MM'. WIB = UTC+7, jadi 1 Agu 00:00 WIB = 31 Jul 17:00 UTC.
 */
export function rentangBulanWIB(bulan: string): { dari: Date; sampai: Date } {
  const [tahunStr, bulanStr] = bulan.split("-");
  const tahun = Number(tahunStr);
  const bln = Number(bulanStr);
  const dari = new Date(Date.UTC(tahun, bln - 1, 1, -7, 0, 0));
  const sampai = new Date(Date.UTC(tahun, bln, 1, -7, 0, 0));
  return { dari, sampai };
}

/** 'YYYY-MM' bulan berjalan menurut WIB */
export function bulanIniWIB(): string {
  return tanggalWIB().slice(0, 7);
}

/** 'Agu 2026' dari 'YYYY-MM' */
export function labelBulan(bulan: string): string {
  const [tahun, bln] = bulan.split("-");
  const nama = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${nama[Number(bln) - 1] ?? bln} ${tahun}`;
}

/** Ubah 'YYYY-MM-DD' (dianggap WIB) menjadi Date UTC jam 00:00 WIB. */
export function tanggalInputKeDate(input: string): Date {
  const [t, b, h] = input.split("-").map(Number);
  return new Date(Date.UTC(t, b - 1, h, -7, 0, 0));
}
