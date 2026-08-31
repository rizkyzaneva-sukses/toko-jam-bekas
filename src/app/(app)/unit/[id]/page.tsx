"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Minus, Pencil } from "lucide-react";
import { api } from "@/lib/api-client";
import type { UnitDetail } from "@/lib/tipe";
import { LABEL_KOMPONEN, LABEL_LEDGER } from "@/lib/tipe";
import { formatRupiah, formatTanggal, formatTanggalJam } from "@/lib/utils";
import { ModalRusak } from "@/components/modal-rusak";
import { ModalEditUnit } from "@/components/modal-edit-unit";
import {
  Badge,
  BadgeStatus,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

export default function HalamanDetailUnit() {
  const params = useParams<{ id: string }>();
  const [rusakUntuk, setRusakUntuk] = React.useState<UnitDetail | null>(null);
  const [editUntuk, setEditUntuk] = React.useState<UnitDetail | null>(null);

  const { data: u, isLoading, error, refetch } = useQuery({
    queryKey: ["unit", params.id],
    queryFn: () => api.get<UnitDetail>(`/api/units/${params.id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) return <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />;
  if (!u) return null;

  const kelengkapan: [string, boolean][] = [
    ["Box", u.adaBox],
    ["Surat / Garansi", u.adaSurat],
    ["Buku Manual", u.adaBuku],
    ["Extra Link", u.adaExtraLink],
    ["Sertifikat", u.adaSertifikat],
  ];

  return (
    <>
      <Link
        href="/unit"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline dark:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Inventory
      </Link>

      <PageHeader
        judul={`${u.kodeUnit} — ${u.namaLengkap}`}
        deskripsi={`Dibeli ${formatTanggal(u.tglBeli)}${u.grade ? ` · Grade ${u.grade}` : ""}`}
        aksi={
          <div className="flex items-center gap-2">
            <Button
              varian="secondary"
              onClick={() => setEditUntuk(u)}
              title={`Edit ${u.kodeUnit}`}
            >
              <Pencil className="h-4 w-4 mr-1.5" /> Edit Unit
            </Button>
            <BadgeStatus status={u.status} />
            {["MASUK_QC", "SERVICE", "READY"].includes(u.status) && (
              <Button varian="danger" onClick={() => setRusakUntuk(u)}>
                Pindahkan ke RUSAK
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Harga Beli (modal)" nilai={u.hargaBeli} />
        <StatCard label="Total Biaya Service" nilai={u.totalBiayaService} />
        <StatCard label="HPP" nilai={u.hpp} sub="Harga beli + biaya service" />
        <StatCard
          label={u.status === "TERJUAL" ? "Laba" : "Potensi Margin"}
          nilai={u.penjualan ? u.penjualan.laba : u.margin}
          nada="auto"
          sub={u.hargaJual > 0 ? `Harga jual ${formatRupiah(u.hargaJual)}` : "Harga jual belum diisi"}
        />
      </div>

      {u.status === "RUSAK" && (
        <Card className="mb-4 border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Unit ditulis-hapus sebagai kerugian {formatRupiah(u.hpp)} pada{" "}
            {formatTanggal(u.tglKeluar)}
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">Alasan: {u.alasanRusak}</p>
          <Link href="/rusak" className="mt-2 inline-block text-sm underline">
            Batalkan dari halaman Barang Rusak
          </Link>
        </Card>
      )}

﻿      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Kondisi & kelengkapan */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Kondisi & Kelengkapan
          </h2>

          {u.grade ? (
            <p className="mb-3 text-sm text-gray-900 dark:text-gray-100">
              Grade <span className="font-semibold">{u.grade}</span>
              {u.umurHari !== null && (
                <>
                  {" · "}
                  <Badge warna={u.umurHari > 60 ? "merah" : u.umurHari > 30 ? "kuning" : "hijau"}>
                    Umur stok {u.umurHari} hari
                  </Badge>
                </>
              )}
            </p>
          ) : (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Grade belum ditentukan (unit belum lolos QC).
            </p>
          )}

          <ul className="space-y-1.5 text-sm">
            {kelengkapan.map(([label, ada]) => (
              <li key={label} className="flex items-center gap-2">
                {ada ? (
                  <Check className="h-4 w-4 text-green-700 dark:text-green-400" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
                <span
                  className={
                    ada
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400"
                  }
                >
                  {label}
                  {!ada && " — tidak ada"}
                </span>
              </li>
            ))}
          </ul>

          {u.catatanKondisi && (
            <p className="mt-3 rounded-lg bg-gray-100 p-2.5 text-sm text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
              {u.catatanKondisi}
            </p>
          )}
          {u.catatan && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Catatan pembelian: {u.catatan}
            </p>
          )}
        </Card>

        {/* Riwayat service */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Riwayat Service
          </h2>

          {u.services.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unit ini belum pernah masuk bengkel.
            </p>
          ) : (
            <div className="space-y-3">
              {u.services.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      Masuk {formatTanggal(s.tglMasuk)}
                      {s.tglSelesai ? ` · selesai ${formatTanggal(s.tglSelesai)}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge warna={s.status === "SELESAI" ? "hijau" : "kuning"}>
                        {s.status === "SELESAI" ? "Selesai" : "Proses"}
                      </Badge>
                      <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(s.totalBiaya)}
                      </span>
                    </span>
                  </div>

                  {s.catatan && (
                    <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{s.catatan}</p>
                  )}

                  {s.items.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Belum ada komponen dicatat.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {s.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3">
                          <span className="text-gray-900 dark:text-gray-100">
                            {u.kodeUnit} ({LABEL_KOMPONEN[i.jenis]})
                            {i.deskripsi && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {" "}
                                — {i.deskripsi}
                              </span>
                            )}
                          </span>
                          <span className="tabular-nums text-gray-900 dark:text-gray-100">
                            {formatRupiah(i.biaya)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Penjualan */}
      {u.penjualan && (
        <Card className="mt-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Penjualan</h2>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="No Nota" nilai={u.penjualan.noNota} />
            <Info label="Tanggal" nilai={formatTanggal(u.penjualan.tanggal)} />
            <Info label="Pembeli" nilai={`${u.penjualan.pembeli} (${u.penjualan.tipePembeli})`} />
            <Info label="Harga Jual" nilai={formatRupiah(u.penjualan.hargaJual)} />
          </div>
        </Card>
      )}

      {/* Riwayat QC + Ledger */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Riwayat QC</h2>
          {u.qcRecords.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Belum pernah di-QC.</p>
          ) : (
            <ul className="divide-y divide-gray-200 text-sm dark:divide-zinc-700">
              {u.qcRecords.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-2">
                  <span>
                    <Badge warna={q.hasil === "LOLOS" ? "hijau" : "kuning"}>{q.hasil}</Badge>
                    {q.keterangan && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {q.keterangan}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-gray-600 dark:text-gray-400">
                    {formatTanggalJam(q.tanggal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Pergerakan Stok
          </h2>
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Jenis</Th>
                  <Th className="text-right">Qty</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {u.ledger.map((l) => (
                  <tr key={l.id}>
                    <Td>{formatTanggal(l.tanggal)}</Td>
                    <Td>
                      {LABEL_LEDGER[l.jenis] ?? l.jenis}
                      {l.keterangan && (
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {l.keterangan}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {l.qty > 0 ? `+${l.qty}` : l.qty === 0 ? "—" : l.qty}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        </Card>
      </div>

      <ModalRusak unit={rusakUntuk} onClose={() => setRusakUntuk(null)} />
      <ModalEditUnit unit={editUntuk} open={!!editUntuk} onClose={() => setEditUntuk(null)} />
    </>
  );
}

function Info({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-50">{nilai}</p>
    </div>
  );
}
