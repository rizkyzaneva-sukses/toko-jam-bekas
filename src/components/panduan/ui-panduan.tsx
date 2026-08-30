"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Menyebut tombol / menu yang benar-benar ada di layar. */
export function Tekan({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-block rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[0.8em] font-medium text-gray-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-50">
      {children}
    </span>
  );
}

/** Menyebut isian form. */
export function Isi({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-gray-900 dark:text-gray-50">{children}</span>
  );
}

type NadaKotak = "info" | "penting" | "bahaya" | "bisa";

const gayaKotak: Record<NadaKotak, { wadah: string; judul: string; ikon: React.ElementType }> = {
  info: {
    wadah: "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
    judul: "text-blue-900 dark:text-blue-200",
    ikon: Info,
  },
  penting: {
    wadah: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    judul: "text-amber-900 dark:text-amber-200",
    ikon: AlertTriangle,
  },
  bahaya: {
    wadah: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
    judul: "text-red-900 dark:text-red-200",
    ikon: XCircle,
  },
  bisa: {
    wadah: "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40",
    judul: "text-green-900 dark:text-green-200",
    ikon: CheckCircle2,
  },
};

export function Kotak({
  nada = "info",
  judul,
  children,
  className,
}: {
  nada?: NadaKotak;
  judul?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const g = gayaKotak[nada];
  const Ikon = g.ikon;
  return (
    <div className={cn("rounded-lg border p-3 sm:p-4", g.wadah, className)}>
      <div className="flex gap-2.5">
        <Ikon className={cn("mt-0.5 h-4 w-4 shrink-0", g.judul)} />
        <div className="min-w-0 text-sm">
          {judul && <p className={cn("mb-1 font-semibold", g.judul)}>{judul}</p>}
          <div className="space-y-2 text-gray-800 dark:text-gray-200">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Daftar langkah bernomor. */
export function Langkah({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <ol className="space-y-2.5">
      {items.map((anak, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white dark:bg-blue-500">
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5 text-sm text-gray-800 dark:text-gray-200">{anak}</div>
        </li>
      ))}
    </ol>
  );
}

export function JudulBagian({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{children}</h2>
      {sub && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

/** Tab sederhana — hanya beberapa opsi tetap, tidak perlu dropdown. */
export function Tabs({
  tabs,
  aktif,
  onGanti,
}: {
  tabs: { id: string; label: string; icon?: React.ElementType }[];
  aktif: string;
  onGanti: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Bagian panduan"
      className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 px-4 dark:border-zinc-700 sm:mx-0 sm:px-0"
    >
      {tabs.map((t) => {
        const Ikon = t.icon;
        const isAktif = t.id === aktif;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isAktif}
            onClick={() => onGanti(t.id)}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              isAktif
                ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            )}
          >
            {Ikon && <Ikon className="h-4 w-4" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
