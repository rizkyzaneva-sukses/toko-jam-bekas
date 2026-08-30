"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { KategoriBiaya } from "@/generated/prisma/client";
import { bulanIniWIB, formatRupiah, formatTanggal, tanggalWIB } from "@/lib/utils";
import { PilihBulan } from "@/components/pilih-bulan";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InputRupiah,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui/ui";

interface BarisBiaya {
  id: string;
  tanggal: string;
  kategori: KategoriBiaya;
  label: string;
  deskripsi: string;
  jumlah: number;
  catatan: string | null;
}

interface DataBiaya {
  total: number;
  perKategori: { kategori: KategoriBiaya; label: string; jumlah: number }[];
  baris: BarisBiaya[];
}

const OPSI_KATEGORI = [
  { value: "SEWA", label: "Sewa Tempat" },
  { value: "GAJI", label: "Gaji & Upah" },
  { value: "LISTRIK", label: "Listrik" },
  { value: "AIR", label: "Air" },
  { value: "INTERNET", label: "Internet & Telepon" },
  { value: "TRANSPORT", label: "Transport & Bensin" },
  { value: "PERLENGKAPAN", label: "Perlengkapan Toko" },
  { value: "PEMASARAN", label: "Pemasaran & Iklan" },
  { value: "PAJAK_RETRIBUSI", label: "Pajak & Retribusi" },
  { value: "LAINNYA", label: "Lainnya" },
];

export default function HalamanBiaya() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());
  const [formTerbuka, setFormTerbuka] = React.useState(false);
  const [hapusId, setHapusId] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["biaya", bulan],
    queryFn: () => api.get<DataBiaya>(`/api/biaya?bulan=${bulan}`),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.del(`/api/biaya/${id}`),
    onSuccess: () => {
      toast.success("Biaya dihapus");
      setHapusId(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setHapusId(null);
    },
  });

  const terbesar = data?.perKategori[0];

  return (
    <>
      <PageHeader
        judul="Biaya Operasional"
        deskripsi="Sewa, gaji, listrik, dan biaya menjalankan toko lainnya. Langsung mengurangi laba bulan berjalan."
        aksi={
          <div className="flex flex-wrap gap-2">
            <PilihBulan value={bulan} onChange={setBulan} />
            <Button onClick={() => setFormTerbuka(true)}>
              <Plus className="h-4 w-4" /> Catat biaya
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Bulan Ini"
          nilai={data?.total ?? 0}
          nada={(data?.total ?? 0) > 0 ? "buruk" : "netral"}
        />
        <StatCard label="Jumlah Transaksi" nilai={data?.baris.length ?? 0} rupiah={false} />
        <StatCard
          label={terbesar ? `Terbesar — ${terbesar.label}` : "Terbesar"}
          nilai={terbesar?.jumlah ?? 0}
        />
      </div>

      {data && data.perKategori.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Rekap per Kategori
          </h2>
          <ul className="space-y-2">
            {data.perKategori.map((k) => {
              const persen = data.total > 0 ? (k.jumlah / data.total) * 100 : 0;
              return (
                <li key={k.kategori}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="text-gray-900 dark:text-gray-100">{k.label}</span>
                    <span className="tabular-nums text-gray-900 dark:text-gray-100">
                      {formatRupiah(k.jumlah)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                    <div
                      className="h-full bg-amber-500 dark:bg-amber-400"
                      style={{ width: `${Math.round(persen)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={6} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : !data?.baris.length ? (
          <EmptyState
            judul="Belum ada biaya bulan ini"
            deskripsi="Catat sewa, gaji, listrik, dan pengeluaran toko lainnya supaya laba bersih usaha terlihat jujur."
            aksi={<Button onClick={() => setFormTerbuka(true)}>Catat biaya pertama</Button>}
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Kategori</Th>
                  <Th>Deskripsi</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {data.baris.map((b) => (
                  <tr key={b.id}>
                    <Td>{formatTanggal(b.tanggal)}</Td>
                    <Td>
                      <Badge warna="kuning">{b.label}</Badge>
                    </Td>
                    <Td className="whitespace-normal">
                      {b.deskripsi}
                      {b.catatan && (
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {b.catatan}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatRupiah(b.jumlah)}
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => setHapusId(b.id)}
                        aria-label={`Hapus ${b.deskripsi}`}
                        className="rounded p-2 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <FormBiaya open={formTerbuka} onClose={() => setFormTerbuka(false)} />

      <ConfirmDialog
        open={!!hapusId}
        onOpenChange={(v) => !v && setHapusId(null)}
        judul="Hapus biaya ini?"
        loading={hapus.isPending}
        onKonfirmasi={() => hapusId && hapus.mutate(hapusId)}
        pesan="Biaya dan baris kasnya akan dihapus, lalu laba bulan ini dihitung ulang."
      />
    </>
  );
}

function FormBiaya({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [kategori, setKategori] = React.useState<string | null>("SEWA");
  const [deskripsi, setDeskripsi] = React.useState("");
  const [jumlah, setJumlah] = React.useState<number | null>(null);
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [catatan, setCatatan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setKategori("SEWA");
    setDeskripsi("");
    setJumlah(null);
    setTanggal(tanggalWIB());
    setCatatan("");
    setErr({});
  }, [open]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post("/api/biaya", {
        kategori,
        deskripsi: deskripsi.trim(),
        jumlah,
        tanggal,
        catatan: catatan.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Biaya tercatat");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Catat Biaya Operasional"
      deskripsi="Uangnya otomatis dikeluarkan dari kas."
    >
      <div className="space-y-4">
        <Field label="Kategori" required>
          <SearchableSelect
            options={OPSI_KATEGORI}
            value={kategori}
            onChange={setKategori}
            placeholder="Pilih kategori"
          />
        </Field>

        <Field label="Deskripsi" required error={err.deskripsi}>
          <Input
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Contoh: Sewa toko bulan Agustus"
          />
        </Field>

        <Field label="Jumlah" required error={err.jumlah}>
          <InputRupiah value={jumlah} onChange={setJumlah} />
        </Field>

        <Field label="Tanggal" required>
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
            placeholder="Opsional"
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
              if (!deskripsi.trim()) e.deskripsi = "Deskripsi wajib diisi";
              if (!jumlah || jumlah <= 0) e.jumlah = "Jumlah wajib diisi";
              setErr(e);
              if (Object.keys(e).length === 0) simpan.mutate();
            }}
          >
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
