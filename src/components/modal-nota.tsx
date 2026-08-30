"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PenjualanDetail } from "@/lib/tipe";
import { LABEL_CHANNEL, LABEL_STATUS_BAYAR } from "@/lib/tipe";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { Badge, Skeleton, Tabel, TabelWrap, Td, Th } from "@/components/ui/ui";

export function ModalNota({
  penjualanId,
  onClose,
}: {
  penjualanId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["penjualan", penjualanId],
    queryFn: () => api.get<PenjualanDetail>(`/api/penjualan/${penjualanId}`),
    enabled: !!penjualanId,
  });

  return (
    <Modal
      open={!!penjualanId}
      onOpenChange={(v) => !v && onClose()}
      judul={data ? `Nota ${data.noNota}` : "Detail Nota"}
      deskripsi={
        data ? `${data.pembeli} · ${formatTanggal(data.tanggal)}` : undefined
      }
      lebar="xl"
    >
      {isLoading && <Skeleton className="h-48" />}
      {error && (
        <p className="text-sm text-red-700 dark:text-red-400">{(error as Error).message}</p>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="Tipe" nilai={data.tipePembeli} />
            <Info label="Channel" nilai={LABEL_CHANNEL[data.channel]} />
            <Info label="Metode" nilai={data.metodeBayar === "CASH" ? "Cash" : "Piutang"} />
            <Info
              label="Status Bayar"
              nilai={LABEL_STATUS_BAYAR[data.statusBayar]}
              badge={
                data.statusBayar === "LUNAS"
                  ? "hijau"
                  : data.statusBayar === "SEBAGIAN"
                    ? "kuning"
                    : "merah"
              }
            />
          </div>

          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Jam</Th>
                  <Th className="text-right">HPP</Th>
                  <Th className="text-right">Harga Jual</Th>
                  <Th className="text-right">Laba</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {data.items.map((i) => (
                  <tr key={i.id}>
                    <Td>
                      <Link
                        href={`/unit/${i.unitId}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {i.kodeUnit}
                      </Link>
                    </Td>
                    <Td>
                      {i.brand} {i.model}
                    </Td>
                    <Td className="text-right tabular-nums">{formatRupiah(i.hppSaatJual)}</Td>
                    <Td className="text-right tabular-nums">{formatRupiah(i.hargaJual)}</Td>
                    <Td
                      className={
                        i.laba < 0
                          ? "text-right font-medium tabular-nums text-red-700 dark:text-red-400"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatRupiah(i.laba)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <dl className="space-y-1.5 text-sm">
              <BarisRingkas label="Subtotal" nilai={data.subtotal} />
              <BarisRingkas
                label={`Ongkir (${data.penanggungOngkir === "TOKO" ? "toko" : "pembeli"})`}
                nilai={data.ongkir}
              />
              <BarisRingkas label="Total Tagihan" nilai={data.totalTagihan} tebal />
              <BarisRingkas label="Sudah dibayar" nilai={data.totalDibayar} />
              {data.sisaPiutang > 0 && (
                <BarisRingkas label="Sisa piutang" nilai={data.sisaPiutang} warna="kuning" />
              )}
              <BarisRingkas
                label="Laba transaksi"
                nilai={data.laba}
                tebal
                warna={data.laba >= 0 ? "hijau" : "merah"}
              />
            </dl>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-900 dark:text-gray-50">
                Riwayat Pembayaran
              </p>
              {data.pembayaran.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Belum ada pembayaran.</p>
              ) : (
                <ul className="divide-y divide-gray-200 text-sm dark:divide-zinc-700">
                  {data.pembayaran.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3 py-1.5">
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatTanggal(p.tanggal)}
                        {p.catatan && (
                          <span className="text-gray-600 dark:text-gray-400"> · {p.catatan}</span>
                        )}
                      </span>
                      <span className="tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(p.jumlah)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {data.jatuhTempo && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Jatuh tempo {formatTanggal(data.jatuhTempo)}
                  {data.terlewat && (
                    <Badge warna="merah" className="ml-2">
                      Terlewat
                    </Badge>
                  )}
                </p>
              )}
            </div>
          </div>

          {data.catatan && (
            <p className="rounded-lg bg-gray-100 p-2.5 text-sm text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
              {data.catatan}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({
  label,
  nilai,
  badge,
}: {
  label: string;
  nilai: string;
  badge?: "hijau" | "kuning" | "merah";
}) {
  return (
    <div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      {badge ? (
        <Badge warna={badge}>{nilai}</Badge>
      ) : (
        <p className="font-medium text-gray-900 dark:text-gray-50">{nilai}</p>
      )}
    </div>
  );
}

function BarisRingkas({
  label,
  nilai,
  tebal,
  warna,
}: {
  label: string;
  nilai: number;
  tebal?: boolean;
  warna?: "hijau" | "merah" | "kuning";
}) {
  const kelas =
    warna === "hijau"
      ? "text-green-700 dark:text-green-400"
      : warna === "merah"
        ? "text-red-700 dark:text-red-400"
        : warna === "kuning"
          ? "text-amber-700 dark:text-amber-400"
          : "text-gray-900 dark:text-gray-100";

  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className={`tabular-nums ${kelas} ${tebal ? "font-semibold" : ""}`}>
        {formatRupiah(nilai)}
      </dd>
    </div>
  );
}
