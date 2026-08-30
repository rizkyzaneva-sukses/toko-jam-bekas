"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "@/lib/api-client";
import type { LaporanLabaRugi } from "@/lib/laporan";
import { bulanIniWIB, formatRupiah, formatTanggal } from "@/lib/utils";
import { PilihBulan } from "@/components/pilih-bulan";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

export default function HalamanLaporan() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["laporan", bulan],
    queryFn: () => api.get<LaporanLabaRugi>(`/api/laporan?bulan=${bulan}`),
  });

  return (
    <>
      <PageHeader
        judul="Laporan Laba / Rugi"
        deskripsi="Dua tingkat: laba dari jual-beli barang, lalu laba bersih setelah biaya menjalankan toko."
        aksi={
          <div className="flex flex-wrap gap-2">
            <PilihBulan value={bulan} onChange={setBulan} />
            <a href={`/api/export?jenis=lr&bulan=${bulan}`}>
              <Button varian="secondary">
                <Download className="h-4 w-4" /> Export Excel
              </Button>
            </a>
          </div>
        }
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      )}

      {error && <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Omzet" nilai={data.omzet} />
            <StatCard label="Laba Kotor Barang" nilai={data.labaKotorBarang} nada="auto" />
            <StatCard label="Laba Bersih Usaha" nilai={data.labaBersihUsaha} nada="auto" />
          </div>

          {/* Perhitungan */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Perhitungan — {data.periode.label}
            </h2>
            <dl className="space-y-2 text-sm">
              <BarisHitung label="Omzet (harga jual unit terjual)" nilai={data.omzet} />
              <BarisHitung
                label="Modal (harga beli unit terjual)"
                nilai={-data.modal}
                kurang
              />
              <BarisHitung
                label="Biaya Service (unit terjual)"
                nilai={-data.biayaService}
                kurang
              />
              <BarisHitung
                label="Kerugian Barang Rusak (write-off periode ini)"
                nilai={-data.kerugianRusak}
                kurang
              />
              {data.kerugianSparepart > 0 && (
                <BarisHitung
                  label="Kerugian Sparepart (susut / rusak / hilang)"
                  nilai={-data.kerugianSparepart}
                  kurang
                />
              )}
              <BarisHitung
                label="Ongkir ditanggung toko"
                nilai={-data.ongkirToko}
                kurang
              />
              <div className="border-t border-gray-200 pt-2 dark:border-zinc-700">
                <BarisHitung label="LABA KOTOR BARANG" nilai={data.labaKotorBarang} tebal />
              </div>

              <BarisHitung
                label="Biaya Operasional Toko (sewa, gaji, listrik, dll)"
                nilai={-data.biayaOperasional}
                kurang
              />
              {data.biayaPerKategori.map((k) => (
                <div key={k.kategori} className="flex justify-between gap-3 pl-4 text-xs">
                  <dt className="text-gray-600 dark:text-gray-400">{k.label}</dt>
                  <dd className="tabular-nums text-gray-600 dark:text-gray-400">
                    {formatRupiah(-k.jumlah)}
                  </dd>
                </div>
              ))}

              <div className="border-t-2 border-gray-300 pt-2 dark:border-zinc-600">
                <BarisHitung label="LABA BERSIH USAHA" nilai={data.labaBersihUsaha} tebal />
              </div>
            </dl>

            <p className="mt-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-zinc-900 dark:text-gray-300">
              Biaya service diakui sebagai beban <strong>saat unit terjual</strong>, bukan saat
              uang dikeluarkan. Biaya service pada unit yang masih ready dihitung sebagai nilai
              persediaan. Omzet diakui pada tanggal transaksi, bukan saat uang diterima.
              Biaya operasional berbeda: ia beban <strong>periode</strong>, diakui penuh pada
              bulan terjadinya tanpa menunggu barang terjual.
            </p>
          </Card>

          {/* Rincian unit terjual */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Rincian Unit Terjual
            </h2>

            {data.baris.length === 0 ? (
              <EmptyState judul="Belum ada penjualan" deskripsi="Periode ini tidak ada unit terjual." />
            ) : (
              <TabelWrap>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>No Nota</Th>
                      <Th>Tanggal</Th>
                      <Th>Kode</Th>
                      <Th>Jam</Th>
                      <Th>Pembeli</Th>
                      <Th className="text-right">Harga Jual</Th>
                      <Th className="text-right">Harga Beli</Th>
                      <Th className="text-right">Service</Th>
                      <Th className="text-right">HPP</Th>
                      <Th className="text-right">Laba</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {data.baris.map((b, i) => (
                      <tr
                        key={`${b.noNota}-${b.kodeUnit}-${i}`}
                        className={b.laba < 0 ? "bg-red-50/60 dark:bg-red-950/20" : ""}
                      >
                        <Td>{b.noNota}</Td>
                        <Td>{formatTanggal(b.tanggal)}</Td>
                        <Td className="font-medium">{b.kodeUnit}</Td>
                        <Td>{b.namaLengkap}</Td>
                        <Td>
                          {b.pembeli}
                          <Badge
                            warna={b.tipePembeli === "B2B" ? "biru" : "ungu"}
                            className="ml-2"
                          >
                            {b.tipePembeli}
                          </Badge>
                        </Td>
                        <Td className="text-right tabular-nums">{formatRupiah(b.hargaJual)}</Td>
                        <Td className="text-right tabular-nums">{formatRupiah(b.hargaBeli)}</Td>
                        <Td className="text-right tabular-nums">
                          {b.biayaService > 0 ? formatRupiah(b.biayaService) : "-"}
                        </Td>
                        <Td className="text-right tabular-nums">{formatRupiah(b.hpp)}</Td>
                        <Td
                          className={
                            b.laba < 0
                              ? "text-right font-medium tabular-nums text-red-700 dark:text-red-400"
                              : "text-right font-medium tabular-nums text-green-700 dark:text-green-400"
                          }
                        >
                          {formatRupiah(b.laba)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWrap>
            )}
          </Card>

          {/* Barang rusak */}
          {data.rusak.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Kerugian Barang Rusak
              </h2>
              <TabelWrap>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Kode</Th>
                      <Th>Jam</Th>
                      <Th className="text-right">Kerugian (HPP)</Th>
                      <Th>Tanggal</Th>
                      <Th>Alasan</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {data.rusak.map((r) => (
                      <tr key={r.kodeUnit}>
                        <Td className="font-medium">{r.kodeUnit}</Td>
                        <Td>
                          {r.brand} {r.model}
                        </Td>
                        <Td className="text-right font-medium tabular-nums text-red-700 dark:text-red-400">
                          {formatRupiah(r.hpp)}
                        </Td>
                        <Td>{formatTanggal(r.tanggal)}</Td>
                        <Td className="text-gray-600 dark:text-gray-400">{r.alasan}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWrap>
              <Link
                href="/rusak"
                className="mt-3 inline-block text-sm text-blue-700 hover:underline dark:text-blue-400"
              >
                Kelola barang rusak
              </Link>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function BarisHitung({
  label,
  nilai,
  tebal,
  kurang,
}: {
  label: string;
  nilai: number;
  tebal?: boolean;
  kurang?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={
          tebal
            ? "font-semibold text-gray-900 dark:text-gray-50"
            : "text-gray-700 dark:text-gray-300"
        }
      >
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          tebal ? "text-base font-semibold" : "",
          kurang && nilai !== 0
            ? "text-red-700 dark:text-red-400"
            : tebal
              ? nilai >= 0
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
              : "text-gray-900 dark:text-gray-100",
        ].join(" ")}
      >
        {formatRupiah(nilai)}
      </dd>
    </div>
  );
}
