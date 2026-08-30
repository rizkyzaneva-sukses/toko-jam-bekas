"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { RingkasanKas } from "@/lib/kas";
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
  InputRupiah,
  Input,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui/ui";

const OPSI_JENIS = [
  {
    value: "MODAL_MASUK",
    label: "Setor Modal",
    hint: "Uang pribadi dimasukkan ke bisnis",
  },
  {
    value: "PRIVE",
    label: "Prive (tarik pribadi)",
    hint: "Uang bisnis diambil untuk keperluan pribadi",
  },
  {
    value: "LAINNYA_MASUK",
    label: "Pemasukan Lain",
    hint: "Di luar penjualan, mis. jasa service pelanggan luar",
  },
  { value: "LAINNYA_KELUAR", label: "Pengeluaran Lain", hint: "Di luar kategori yang ada" },
  {
    value: "PENYESUAIAN_MASUK",
    label: "Penyesuaian — Kas lebih",
    hint: "Hitung fisik lebih besar dari catatan",
  },
  {
    value: "PENYESUAIAN_KELUAR",
    label: "Penyesuaian — Kas kurang",
    hint: "Hitung fisik lebih kecil dari catatan",
  },
];

export default function HalamanKas() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());
  const [formTerbuka, setFormTerbuka] = React.useState(false);
  const [hapusId, setHapusId] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kas", bulan],
    queryFn: () => api.get<RingkasanKas>(`/api/kas?bulan=${bulan}`),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.del(`/api/kas/${id}`),
    onSuccess: () => {
      toast.success("Baris kas dihapus");
      setHapusId(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setHapusId(null);
    },
  });

  return (
    <>
      <PageHeader
        judul="Kas"
        deskripsi="Semua uang masuk dan keluar. Transaksi penjualan, pembelian, dan service tercatat sendiri di sini."
        aksi={
          <div className="flex flex-wrap gap-2">
            <PilihBulan value={bulan} onChange={setBulan} />
            <a href={`/api/export?jenis=kas&bulan=${bulan}`}>
              <Button varian="secondary">
                <Download className="h-4 w-4" /> Export
              </Button>
            </a>
            <Button onClick={() => setFormTerbuka(true)}>
              <Plus className="h-4 w-4" /> Catat kas
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Saldo Awal Bulan" nilai={data?.saldoAwal ?? 0} />
        <StatCard label="Uang Masuk" nilai={data?.totalMasuk ?? 0} nada="baik" />
        <StatCard
          label="Uang Keluar"
          nilai={data?.totalKeluar ?? 0}
          nada={(data?.totalKeluar ?? 0) > 0 ? "buruk" : "netral"}
        />
        <StatCard
          label="Saldo Akhir"
          nilai={data?.saldoAkhir ?? 0}
          nada={(data?.saldoAkhir ?? 0) < 0 ? "buruk" : "netral"}
        />
      </div>

      {data && data.perJenis.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Rekap per Jenis — {data.periode.bulan}
          </h2>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {data.perJenis.map((j) => (
              <li key={j.jenis} className="flex justify-between gap-3">
                <span className="text-gray-700 dark:text-gray-300">{j.label}</span>
                <span
                  className={
                    j.arah === "MASUK"
                      ? "tabular-nums text-green-700 dark:text-green-400"
                      : "tabular-nums text-red-700 dark:text-red-400"
                  }
                >
                  {j.arah === "MASUK" ? "+" : "−"}
                  {formatRupiah(j.jumlah)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={8} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : !data?.baris.length ? (
          <EmptyState
            judul="Belum ada mutasi kas bulan ini"
            deskripsi="Mulai dengan mencatat setoran modal, atau lakukan transaksi jual-beli yang akan tercatat otomatis."
            aksi={<Button onClick={() => setFormTerbuka(true)}>Catat setoran modal</Button>}
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Jenis</Th>
                  <Th>Keterangan</Th>
                  <Th className="text-right">Masuk</Th>
                  <Th className="text-right">Keluar</Th>
                  <Th className="text-right">Saldo</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {data.baris.map((b) => (
                  <tr key={b.id}>
                    <Td>{formatTanggal(b.tanggal)}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <Badge warna={b.arah === "MASUK" ? "hijau" : "merah"}>{b.label}</Badge>
                        {b.otomatis && (
                          <span
                            title="Dibuat otomatis dari transaksi lain"
                            className="text-gray-500 dark:text-gray-400"
                          >
                            <Lock className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    </Td>
                    <Td className="max-w-[260px] truncate text-gray-600 dark:text-gray-400">
                      {b.keterangan ?? "-"}
                    </Td>
                    <Td className="text-right tabular-nums text-green-700 dark:text-green-400">
                      {b.arah === "MASUK" ? formatRupiah(b.jumlah) : "-"}
                    </Td>
                    <Td className="text-right tabular-nums text-red-700 dark:text-red-400">
                      {b.arah === "KELUAR" ? formatRupiah(b.jumlah) : "-"}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatRupiah(b.saldoBerjalan)}
                    </Td>
                    <Td className="text-right">
                      {!b.otomatis && (
                        <button
                          onClick={() => setHapusId(b.id)}
                          aria-label="Hapus baris kas"
                          className="rounded p-2 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Baris bergambar gembok dibuat otomatis oleh sistem dan tidak bisa dihapus dari sini —
        batalkan transaksi asalnya kalau memang salah.
      </p>

      <FormKas open={formTerbuka} onClose={() => setFormTerbuka(false)} />

      <ConfirmDialog
        open={!!hapusId}
        onOpenChange={(v) => !v && setHapusId(null)}
        judul="Hapus baris kas?"
        loading={hapus.isPending}
        onKonfirmasi={() => hapusId && hapus.mutate(hapusId)}
        pesan="Baris ini akan dihapus permanen dan saldo kas dihitung ulang."
      />
    </>
  );
}

function FormKas({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [jenis, setJenis] = React.useState<string | null>("MODAL_MASUK");
  const [jumlah, setJumlah] = React.useState<number | null>(null);
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [keterangan, setKeterangan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setJenis("MODAL_MASUK");
    setJumlah(null);
    setTanggal(tanggalWIB());
    setKeterangan("");
    setErr({});
  }, [open]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post("/api/kas", {
        jenis,
        jumlah,
        tanggal,
        keterangan: keterangan.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Mutasi kas tercatat");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Catat Mutasi Kas"
      deskripsi="Hanya untuk uang yang tidak berasal dari transaksi jual-beli."
    >
      <div className="space-y-4">
        <Field label="Jenis" required>
          <SearchableSelect
            options={OPSI_JENIS}
            value={jenis}
            onChange={setJenis}
            placeholder="Pilih jenis mutasi"
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

        <Field label="Keterangan">
          <Textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: setoran modal awal, tarik untuk kebutuhan rumah"
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
