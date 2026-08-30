"use client";

import * as React from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { bulanIniWIB, labelBulan } from "@/lib/utils";

/** Daftar 24 bulan terakhir, terbaru di atas. */
export function opsiBulan(jumlah = 24) {
  const [th, bl] = bulanIniWIB().split("-").map(Number);
  const hasil: { value: string; label: string }[] = [];
  for (let i = 0; i < jumlah; i++) {
    const d = new Date(Date.UTC(th, bl - 1 - i, 1));
    const nilai = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    hasil.push({ value: nilai, label: labelBulan(nilai) });
  }
  return hasil;
}

export function PilihBulan({
  value,
  onChange,
  label,
  denganSemua = false,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  denganSemua?: boolean;
  className?: string;
}) {
  const opsi = React.useMemo(() => {
    const dasar = opsiBulan();
    return denganSemua ? [{ value: "SEMUA", label: "Semua periode" }, ...dasar] : dasar;
  }, [denganSemua]);

  return (
    <SearchableSelect
      label={label}
      className={className ?? "w-full sm:w-52"}
      options={opsi}
      value={value}
      onChange={(v) => onChange(v ?? bulanIniWIB())}
      placeholder="Pilih bulan"
      searchPlaceholder="Cari bulan..."
      emptyText="Bulan tidak ditemukan"
    />
  );
}
