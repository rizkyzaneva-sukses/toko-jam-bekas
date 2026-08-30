"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatRupiah, tanggalWIB } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { Button, Field, Input, InputRupiah, Textarea } from "@/components/ui/ui";

export interface TargetPembayaran {
  id: string;
  noNota: string;
  pembeli: string;
  sisaPiutang: number;
}

/** Catat cicilan atau pelunasan piutang. */
export function ModalPembayaran({
  target,
  onClose,
}: {
  target: TargetPembayaran | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [jumlah, setJumlah] = React.useState<number | null>(null);
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [catatan, setCatatan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!target) return;
    setJumlah(target.sisaPiutang);
    setTanggal(tanggalWIB());
    setCatatan("");
    setErr({});
  }, [target]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post(`/api/penjualan/${target!.id}/pembayaran`, {
        jumlah,
        tanggal,
        catatan: catatan.trim() || null,
      }),
    onSuccess: (res: unknown) => {
      const status = (res as { statusBayar?: string })?.statusBayar;
      toast.success(status === "LUNAS" ? "Transaksi lunas" : "Pembayaran tercatat");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sisaSetelah = (target?.sisaPiutang ?? 0) - (jumlah ?? 0);

  return (
    <Modal
      open={!!target}
      onOpenChange={(v) => !v && onClose()}
      judul="Catat Pembayaran"
      deskripsi={
        target
          ? `${target.noNota} — ${target.pembeli} · sisa ${formatRupiah(target.sisaPiutang)}`
          : undefined
      }
    >
      <div className="space-y-4">
        <Field label="Jumlah dibayar" required error={err.jumlah}>
          <InputRupiah value={jumlah} onChange={setJumlah} />
        </Field>

        {target && jumlah !== null && jumlah > 0 && jumlah <= target.sisaPiutang && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {sisaSetelah === 0
              ? "Setelah ini transaksi menjadi LUNAS."
              : `Sisa piutang setelah pembayaran: ${formatRupiah(sisaSetelah)}`}
          </p>
        )}

        <Field label="Tanggal bayar" required>
          <Input
            type="date"
            value={tanggal}
            max={tanggalWIB()}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </Field>

        <Field label="Catatan">
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Transfer BCA, tunai, dll (opsional)"
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              const e: Record<string, string> = {};
              if (!jumlah || jumlah <= 0) e.jumlah = "Jumlah wajib diisi";
              else if (target && jumlah > target.sisaPiutang)
                e.jumlah = `Melebihi sisa piutang (${formatRupiah(target.sisaPiutang)})`;
              setErr(e);
              if (Object.keys(e).length === 0) simpan.mutate();
            }}
          >
            Simpan pembayaran
          </Button>
        </div>
      </div>
    </Modal>
  );
}
