"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AntrianService, JenisKomponenStr } from "@/lib/tipe";
import { LABEL_KOMPONEN } from "@/lib/tipe";
import { formatRupiah, formatTanggal, selisihHari } from "@/lib/utils";
import type { SparepartRingkas } from "@/app/(app)/sparepart/page";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ModalRusak } from "@/components/modal-rusak";
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
  Skeleton,
} from "@/components/ui/ui";

export default function HalamanService() {
  const [rusakUntuk, setRusakUntuk] = React.useState<{
    id: string;
    kodeUnit: string;
    hpp: number;
  } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["service"],
    queryFn: () => api.get<AntrianService[]>("/api/services"),
  });

  return (
    <>
      <PageHeader
        judul="Service"
        deskripsi="Setiap biaya komponen otomatis menambah HPP unit. Selesai service, unit kembali ke antrian QC."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : error ? (
        <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState
          judul="Bengkel kosong"
          deskripsi="Unit masuk ke sini otomatis ketika QC dinyatakan gagal."
          aksi={
            <Link href="/qc">
              <Button>Ke antrian QC</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.map((s) => (
            <KartuService
              key={s.id}
              service={s}
              onRusak={() => setRusakUntuk({ id: s.unitId, kodeUnit: s.kodeUnit, hpp: s.hpp })}
            />
          ))}
        </div>
      )}

      <ModalRusak unit={rusakUntuk} onClose={() => setRusakUntuk(null)} />
    </>
  );
}

const OPSI_KOMPONEN = (
  ["BATRE", "STRAP", "KACA", "MESIN", "LAINNYA"] as JenisKomponenStr[]
).map((j) => ({ value: j, label: LABEL_KOMPONEN[j] }));

function KartuService({
  service,
  onRusak,
}: {
  service: AntrianService;
  onRusak: () => void;
}) {
  const qc = useQueryClient();
  const [sumber, setSumber] = React.useState<"STOK" | "LANGSUNG">("LANGSUNG");
  const [jenis, setJenis] = React.useState<string | null>("BATRE");
  const [deskripsi, setDeskripsi] = React.useState("");
  const [biaya, setBiaya] = React.useState<number | null>(null);
  const [sparepartId, setSparepartId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState("1");
  const [err, setErr] = React.useState<Record<string, string>>({});
  const [konfirmasiSelesai, setKonfirmasiSelesai] = React.useState(false);

  const { data: stok } = useQuery({
    queryKey: ["sparepart", "tersedia"],
    queryFn: () => api.get<SparepartRingkas[]>("/api/sparepart?tersedia=1"),
  });

  const spTerpilih = (stok ?? []).find((s) => s.id === sparepartId) ?? null;
  const jumlahQty = Number(qty) || 0;
  const perkiraanBiaya = spTerpilih ? spTerpilih.hargaRata * jumlahQty : 0;

  const tambah = useMutation({
    mutationFn: () =>
      api.post(
        `/api/services/${service.id}/items`,
        sumber === "STOK"
          ? {
              jenis: spTerpilih?.jenis ?? jenis,
              deskripsi: spTerpilih?.nama ?? null,
              sparepartId,
              qty: jumlahQty,
            }
          : {
              jenis,
              deskripsi: deskripsi.trim() || null,
              biaya,
            }
      ),
    onSuccess: () => {
      toast.success(
        sumber === "STOK" ? "Sparepart diambil dari stok" : "Biaya komponen ditambahkan"
      );
      setDeskripsi("");
      setBiaya(null);
      setSparepartId(null);
      setQty("1");
      setErr({});
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapus = useMutation({
    mutationFn: (itemId: string) => api.del(`/api/service-items/${itemId}`),
    onSuccess: () => {
      toast.success("Komponen dihapus");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selesai = useMutation({
    mutationFn: () => api.post(`/api/services/${service.id}/selesai`),
    onSuccess: () => {
      toast.success(`${service.kodeUnit} kembali ke antrian QC`);
      setKonfirmasiSelesai(false);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setKonfirmasiSelesai(false);
    },
  });

  const lamaHari = selisihHari(service.tglMasuk);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/unit/${service.unitId}`}
              className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              {service.kodeUnit}
            </Link>
            <Badge warna="kuning">Di bengkel {lamaHari} hari</Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
            {service.namaLengkap}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            Masuk {formatTanggal(service.tglMasuk)}
            {service.catatan ? ` · ${service.catatan}` : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-gray-400">HPP sekarang</p>
          <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {formatRupiah(service.hpp)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            beli {formatRupiah(service.hargaBeli)} + service {formatRupiah(service.totalBiaya)}
          </p>
        </div>
      </div>

      {/* Daftar komponen */}
      {service.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-600 dark:border-zinc-700 dark:text-gray-400">
          Belum ada biaya komponen dicatat.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-zinc-700 dark:border-zinc-700">
          {service.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{LABEL_KOMPONEN[i.jenis]}</span>
                {i.deskripsi && (
                  <span className="text-gray-600 dark:text-gray-400"> — {i.deskripsi}</span>
                )}
                {i.dariStok && (
                  <Badge warna="ungu" className="ml-2">
                    dari stok {i.qty} {i.satuan ?? "pcs"}
                  </Badge>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-gray-900 dark:text-gray-100">
                  {formatRupiah(i.biaya)}
                </span>
                <button
                  onClick={() => hapus.mutate(i.id)}
                  disabled={hapus.isPending}
                  aria-label={`Hapus ${LABEL_KOMPONEN[i.jenis]}`}
                  className="rounded p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Form tambah komponen */}
      <div className="mt-4 space-y-3">
        <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setSumber("LANGSUNG")}
            aria-pressed={sumber === "LANGSUNG"}
            className={
              sumber === "LANGSUNG"
                ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white dark:bg-blue-500"
                : "inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700"
            }
          >
            <ShoppingBag className="h-4 w-4" /> Beli langsung
          </button>
          <button
            type="button"
            onClick={() => setSumber("STOK")}
            aria-pressed={sumber === "STOK"}
            className={
              sumber === "STOK"
                ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white dark:bg-blue-500"
                : "inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700"
            }
          >
            <Boxes className="h-4 w-4" /> Ambil dari stok
          </button>
        </div>

        {sumber === "LANGSUNG" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-end">
            <Field label="Komponen">
              <SearchableSelect
                options={OPSI_KOMPONEN}
                value={jenis}
                onChange={setJenis}
                placeholder="Pilih komponen"
              />
            </Field>

            <Field
              label="Deskripsi"
              error={err.deskripsi}
              hint={jenis === "LAINNYA" ? "Wajib untuk jenis Lainnya" : undefined}
            >
              <Input
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Contoh: batre Maxell SR626"
              />
            </Field>

            <Field label="Biaya" error={err.biaya} hint="Uang keluar dari kas">
              <InputRupiah value={biaya} onChange={setBiaya} />
            </Field>

            <Button
              loading={tambah.isPending}
              onClick={() => {
                const e: Record<string, string> = {};
                if (!biaya || biaya <= 0) e.biaya = "Biaya wajib diisi";
                if (jenis === "LAINNYA" && !deskripsi.trim())
                  e.deskripsi = "Deskripsi wajib untuk jenis Lainnya";
                setErr(e);
                if (Object.keys(e).length === 0) tambah.mutate();
              }}
            >
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.7fr)_auto] sm:items-end">
            <Field label="Sparepart" error={err.sparepartId}>
              <SearchableSelect
                options={(stok ?? []).map((sp) => ({
                  value: sp.id,
                  label: `${sp.nama} (${sp.kode})`,
                  hint: `sisa ${sp.stok} ${sp.satuan} - ${formatRupiah(sp.hargaRata)}/${sp.satuan}`,
                }))}
                value={sparepartId}
                onChange={setSparepartId}
                placeholder="Pilih dari stok"
                emptyText="Stok kosong - isi dulu di halaman Stok Sparepart"
              />
            </Field>

            <Field label="Jumlah" error={err.qty}>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </Field>

            <Button
              loading={tambah.isPending}
              onClick={() => {
                const e: Record<string, string> = {};
                if (!sparepartId) e.sparepartId = "Pilih sparepart dulu";
                if (jumlahQty <= 0) e.qty = "Jumlah minimal 1";
                if (spTerpilih && jumlahQty > spTerpilih.stok)
                  e.qty = `Stok tinggal ${spTerpilih.stok}`;
                setErr(e);
                if (Object.keys(e).length === 0) tambah.mutate();
              }}
            >
              <Plus className="h-4 w-4" /> Ambil
            </Button>
          </div>
        )}

        {sumber === "STOK" && spTerpilih && jumlahQty > 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Menambah HPP <strong>{formatRupiah(perkiraanBiaya)}</strong> ({jumlahQty}{" "}
            {spTerpilih.satuan} x {formatRupiah(spTerpilih.hargaRata)}). Kas tidak berkurang —
            uangnya sudah keluar saat sparepart dibeli.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 dark:border-zinc-700 sm:flex-row sm:justify-end">
        <Button varian="danger" onClick={onRusak}>
          Pindahkan ke RUSAK
        </Button>
        <Button varian="success" onClick={() => setKonfirmasiSelesai(true)}>
          Service selesai — kembali ke QC
        </Button>
      </div>

      <ConfirmDialog
        open={konfirmasiSelesai}
        onOpenChange={setKonfirmasiSelesai}
        judul="Selesaikan service?"
        varian="primary"
        labelKonfirmasi="Ya, selesai"
        loading={selesai.isPending}
        onKonfirmasi={() => selesai.mutate()}
        pesan={
          <>
            <p>
              {service.kodeUnit} akan kembali ke antrian QC dengan HPP{" "}
              <strong>{formatRupiah(service.hpp)}</strong>.
            </p>
            <p className="mt-2">
              Setelah ini biaya komponen pada tiket ini tidak bisa diubah lagi. Kalau ternyata
              masih ada masalah, QC berikutnya bisa mengirimnya kembali ke bengkel.
            </p>
          </>
        }
      />
    </Card>
  );
}
