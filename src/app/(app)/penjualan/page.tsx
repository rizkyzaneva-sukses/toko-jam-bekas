"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { PenjualanRingkas } from "@/lib/tipe";
import { LABEL_CHANNEL, LABEL_STATUS_BAYAR } from "@/lib/tipe";
import { bulanIniWIB, formatRupiah, formatTanggal } from "@/lib/utils";
import { PilihBulan } from "@/components/pilih-bulan";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ModalNota } from "@/components/modal-nota";
import { ModalPembayaran, type TargetPembayaran } from "@/components/modal-pembayaran";
import {
  Badge,
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

export default function HalamanPenjualan() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());
  const [tipe, setTipe] = React.useState("SEMUA");
  const [statusBayar, setStatusBayar] = React.useState("SEMUA");
  const [q, setQ] = React.useState("");
  const [qDebounce, setQDebounce] = React.useState("");
  const [notaDibuka, setNotaDibuka] = React.useState<string | null>(null);
  const [bayarUntuk, setBayarUntuk] = React.useState<TargetPembayaran | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounce(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["penjualan", bulan, tipe, statusBayar, qDebounce],
    queryFn: () =>
      api.get<PenjualanRingkas[]>(
        `/api/penjualan?bulan=${bulan}&tipe=${tipe}&statusBayar=${statusBayar}&q=${encodeURIComponent(qDebounce)}`
      ),
  });

  const notas = data ?? [];
  const omzet = notas.reduce((t, n) => t + n.subtotal, 0);
  const laba = notas.reduce((t, n) => t + n.laba, 0);
  const unit = notas.reduce((t, n) => t + n.jumlahUnit, 0);
  const piutang = notas.reduce((t, n) => t + n.sisaPiutang, 0);

  return (
    <>
      <PageHeader
        judul="Penjualan"
        deskripsi="Semua nota penjualan B2B dan B2C."
        aksi={
          <Link href="/penjualan/baru">
            <Button>
              <Plus className="h-4 w-4" /> Transaksi baru
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Omzet (periode tampil)" nilai={omzet} sub={`${unit} unit`} />
        <StatCard label="Laba" nilai={laba} nada="auto" />
        <StatCard label="Jumlah nota" nilai={notas.length} rupiah={false} />
        <StatCard label="Piutang di daftar ini" nilai={piutang} nada={piutang > 0 ? "buruk" : "netral"} />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Cari">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="No nota / nama pembeli"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Periode">
            <PilihBulan value={bulan} onChange={setBulan} denganSemua className="w-full" />
          </Field>

          <Field label="Tipe Pembeli">
            <SearchableSelect
              options={[
                { value: "SEMUA", label: "Semua tipe" },
                { value: "B2B", label: "B2B — Mitra" },
                { value: "B2C", label: "B2C — Konsumen" },
              ]}
              value={tipe}
              onChange={(v) => setTipe(v ?? "SEMUA")}
              placeholder="Semua tipe"
            />
          </Field>

          <Field label="Status Bayar">
            <SearchableSelect
              options={[
                { value: "SEMUA", label: "Semua status" },
                { value: "LUNAS", label: "Lunas" },
                { value: "SEBAGIAN", label: "Sebagian" },
                { value: "BELUM_LUNAS", label: "Belum lunas (semua piutang)" },
              ]}
              value={statusBayar}
              onChange={(v) => setStatusBayar(v ?? "SEMUA")}
              placeholder="Semua status"
            />
          </Field>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={8} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : notas.length === 0 ? (
          <EmptyState
            judul="Belum ada transaksi"
            deskripsi="Coba ubah filter periode, atau buat transaksi baru."
            aksi={
              <Link href="/penjualan/baru">
                <Button>Transaksi baru</Button>
              </Link>
            }
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>No Nota</Th>
                  <Th>Tanggal</Th>
                  <Th>Pembeli</Th>
                  <Th>Channel</Th>
                  <Th className="text-right">Unit</Th>
                  <Th className="text-right">Tagihan</Th>
                  <Th className="text-right">Laba</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {notas.map((n) => (
                  <tr key={n.id}>
                    <Td>
                      <button
                        onClick={() => setNotaDibuka(n.id)}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {n.noNota}
                      </button>
                    </Td>
                    <Td>{formatTanggal(n.tanggal)}</Td>
                    <Td>
                      {n.pembeli}
                      <Badge warna={n.tipePembeli === "B2B" ? "biru" : "ungu"} className="ml-2">
                        {n.tipePembeli}
                      </Badge>
                    </Td>
                    <Td className="text-gray-600 dark:text-gray-400">
                      {LABEL_CHANNEL[n.channel]}
                    </Td>
                    <Td className="text-right tabular-nums">{n.jumlahUnit}</Td>
                    <Td className="text-right tabular-nums">{formatRupiah(n.totalTagihan)}</Td>
                    <Td
                      className={
                        n.laba < 0
                          ? "text-right font-medium tabular-nums text-red-700 dark:text-red-400"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatRupiah(n.laba)}
                    </Td>
                    <Td>
                      <Badge
                        warna={
                          n.statusBayar === "LUNAS"
                            ? "hijau"
                            : n.terlewat
                              ? "merah"
                              : "kuning"
                        }
                      >
                        {LABEL_STATUS_BAYAR[n.statusBayar]}
                        {n.sisaPiutang > 0 ? ` · ${formatRupiah(n.sisaPiutang)}` : ""}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {n.sisaPiutang > 0 && (
                        <Button
                          varian="secondary"
                          className="min-h-[36px] px-3 py-1"
                          onClick={() =>
                            setBayarUntuk({
                              id: n.id,
                              noNota: n.noNota,
                              pembeli: n.pembeli,
                              sisaPiutang: n.sisaPiutang,
                            })
                          }
                        >
                          Bayar
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <ModalNota penjualanId={notaDibuka} onClose={() => setNotaDibuka(null)} />
      <ModalPembayaran target={bayarUntuk} onClose={() => setBayarUntuk(null)} />
    </>
  );
}
