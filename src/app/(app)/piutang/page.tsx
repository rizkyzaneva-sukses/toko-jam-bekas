"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download } from "lucide-react";
import { api } from "@/lib/api-client";
import type { PenjualanRingkas } from "@/lib/tipe";
import { LABEL_STATUS_BAYAR } from "@/lib/tipe";
import { formatRupiah, formatTanggal, selisihHari } from "@/lib/utils";
import { ModalNota } from "@/components/modal-nota";
import { ModalPembayaran, type TargetPembayaran } from "@/components/modal-pembayaran";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

export default function HalamanPiutang() {
  const [notaDibuka, setNotaDibuka] = React.useState<string | null>(null);
  const [bayarUntuk, setBayarUntuk] = React.useState<TargetPembayaran | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["piutang"],
    queryFn: () =>
      api.get<PenjualanRingkas[]>("/api/penjualan?bulan=SEMUA&statusBayar=BELUM_LUNAS"),
  });

  const notas = data ?? [];
  const total = notas.reduce((t, n) => t + n.sisaPiutang, 0);
  const terlewat = notas.filter((n) => n.terlewat);
  const totalTerlewat = terlewat.reduce((t, n) => t + n.sisaPiutang, 0);

  return (
    <>
      <PageHeader
        judul="Piutang"
        deskripsi="Tagihan yang belum lunas, seluruh periode."
        aksi={
          <a href="/api/export?jenis=piutang">
            <Button varian="secondary">
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          </a>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Piutang Berjalan" nilai={total} />
        <StatCard
          label="Lewat Jatuh Tempo"
          nilai={totalTerlewat}
          sub={`${terlewat.length} transaksi`}
          nada={totalTerlewat > 0 ? "buruk" : "netral"}
        />
        <StatCard label="Jumlah transaksi" nilai={notas.length} rupiah={false} />
      </div>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={6} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : notas.length === 0 ? (
          <EmptyState
            judul="Tidak ada piutang berjalan"
            deskripsi="Semua transaksi sudah lunas."
            aksi={
              <Link href="/penjualan">
                <Button varian="secondary">Lihat penjualan</Button>
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
                  <Th className="text-right">Tagihan</Th>
                  <Th className="text-right">Dibayar</Th>
                  <Th className="text-right">Sisa</Th>
                  <Th>Jatuh Tempo</Th>
                  <Th className="text-right">Umur</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {notas.map((n) => (
                  <tr key={n.id} className={n.terlewat ? "bg-red-50/60 dark:bg-red-950/20" : ""}>
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
                    <Td className="text-right tabular-nums">{formatRupiah(n.totalTagihan)}</Td>
                    <Td className="text-right tabular-nums">{formatRupiah(n.totalDibayar)}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatRupiah(n.sisaPiutang)}
                    </Td>
                    <Td>
                      {n.jatuhTempo ? (
                        <span className="inline-flex items-center gap-1.5">
                          {formatTanggal(n.jatuhTempo)}
                          {n.terlewat && (
                            <Badge warna="merah">
                              <AlertTriangle className="h-3 w-3" /> Terlewat
                            </Badge>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{selisihHari(n.tanggal)} hari</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge
                          warna={n.statusBayar === "SEBAGIAN" ? "kuning" : "abu"}
                        >
                          {LABEL_STATUS_BAYAR[n.statusBayar]}
                        </Badge>
                        <Button
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
                          Catat bayar
                        </Button>
                      </div>
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
