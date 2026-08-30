"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Package,
  Wallet,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { PosisiKeuangan, RingkasanDashboard } from "@/lib/laporan";
import { bulanIniWIB, formatAngka, formatPersen, formatRupiah } from "@/lib/utils";
import { LABEL_KOMPONEN } from "@/lib/tipe";
import { PilihBulan } from "@/components/pilih-bulan";
import {
  Badge,
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

export default function HalamanDashboard() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", bulan],
    queryFn: () => api.get<RingkasanDashboard>(`/api/dashboard?bulan=${bulan}`),
  });

  return (
    <>
      <PageHeader
        judul="Dashboard"
        deskripsi="Ringkasan omzet, laba, stok, dan piutang."
        aksi={<PilihBulan value={bulan} onChange={setBulan} />}
      />

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {error && <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />}

      {data && (
        <div className="space-y-5">
          {/* Kartu utama */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Saldo Kas"
              nilai={data.saldoKas}
              nada={data.saldoKas < 0 ? "buruk" : "netral"}
              sub="Uang yang benar-benar ada"
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Omzet"
              nilai={data.omzet}
              sub={`${formatAngka(data.unitTerjual)} unit terjual`}
            />
            <StatCard
              label="Laba Kotor Barang"
              nilai={data.labaKotorBarang}
              nada="auto"
              sub={`Margin kotor ${formatPersen(data.marginRata)}`}
            />
            <StatCard
              label="Laba Bersih Usaha"
              nilai={data.labaBersihUsaha}
              nada="auto"
              sub="Setelah biaya operasional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Modal Terpakai" nilai={data.modal} />
            <StatCard label="Biaya Service" nilai={data.biayaService} />
            <StatCard
              label="Biaya Operasional"
              nilai={data.biayaOperasional}
              nada={data.biayaOperasional > 0 ? "buruk" : "netral"}
            />
            <StatCard
              label="Kerugian Barang Rusak"
              nilai={data.kerugianRusak}
              nada={data.kerugianRusak > 0 ? "buruk" : "netral"}
              sub={
                data.kerugianSparepart > 0
                  ? `+ sparepart ${formatRupiah(data.kerugianSparepart)}`
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Nilai Stok Jam"
              nilai={data.nilaiStok}
              sub={`${formatAngka(data.statusUnit.ready)} unit ready`}
            />
            <StatCard
              label="Nilai Stok Sparepart"
              nilai={data.nilaiSparepart}
              icon={<Boxes className="h-4 w-4" />}
            />
            <StatCard
              label="Piutang Berjalan"
              nilai={data.piutangBerjalan}
              sub={
                data.piutangTerlewat > 0
                  ? `${formatRupiah(data.piutangTerlewat)} lewat jatuh tempo`
                  : "Tidak ada yang lewat jatuh tempo"
              }
              nada={data.piutangTerlewat > 0 ? "buruk" : "netral"}
            />
            <StatCard
              label="Ongkir Ditanggung Toko"
              nilai={data.ongkirToko}
              nada={data.ongkirToko > 0 ? "buruk" : "netral"}
            />
          </div>

          <PosisiKeuanganCard />

          {/* Status unit */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KartuStatus
              href="/qc"
              icon={<ClipboardCheck className="h-5 w-5" />}
              label="Antrian QC"
              jumlah={data.statusUnit.masukQc}
            />
            <KartuStatus
              href="/service"
              icon={<Wrench className="h-5 w-5" />}
              label="Di Bengkel"
              jumlah={data.statusUnit.service}
            />
            <KartuStatus
              href="/unit?status=READY"
              icon={<Package className="h-5 w-5" />}
              label="Siap Dijual"
              jumlah={data.statusUnit.ready}
            />
          </div>

          {data.sparepartMenipis.length > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Sparepart menipis
                </h2>
              </div>
              <ul className="flex flex-wrap gap-2">
                {data.sparepartMenipis.map((s) => (
                  <li key={s.id}>
                    <Link href="/sparepart">
                      <Badge warna={s.stok === 0 ? "merah" : "kuning"}>
                        {s.nama} — sisa {s.stok} {s.satuan} (min {s.minStok})
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Tren + saluran */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Tren 6 Bulan
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tren} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-gray-700 dark:text-gray-300"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-gray-700 dark:text-gray-300"
                      tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}jt`}
                      width={44}
                    />
                    <Tooltip
                      formatter={(v) => formatRupiah(Number(v ?? 0))}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--foreground)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="omzet" name="Omzet" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="laba" name="Laba" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
                B2B vs B2C
              </h2>
              <BarisSaluran
                label="B2B (Mitra)"
                warna="bg-blue-600 dark:bg-blue-500"
                omzet={data.saluran.b2b.omzet}
                unit={data.saluran.b2b.unit}
                laba={data.saluran.b2b.laba}
                total={data.omzet}
              />
              <BarisSaluran
                label="B2C (Konsumen)"
                warna="bg-purple-600 dark:bg-purple-500"
                omzet={data.saluran.b2c.omzet}
                unit={data.saluran.b2c.unit}
                laba={data.saluran.b2c.laba}
                total={data.omzet}
              />
              {data.omzet === 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Belum ada penjualan di periode ini.
                </p>
              )}
            </Card>
          </div>

          {/* Barang mengendap */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Barang Mengendap (&gt; 30 hari)
              </h2>
              {data.barangMengendap.length > 0 && (
                <Badge warna="kuning">{data.barangMengendap.length} unit</Badge>
              )}
            </div>

            {data.barangMengendap.length === 0 ? (
              <EmptyState
                judul="Tidak ada barang mengendap"
                deskripsi="Semua stok ready berumur 30 hari atau kurang."
              />
            ) : (
              <TabelWrap>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Kode</Th>
                      <Th>Jam</Th>
                      <Th>Grade</Th>
                      <Th className="text-right">HPP</Th>
                      <Th className="text-right">Harga Jual</Th>
                      <Th className="text-right">Umur</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {data.barangMengendap.slice(0, 15).map((u) => (
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
                        <Td>{u.grade ?? "-"}</Td>
                        <Td className="text-right tabular-nums">{formatRupiah(u.hpp)}</Td>
                        <Td className="text-right tabular-nums">{formatRupiah(u.hargaJual)}</Td>
                        <Td className="text-right">
                          <Badge warna={u.umurHari > 60 ? "merah" : "kuning"}>
                            {u.umurHari} hari
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWrap>
            )}
          </Card>

          {/* Ranking produk */}
          <Card>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Ranking Produk — {data.periode.label}
              </h2>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                dikelompokkan per model, imbuhan service tidak memisahkan
              </span>
            </div>

            {data.rankingProduk.length === 0 ? (
              <EmptyState
                judul="Belum ada penjualan"
                deskripsi="Ranking muncul setelah ada unit terjual di periode ini."
              />
            ) : (
              <TabelWrap>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Produk</Th>
                      <Th className="text-right">Terjual</Th>
                      <Th className="text-right">Omzet</Th>
                      <Th className="text-right">Laba</Th>
                      <Th className="text-right">Margin</Th>
                      <Th className="text-right">Rata-rata Laku</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {data.rankingProduk.map((p, i) => (
                      <tr key={p.namaDasar}>
                        <Td className="text-gray-600 dark:text-gray-400">{i + 1}</Td>
                        <Td className="font-medium">{p.namaDasar}</Td>
                        <Td className="text-right tabular-nums">{p.unitTerjual}</Td>
                        <Td className="text-right tabular-nums">{formatRupiah(p.omzet)}</Td>
                        <Td
                          className={
                            p.laba < 0
                              ? "text-right font-medium tabular-nums text-red-700 dark:text-red-400"
                              : "text-right tabular-nums text-green-700 dark:text-green-400"
                          }
                        >
                          {formatRupiah(p.laba)}
                        </Td>
                        <Td className="text-right tabular-nums">{formatPersen(p.margin)}</Td>
                        <Td className="text-right">
                          {p.rataHariTerjual === null ? (
                            <span className="text-gray-600 dark:text-gray-400">-</span>
                          ) : (
                            <Badge warna={p.rataHariTerjual > 30 ? "kuning" : "hijau"}>
                              {p.rataHariTerjual} hari
                            </Badge>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWrap>
            )}
          </Card>

          {/* Ranking mitra + rincian service */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Ranking Mitra — {data.periode.label}
              </h2>
              {data.rankingMitra.length === 0 ? (
                <EmptyState judul="Belum ada transaksi B2B" deskripsi="Periode ini." />
              ) : (
                <TabelWrap>
                  <Tabel>
                    <thead>
                      <tr>
                        <Th>#</Th>
                        <Th>Mitra</Th>
                        <Th className="text-right">Unit</Th>
                        <Th className="text-right">Omzet</Th>
                        <Th className="text-right">Laba</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                      {data.rankingMitra.map((m, i) => (
                        <tr key={m.id}>
                          <Td className="text-gray-600 dark:text-gray-400">{i + 1}</Td>
                          <Td className="font-medium">{m.nama}</Td>
                          <Td className="text-right tabular-nums">{m.unit}</Td>
                          <Td className="text-right tabular-nums">{formatRupiah(m.omzet)}</Td>
                          <Td className="text-right tabular-nums">{formatRupiah(m.laba)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabel>
                </TabelWrap>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Biaya Operasional — {data.periode.label}
              </h2>
              {data.biayaPerKategori.length === 0 ? (
                <EmptyState
                  judul="Belum ada biaya operasional"
                  deskripsi="Sewa, gaji, listrik, dan sejenisnya dicatat di halaman Biaya Operasional."
                  aksi={
                    <Link href="/biaya">
                      <span className="text-sm text-blue-700 hover:underline dark:text-blue-400">
                        Buka halaman Biaya Operasional
                      </span>
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-gray-200 text-sm dark:divide-zinc-700">
                  {data.biayaPerKategori.map((k) => (
                    <li key={k.kategori} className="flex justify-between gap-3 py-2">
                      <span className="text-gray-900 dark:text-gray-100">{k.label}</span>
                      <span className="tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(k.jumlah)}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-3 py-2 font-semibold">
                    <span className="text-gray-900 dark:text-gray-50">Total</span>
                    <span className="tabular-nums text-gray-900 dark:text-gray-50">
                      {formatRupiah(data.biayaOperasional)}
                    </span>
                  </li>
                </ul>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Biaya Service — {data.periode.label}
              </h2>
              {data.biayaServiceRinci.length === 0 ? (
                <EmptyState judul="Belum ada biaya service" deskripsi="Periode ini." />
              ) : (
                <ul className="divide-y divide-gray-200 text-sm dark:divide-zinc-700">
                  {data.biayaServiceRinci.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{b.kodeUnit}</span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          ({LABEL_KOMPONEN[b.jenis as keyof typeof LABEL_KOMPONEN] ?? b.jenis}
                          {b.deskripsi ? ` — ${b.deskripsi}` : ""})
                        </span>
                        {b.dariStok && (
                          <Badge warna="ungu" className="ml-2">
                            dari stok
                          </Badge>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(b.biaya)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function KartuStatus({
  href,
  icon,
  label,
  jumlah,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  jumlah: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
    >
      <span className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        {icon}
      </span>
      <span>
        <span className="block text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <span className="block text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-50">
          {formatAngka(jumlah)} unit
        </span>
      </span>
    </Link>
  );
}

function BarisSaluran({
  label,
  warna,
  omzet,
  unit,
  laba,
  total,
}: {
  label: string;
  warna: string;
  omzet: number;
  unit: number;
  laba: number;
  total: number;
}) {
  const persen = total > 0 ? omzet / total : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</span>
        <span className="text-sm tabular-nums text-gray-900 dark:text-gray-50">
          {formatRupiah(omzet)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
        <div className={`h-full ${warna}`} style={{ width: `${Math.round(persen * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        {formatPersen(persen)} · {unit} unit · laba {formatRupiah(laba)}
      </p>
    </div>
  );
}

/**
 * Posisi keuangan sejak app dipakai, beserta pemeriksaan silang:
 * saldo kas sesungguhnya harus sama dengan yang dihitung dari modal,
 * laba, persediaan, dan piutang.
 */
function PosisiKeuanganCard() {
  const { data } = useQuery({
    queryKey: ["posisi"],
    queryFn: () => api.get<PosisiKeuangan>("/api/posisi"),
  });

  if (!data) return <Skeleton className="h-40" />;

  const cocok = Math.abs(data.selisih) < 1;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
        Posisi Keuangan — sejak app dipakai
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <dl className="space-y-1.5 text-sm">
          <BarisPosisi label="Saldo Kas" nilai={data.saldoKas} />
          <BarisPosisi label="Nilai persediaan jam" nilai={data.nilaiPersediaanUnit} />
          <BarisPosisi
            label="Nilai persediaan sparepart"
            nilai={data.nilaiPersediaanSparepart}
          />
          <BarisPosisi label="Piutang belum tertagih" nilai={data.piutang} />
          <div className="border-t border-gray-200 pt-1.5 dark:border-zinc-700">
            <BarisPosisi label="Total aset" nilai={data.totalAset} tebal />
          </div>
        </dl>

        <dl className="space-y-1.5 text-sm">
          <BarisPosisi label="Modal disetor" nilai={data.modalDisetor} />
          <BarisPosisi label="Prive (diambil pemilik)" nilai={-data.prive} />
          <BarisPosisi label="Laba kumulatif" nilai={data.labaKumulatif} />
          <div className="border-t border-gray-200 pt-1.5 dark:border-zinc-700">
            <BarisPosisi label="Saldo kas seharusnya" nilai={data.saldoKasSeharusnya} tebal />
          </div>
        </dl>
      </div>

      <div
        className={
          cocok
            ? "mt-4 flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
            : "mt-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        }
      >
        {cocok ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div>
          {cocok ? (
            <p>
              <strong>Pembukuan cocok.</strong> Saldo kas sama dengan hasil perhitungan dari
              modal, laba, persediaan, dan piutang.
            </p>
          ) : (
            <p>
              <strong>Selisih {formatRupiah(data.selisih)}.</strong> Ada transaksi yang belum
              tercatat, atau saldo kas perlu disesuaikan lewat halaman Kas.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function BarisPosisi({
  label,
  nilai,
  tebal,
}: {
  label: string;
  nilai: number;
  tebal?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt
        className={
          tebal
            ? "font-semibold text-gray-900 dark:text-gray-50"
            : "text-gray-600 dark:text-gray-400"
        }
      >
        {label}
      </dt>
      <dd
        className={
          tebal
            ? "font-semibold tabular-nums text-gray-900 dark:text-gray-50"
            : "tabular-nums text-gray-900 dark:text-gray-100"
        }
      >
        {formatRupiah(nilai)}
      </dd>
    </div>
  );
}
