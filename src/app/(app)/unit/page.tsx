"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, Pencil, Plus, Search, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import type { UnitRingkas } from "@/lib/tipe";
import { formatAngka, formatRupiah, formatTanggal } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ModalRusak } from "@/components/modal-rusak";
import { ModalEditUnit } from "@/components/modal-edit-unit";
import { ModalInputStokLama } from "@/components/modal-stok-lama";
import { ModalImportUnit } from "@/components/modal-import-unit";
import {
  Badge,
  BadgeStatus,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

const OPSI_STATUS = [
  { value: "SEMUA", label: "Semua status" },
  { value: "MASUK_QC", label: "Antrian QC" },
  { value: "SERVICE", label: "Service" },
  { value: "READY", label: "Ready" },
  { value: "TERJUAL", label: "Terjual" },
  { value: "RUSAK", label: "Rusak" },
];

const OPSI_GRADE = [
  { value: "SEMUA", label: "Semua grade" },
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
];

const OPSI_UMUR = [
  { value: "0", label: "Semua umur" },
  { value: "31", label: "Lebih dari 30 hari" },
  { value: "61", label: "Lebih dari 60 hari" },
  { value: "91", label: "Lebih dari 90 hari" },
];

function warnaUmur(hari: number) {
  if (hari > 60) return "merah" as const;
  if (hari > 30) return "kuning" as const;
  return "hijau" as const;
}

function IsiInventory() {
  const params = useSearchParams();
  const [status, setStatus] = React.useState(params.get("status") ?? "SEMUA");
  const [brand, setBrand] = React.useState("SEMUA");
  const [grade, setGrade] = React.useState("SEMUA");
  const [minUmur, setMinUmur] = React.useState("0");
  const [q, setQ] = React.useState("");
  const [qDebounce, setQDebounce] = React.useState("");
  const [rusakUntuk, setRusakUntuk] = React.useState<UnitRingkas | null>(null);
  const [editUntuk, setEditUntuk] = React.useState<UnitRingkas | null>(null);
  const [formStokLama, setFormStokLama] = React.useState(false);
  const [formImport, setFormImport] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounce(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["units", status, brand, grade, minUmur, qDebounce],
    queryFn: () =>
      api.get<{ data: UnitRingkas[]; brands: string[] }>(
        `/api/units?status=${status}&brand=${encodeURIComponent(brand)}&grade=${grade}&minUmur=${minUmur}&q=${encodeURIComponent(qDebounce)}`
      ),
  });

  const units = data?.data ?? [];
  const nilaiStok = units
    .filter((u) => u.status === "READY")
    .reduce((t, u) => t + u.hpp, 0);
  const potensiJual = units
    .filter((u) => u.status === "READY")
    .reduce((t, u) => t + u.hargaJual, 0);

  return (
    <>
      <PageHeader
        judul="Inventory"
        deskripsi="Seluruh unit jam beserta modal, HPP, dan umur stoknya."
        aksi={
          <div className="flex flex-wrap gap-2">
            <Button varian="secondary" onClick={() => setFormImport(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import Excel
            </Button>
            <a href="/api/export?jenis=stok">
              <Button varian="secondary">
                <Download className="h-4 w-4 mr-1" /> Export Excel
              </Button>
            </a>
            <Button onClick={() => setFormStokLama(true)}>
              <Plus className="h-4 w-4 mr-1" /> Input Stok Lama
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Unit tampil" nilai={units.length} rupiah={false} />
        <StatCard
          label="Unit ready"
          nilai={units.filter((u) => u.status === "READY").length}
          rupiah={false}
        />
        <StatCard label="Nilai stok (HPP ready)" nilai={nilaiStok} />
        <StatCard
          label="Potensi omzet"
          nilai={potensiJual}
          sub={`Potensi margin ${formatRupiah(potensiJual - nilaiStok)}`}
        />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Cari">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kode, brand, model"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Status">
            <SearchableSelect
              options={OPSI_STATUS}
              value={status}
              onChange={(v) => setStatus(v ?? "SEMUA")}
              placeholder="Semua status"
            />
          </Field>

          <Field label="Brand">
            <SearchableSelect
              options={[
                { value: "SEMUA", label: "Semua brand" },
                ...(data?.brands ?? []).map((b) => ({ value: b, label: b })),
              ]}
              value={brand}
              onChange={(v) => setBrand(v ?? "SEMUA")}
              placeholder="Semua brand"
            />
          </Field>

          <Field label="Grade">
            <SearchableSelect
              options={OPSI_GRADE}
              value={grade}
              onChange={(v) => setGrade(v ?? "SEMUA")}
              placeholder="Semua grade"
            />
          </Field>

          <Field label="Umur stok">
            <SearchableSelect
              options={OPSI_UMUR}
              value={minUmur}
              onChange={(v) => setMinUmur(v ?? "0")}
              placeholder="Semua umur"
            />
          </Field>
        </div>
      </Card>

﻿      <Card>
        {isLoading ? (
          <SkeletonTabel baris={8} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : units.length === 0 ? (
          <EmptyState
            judul="Tidak ada unit yang cocok"
            deskripsi="Coba ubah filter, atau tambah unit baru lewat menu Beli Produk."
            aksi={
              <Link href="/beli">
                <Button>Beli produk</Button>
              </Link>
            }
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Jam</Th>
                  <Th>Status</Th>
                  <Th>Grade</Th>
                  <Th className="text-right">Harga Beli</Th>
                  <Th className="text-right">Service</Th>
                  <Th className="text-right">HPP</Th>
                  <Th className="text-right">Harga Jual</Th>
                  <Th className="text-right">Margin</Th>
                  <Th className="text-right">Umur</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {units.map((u) => (
                  <tr key={u.id}>
                    <Td>
                      <Link
                        href={`/unit/${u.id}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {u.kodeUnit}
                      </Link>
                    </Td>
                    <Td>{u.namaLengkap}</Td>
                    <Td>
                      <BadgeStatus status={u.status} />
                    </Td>
                    <Td>{u.grade ?? "-"}</Td>
                    <Td className="text-right tabular-nums">{formatRupiah(u.hargaBeli)}</Td>
                    <Td className="text-right tabular-nums">
                      {u.totalBiayaService > 0 ? formatRupiah(u.totalBiayaService) : "-"}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatRupiah(u.hpp)}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {u.hargaJual > 0 ? formatRupiah(u.hargaJual) : "-"}
                    </Td>
                    <Td
                      className={
                        u.hargaJual > 0 && u.margin < 0
                          ? "text-right font-medium tabular-nums text-red-700 dark:text-red-400"
                          : "text-right tabular-nums"
                      }
                    >
                      {u.hargaJual > 0 ? formatRupiah(u.margin) : "-"}
                    </Td>
                    <Td className="text-right">
                      {u.umurHari === null ? (
                        <span className="text-gray-600 dark:text-gray-400">-</span>
                      ) : (
                        <Badge warna={warnaUmur(u.umurHari)}>{formatAngka(u.umurHari)} hari</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          varian="ghost"
                          className="min-h-[36px] px-2.5 py-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                          onClick={() => setEditUntuk(u)}
                          title={`Edit ${u.kodeUnit}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          <span className="text-xs">Edit</span>
                        </Button>
                        {["MASUK_QC", "SERVICE", "READY"].includes(u.status) ? (
                          <Button
                            varian="secondary"
                            className="min-h-[36px] px-2.5 py-1 text-xs"
                            onClick={() => setRusakUntuk(u)}
                          >
                            Rusak
                          </Button>
                        ) : u.status === "TERJUAL" ? (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatTanggal(u.tglKeluar)}
                          </span>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <ModalRusak unit={rusakUntuk} onClose={() => setRusakUntuk(null)} />
      <ModalEditUnit
        unit={editUntuk}
        open={!!editUntuk}
        onClose={() => setEditUntuk(null)}
      />
      <ModalInputStokLama
        open={formStokLama}
        onClose={() => setFormStokLama(false)}
      />
      <ModalImportUnit
        open={formImport}
        onClose={() => setFormImport(false)}
      />
    </>
  );
}

export default function HalamanInventory() {
  return (
    <React.Suspense fallback={<SkeletonTabel baris={8} />}>
      <IsiInventory />
    </React.Suspense>
  );
}
