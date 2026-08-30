"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { UnitRingkas } from "@/lib/tipe";
import { formatRupiah, formatTanggal, rentangBulanWIB, bulanIniWIB } from "@/lib/utils";
import { PilihBulan } from "@/components/pilih-bulan";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

export default function HalamanRusak() {
  const qc = useQueryClient();
  const [bulan, setBulan] = React.useState<string>("SEMUA");
  const [batalUntuk, setBatalUntuk] = React.useState<UnitRingkas | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["units", "RUSAK"],
    queryFn: () => api.get<{ data: UnitRingkas[] }>("/api/units?status=RUSAK"),
  });

  const batal = useMutation({
    mutationFn: (id: string) => api.del(`/api/units/${id}/rusak`),
    onSuccess: () => {
      toast.success("Write-off dibatalkan — unit kembali ke stok");
      setBatalUntuk(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setBatalUntuk(null);
    },
  });

  const semua = data?.data ?? [];

  const tampil = React.useMemo(() => {
    if (bulan === "SEMUA") return semua;
    const { dari, sampai } = rentangBulanWIB(bulan);
    return semua.filter((u) => {
      if (!u.tglKeluar) return false;
      const t = new Date(u.tglKeluar);
      return t >= dari && t < sampai;
    });
  }, [semua, bulan]);

  const totalKerugian = tampil.reduce((t, u) => t + u.hpp, 0);
  const kerugianBulanIni = semua
    .filter((u) => {
      if (!u.tglKeluar) return false;
      const { dari, sampai } = rentangBulanWIB(bulanIniWIB());
      const t = new Date(u.tglKeluar);
      return t >= dari && t < sampai;
    })
    .reduce((t, u) => t + u.hpp, 0);

  return (
    <>
      <PageHeader
        judul="Barang Rusak"
        deskripsi="Unit yang ditulis-hapus. Seluruh HPP-nya diakui sebagai kerugian pada tanggal write-off."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Kerugian (periode tampil)" nilai={totalKerugian} nada={totalKerugian > 0 ? "buruk" : "netral"} />
        <StatCard label="Kerugian bulan ini" nilai={kerugianBulanIni} nada={kerugianBulanIni > 0 ? "buruk" : "netral"} />
        <StatCard label="Jumlah unit" nilai={tampil.length} rupiah={false} />
      </div>

      <Card className="mb-4">
        <Field label="Periode" className="sm:max-w-xs">
          <PilihBulan value={bulan} onChange={setBulan} denganSemua className="w-full" />
        </Field>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={5} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : tampil.length === 0 ? (
          <EmptyState
            judul="Tidak ada barang rusak"
            deskripsi="Bagus — belum ada unit yang harus ditulis-hapus di periode ini."
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Jam</Th>
                  <Th className="text-right">Harga Beli</Th>
                  <Th className="text-right">Biaya Service</Th>
                  <Th className="text-right">Kerugian (HPP)</Th>
                  <Th>Tanggal</Th>
                  <Th>Alasan</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {tampil.map((u) => (
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
                    <Td className="text-right tabular-nums">{formatRupiah(u.hargaBeli)}</Td>
                    <Td className="text-right tabular-nums">
                      {u.totalBiayaService > 0 ? formatRupiah(u.totalBiayaService) : "-"}
                    </Td>
                    <Td className="text-right font-medium tabular-nums text-red-700 dark:text-red-400">
                      {formatRupiah(u.hpp)}
                    </Td>
                    <Td>{formatTanggal(u.tglKeluar)}</Td>
                    <Td className="max-w-[260px] truncate text-gray-600 dark:text-gray-400">
                      {u.alasanRusak ?? "-"}
                    </Td>
                    <Td className="text-right">
                      <Button
                        varian="secondary"
                        className="min-h-[36px] px-3 py-1"
                        onClick={() => setBatalUntuk(u)}
                      >
                        <RotateCcw className="h-4 w-4" /> Batalkan
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <ConfirmDialog
        open={!!batalUntuk}
        onOpenChange={(v) => !v && setBatalUntuk(null)}
        judul="Batalkan write-off?"
        varian="primary"
        labelKonfirmasi="Ya, kembalikan ke stok"
        loading={batal.isPending}
        onKonfirmasi={() => batalUntuk && batal.mutate(batalUntuk.id)}
        pesan={
          <>
            <p>
              <strong>{batalUntuk?.kodeUnit}</strong> akan dikembalikan ke status sebelum
              dinyatakan rusak, dan kerugian {formatRupiah(batalUntuk?.hpp ?? 0)} dihapus dari
              laporan.
            </p>
            <p className="mt-2">Baris ledger "Keluar — Barang Rusak" juga akan dihapus.</p>
          </>
        }
      />
    </>
  );
}
