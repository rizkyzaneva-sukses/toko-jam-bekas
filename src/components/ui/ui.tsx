"use client";

import * as React from "react";
import { Inbox, Loader2 } from "lucide-react";
import { cn, formatAngka, formatRupiah } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tombol
// ---------------------------------------------------------------------------

type Varian = "primary" | "secondary" | "danger" | "ghost" | "success";

const gayaVarian: Record<Varian, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white",
  secondary:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-50 dark:hover:bg-zinc-700",
  danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
  success:
    "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400",
  ghost:
    "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800",
};

export function Button({
  varian = "primary",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900",
        "disabled:cursor-not-allowed disabled:opacity-60",
        gayaVarian[varian],
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Field & input
// ---------------------------------------------------------------------------

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const gayaInput = cn(
  "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
  "min-h-[42px]",
  "border-gray-300 bg-white text-gray-900 placeholder:text-gray-500",
  "dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-50 dark:placeholder:text-gray-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  "dark:focus:ring-blue-400",
  "disabled:cursor-not-allowed disabled:opacity-60"
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={cn(gayaInput, className)} />;
  }
);

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(gayaInput, "min-h-[80px]", className)} />;
}

/**
 * Input rupiah: menampilkan 1.250.000 sambil menyimpan angka biasa.
 * Nilai kosong dikirim sebagai null supaya bisa dibedakan dari nol.
 */
export function InputRupiah({
  value,
  onChange,
  placeholder = "0",
  disabled,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const tampil = value === null || Number.isNaN(value) ? "" : formatAngka(value);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400">
        Rp
      </span>
      <input
        inputMode="numeric"
        disabled={disabled}
        value={tampil}
        placeholder={placeholder}
        onChange={(e) => {
          const bersih = e.target.value.replace(/[^\d]/g, "");
          onChange(bersih === "" ? null : Number(bersih));
        }}
        className={cn(gayaInput, "pl-9 text-right tabular-nums", className)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card, badge, header
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 sm:p-6",
        "dark:border-zinc-700 dark:bg-zinc-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 sm:text-2xl">
          {judul}
        </h1>
        {deskripsi && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{deskripsi}</p>
        )}
      </div>
      {aksi && <div className="flex shrink-0 flex-wrap gap-2">{aksi}</div>}
    </div>
  );
}

type WarnaBadge = "abu" | "kuning" | "hijau" | "biru" | "merah" | "ungu";

const gayaBadge: Record<WarnaBadge, string> = {
  abu: "bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-200",
  kuning: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  hijau: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  biru: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  merah: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  ungu: "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200",
};

export function Badge({
  warna = "abu",
  children,
  className,
}: {
  warna?: WarnaBadge;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        gayaBadge[warna],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Warna status unit konsisten di seluruh app (lihat PRD §7 UI System). */
export const warnaStatus: Record<string, WarnaBadge> = {
  MASUK_QC: "abu",
  SERVICE: "kuning",
  READY: "hijau",
  TERJUAL: "biru",
  RUSAK: "merah",
};

export const labelStatus: Record<string, string> = {
  MASUK_QC: "Antrian QC",
  SERVICE: "Service",
  READY: "Ready",
  TERJUAL: "Terjual",
  RUSAK: "Rusak",
};

export function BadgeStatus({ status }: { status: string }) {
  return <Badge warna={warnaStatus[status] ?? "abu"}>{labelStatus[status] ?? status}</Badge>;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  nilai,
  sub,
  rupiah = true,
  nada = "netral",
  icon,
}: {
  label: string;
  nilai: number;
  sub?: string;
  rupiah?: boolean;
  nada?: "netral" | "baik" | "buruk" | "auto";
  icon?: React.ReactNode;
}) {
  const nadaFinal = nada === "auto" ? (nilai >= 0 ? "baik" : "buruk") : nada;
  const warnaNilai =
    nadaFinal === "baik"
      ? "text-green-700 dark:text-green-400"
      : nadaFinal === "buruk"
        ? "text-red-700 dark:text-red-400"
        : "text-gray-900 dark:text-gray-50";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
        {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
      </div>
      <p className={cn("mt-2 text-lg font-semibold tabular-nums sm:text-xl", warnaNilai)}>
        {rupiah ? formatRupiah(nilai) : formatAngka(nilai)}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// State halaman
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700", className)}
    />
  );
}

export function SkeletonTabel({ baris = 5 }: { baris?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: baris }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  judul = "Belum ada data",
  deskripsi,
  aksi,
}: {
  judul?: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-zinc-700">
      <Inbox className="h-10 w-10 text-gray-500 dark:text-gray-400" />
      <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-50">{judul}</p>
      {deskripsi && (
        <p className="mt-1 max-w-sm text-sm text-gray-600 dark:text-gray-400">{deskripsi}</p>
      )}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  );
}

export function ErrorState({ pesan, onCoba }: { pesan: string; onCoba?: () => void }) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-6 text-center dark:border-red-900 dark:bg-red-950/40">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">Gagal memuat data</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">{pesan}</p>
      {onCoba && (
        <Button varian="secondary" className="mt-4" onClick={onCoba}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

/** Pembungkus tabel — wajib supaya tabel bisa di-scroll di layar HP. */
export function TabelWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">{children}</div>
    </div>
  );
}

export function Th({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide",
        "text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100",
        className
      )}
    >
      {children}
    </td>
  );
}

export function Tabel({ children }: { children: React.ReactNode }) {
  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
      {children}
    </table>
  );
}
