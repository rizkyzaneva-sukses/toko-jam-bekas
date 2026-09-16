"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatRupiah } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { Button, Field, Input } from "@/components/ui/ui";
import type { DampakHapusUnit } from "@/lib/unit";

/**
 * Pembatalan unit salah input.
 *
 * Alur: buka dialog -> ambil pratinjau dampak -> user mengetik kode unit
 * untuk membuka tombol hapus -> DELETE. Kalau unit sudah punya riwayat,
 * user wajib mencentang peringatan (mode paksa).
 */
export function ModalHapusUnit({
  unit,
  onClose,
  onSukses,
}: {
  unit: { id: string; kodeUnit: string } | null;
  onClose: () => void;
  onSukses?: () => void;
}) {
  const qc = useQueryClient();
  const [ketikan, setKetikan] = React.useState("");
  const [setuju, setSetuju] = React.useState(false);

  const { data: dampak, isLoading } = useQuery({
    queryKey: ["dampak-hapus-unit", unit?.id],
    queryFn: () => api.get<DampakHapusUnit>(`/api/units/${unit!.id}/dampak-hapus`),
    enabled: !!unit?.id,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (unit) {
      setKetikan("");
      setSetuju(false);
    }
  }, [unit]);

  const perluPaksa = !!dampak && !dampak.bolehHapusTanpaPaksa;
  const terjual = !!dampak?.sudahTerjual;
  const kodeCocok = !!dampak && ketikan.trim() === dampak.kodeUnit;
  const bolehHapus = !!dampak && !terjual && kodeCocok && (!perluPaksa || setuju);

  const hapus = useMutation({
    mutationFn: () =>
      api.del(`/api/units/${unit!.id}${perluPaksa ? "?paksa=1" : ""}`),
    onSuccess: () => {
      toast.success(`${unit!.kodeUnit} dibatalkan & dihapus`);
      qc.invalidateQueries();
      onSukses?.();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!unit}
      onOpenChange={(v) => !v && !hapus.isPending && onClose()}
      judul="Batalkan & Hapus Unit"
      deskripsi={
        unit ? `${unit.kodeUnit} akan dihapus permanen dari sistem.` : undefined
      }
      lebar="lg"
    >
      {isLoading || !dampak ? (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Memeriksa dampak penghapusan…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ringkasan unit */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/60">
            <div className="font-medium text-gray-900 dark:text-gray-50">
              {dampak.brand} {dampak.model}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
              <span>Kode: {dampak.kodeUnit}</span>
              <span>Status: {dampak.status}</span>
              <span>Harga beli: {formatRupiah(dampak.hargaBeli)}</span>
              <span>HPP: {formatRupiah(dampak.hpp)}</span>
            </div>
          </div>

          {/* Blokir total: sudah terjual */}
          {terjual && (
            <div className="flex gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-semibold">Tidak bisa dihapus dari sini</div>
                <div className="mt-1">
                  Unit ini sudah terjual
                  {dampak.noNota ? ` di nota ${dampak.noNota}` : ""}. Batalkan
                  dulu nota penjualannya dari halaman Penjualan — setelah itu
                  unit baru bisa dihapus.
                </div>
              </div>
            </div>
          )}

          {/* Peringatan mode paksa */}
          {perluPaksa && !terjual && (
            <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <div>
                  <div className="font-semibold">
                    Unit sudah punya riwayat — penghapusan paksa
                  </div>
                  <div className="mt-1 text-amber-800 dark:text-amber-300">
                    {dampak.alasanBlokir}
                  </div>
                </div>
                <ul className="list-disc space-y-0.5 pl-4 text-amber-800 dark:text-amber-300">
                  {dampak.jumlahQc > 0 && (
                    <li>{dampak.jumlahQc} catatan QC akan ikut terhapus</li>
                  )}
                  {dampak.jumlahService > 0 && (
                    <li>
                      {dampak.jumlahService} data service (
                      {dampak.jumlahKomponenService} komponen) akan ikut
                      terhapus
                    </li>
                  )}
                  {dampak.sparepartDipakai.length > 0 && (
                    <li>
                      Sparepart dikembalikan ke stok:{" "}
                      {dampak.sparepartDipakai
                        .map((s) => `${s.nama} (${s.qty})`)
                        .join(", ")}
                    </li>
                  )}
                  {dampak.jumlahBarisKas > 0 && (
                    <li>
                      {dampak.jumlahBarisKas} baris kas terkait ikut dihapus —{" "}
                      <strong>
                        {formatRupiah(dampak.kerugianKas)}
                      </strong>{" "}
                      yang sudah keluar <em>tidak kembali</em>
                    </li>
                  )}
                </ul>
                {dampak.jumlahBarisKas > 0 && (
                  <div className="rounded border border-amber-400/60 bg-amber-100/60 p-2 text-xs dark:border-amber-700 dark:bg-amber-900/30">
                    Catatan penting: karena catatan kas ikut dihapus tapi uangnya
                    sudah terlanjur dibayar ke penjual, saldo kas di sistem akan
                    tercatat lebih kecil {formatRupiah(dampak.kerugianKas)}{" "}
                    daripada uang fisik. Setor penyesuaian kalau uangnya berhasil
                    ditarik kembali.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aman dihapus */}
          {!perluPaksa && !terjual && (
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300">
              Unit ini masih di antrian <strong>QC</strong> dan belum punya
              riwayat. Semua jejaknya (kas pembelian + pergerakan stok) akan
              dibersihkan otomatis, seolah unit ini tidak pernah ada.
            </div>
          )}

          {/* Konfirmasi ketik kode */}
          {!terjual && (
            <>
              {perluPaksa && (
                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={setuju}
                    onChange={(e) => setSetuju(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-zinc-600"
                  />
                  <span>
                    Saya paham penghapusan ini permanen dan tidak bisa
                    dikembalikan.
                  </span>
                </label>
              )}

              <Field
                label={`Ketik kode unit "${dampak.kodeUnit}" untuk konfirmasi`}
                required
              >
                <Input
                  value={ketikan}
                  onChange={(e) => setKetikan(e.target.value)}
                  placeholder={dampak.kodeUnit}
                  autoComplete="off"
                  autoFocus
                />
              </Field>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              varian="secondary"
              onClick={onClose}
              disabled={hapus.isPending}
            >
              {terjual ? "Tutup" : "Batal"}
            </Button>
            {!terjual && (
              <Button
                varian="danger"
                loading={hapus.isPending}
                disabled={!bolehHapus}
                onClick={() => hapus.mutate()}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {perluPaksa ? "Hapus Permanen (Paksa)" : "Batalkan & Hapus"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}