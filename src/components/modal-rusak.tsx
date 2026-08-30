"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatRupiah, tanggalWIB } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { Button, Field, Input, Textarea } from "@/components/ui/ui";

/**
 * Write-off unit. Seluruh HPP unit langsung diakui sebagai kerugian
 * pada tanggal yang dipilih.
 */
export function ModalRusak({
  unit,
  onClose,
}: {
  unit: { id: string; kodeUnit: string; hpp: number } | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [alasan, setAlasan] = React.useState("");
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (unit) {
      setAlasan("");
      setTanggal(tanggalWIB());
      setError(undefined);
    }
  }, [unit]);

  const simpan = useMutation({
    mutationFn: () => api.post(`/api/units/${unit!.id}/rusak`, { alasan, tanggal }),
    onSuccess: () => {
      toast.success(`${unit!.kodeUnit} dipindahkan ke RUSAK`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!unit}
      onOpenChange={(v) => !v && onClose()}
      judul="Pindahkan ke RUSAK"
      deskripsi={
        unit
          ? `${unit.kodeUnit} — kerugian yang dicatat ${formatRupiah(unit.hpp)} (seluruh HPP unit).`
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Unit akan keluar dari stok dan HPP-nya langsung mengurangi laba pada tanggal ini.
          Aksi ini bisa dibatalkan dari halaman Barang Rusak.
        </div>

        <Field label="Alasan" required error={error}>
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Contoh: mesin pecah, tidak bisa diperbaiki"
            autoFocus
          />
        </Field>

        <Field label="Tanggal" required>
          <Input
            type="date"
            value={tanggal}
            max={tanggalWIB()}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            varian="danger"
            loading={simpan.isPending}
            onClick={() => {
              if (!alasan.trim()) {
                setError("Alasan wajib diisi");
                return;
              }
              setError(undefined);
              simpan.mutate();
            }}
          >
            Pindahkan ke RUSAK
          </Button>
        </div>
      </div>
    </Modal>
  );
}
