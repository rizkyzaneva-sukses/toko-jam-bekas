"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Modal } from "@/components/ui/dialog";
import { ModalRusak } from "@/components/modal-rusak";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  InputRupiah,
  PageHeader,
  SkeletonTabel,
  Tabel,
  TabelWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui/ui";

interface BarisQc {
  id: string;
  kodeUnit: string;
  brand: string;
  model: string;
  namaDasar: string;
  namaLengkap: string;
  labelService: string[];
  hargaBeli: number;
  totalBiayaService: number;
  hpp: number;
  tglBeli: string;
  catatan: string | null;
  pernahService: boolean;
  qcTerakhir: { hasil: string; keterangan: string | null } | null;
}

export default function HalamanQc() {
  const [lolosUntuk, setLolosUntuk] = React.useState<BarisQc | null>(null);
  const [gagalUntuk, setGagalUntuk] = React.useState<BarisQc | null>(null);
  const [rusakUntuk, setRusakUntuk] = React.useState<BarisQc | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["qc"],
    queryFn: () => api.get<BarisQc[]>("/api/qc"),
  });

  return (
    <>
      <PageHeader
        judul="Quality Control"
        deskripsi="Unit yang lolos masuk inventory. Yang gagal dikirim ke bengkel."
      />

      <Card>
        {isLoading ? (
          <SkeletonTabel />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState
            judul="Antrian QC kosong"
            deskripsi="Semua unit sudah diperiksa. Unit baru akan muncul di sini setelah dibeli atau selesai service."
            aksi={
              <Link href="/beli">
                <Button>Beli produk</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Layar HP: kartu, supaya tombol aksi tidak tersembunyi di ujung tabel */}
            <ul className="space-y-3 sm:hidden">
              {data.map((u) => (
                <li
                  key={u.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/unit/${u.id}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {u.kodeUnit}
                      </Link>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {u.namaLengkap}
                      </p>
                    </div>
                    {u.pernahService && <Badge warna="kuning">Pasca service</Badge>}
                  </div>

                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-600 dark:text-gray-400">Harga beli</dt>
                      <dd className="tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(u.hargaBeli)}
                      </dd>
                    </div>
                    {u.totalBiayaService > 0 && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-600 dark:text-gray-400">Biaya service</dt>
                        <dd className="tabular-nums text-gray-900 dark:text-gray-100">
                          {formatRupiah(u.totalBiayaService)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-600 dark:text-gray-400">HPP</dt>
                      <dd className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        {formatRupiah(u.hpp)}
                      </dd>
                    </div>
                  </dl>

                  {(u.qcTerakhir?.keterangan || u.catatan) && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {u.qcTerakhir?.keterangan ?? u.catatan}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      varian="success"
                      className="px-2"
                      onClick={() => setLolosUntuk(u)}
                    >
                      <Check className="h-4 w-4" /> Lolos
                    </Button>
                    <Button
                      varian="secondary"
                      className="px-2"
                      onClick={() => setGagalUntuk(u)}
                    >
                      <X className="h-4 w-4" /> Gagal
                    </Button>
                    <Button varian="danger" className="px-2" onClick={() => setRusakUntuk(u)}>
                      Rusak
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Layar lebar: tabel */}
            <div className="hidden sm:block">
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Jam</Th>
                  <Th className="text-right">Harga Beli</Th>
                  <Th className="text-right">Biaya Service</Th>
                  <Th className="text-right">HPP</Th>
                  <Th>Tgl Beli</Th>
                  <Th>Catatan</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {data.map((u) => (
                  <tr key={u.id}>
                    <Td>
                      <Link
                        href={`/unit/${u.id}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {u.kodeUnit}
                      </Link>
                    </Td>
                    <Td>
                      {u.namaLengkap}
                      {u.pernahService && (
                        <Badge warna="kuning" className="ml-2">
                          Pasca service
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{formatRupiah(u.hargaBeli)}</Td>
                    <Td className="text-right tabular-nums">
                      {formatRupiah(u.totalBiayaService)}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">{formatRupiah(u.hpp)}</Td>
                    <Td>{formatTanggal(u.tglBeli)}</Td>
                    <Td className="max-w-[220px] truncate text-gray-600 dark:text-gray-400">
                      {u.qcTerakhir?.keterangan ?? u.catatan ?? "-"}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          varian="success"
                          className="min-h-[36px] px-3 py-1"
                          onClick={() => setLolosUntuk(u)}
                        >
                          <Check className="h-4 w-4" /> Lolos
                        </Button>
                        <Button
                          varian="secondary"
                          className="min-h-[36px] px-3 py-1"
                          onClick={() => setGagalUntuk(u)}
                        >
                          <X className="h-4 w-4" /> Gagal
                        </Button>
                        <Button
                          varian="danger"
                          className="min-h-[36px] px-3 py-1"
                          onClick={() => setRusakUntuk(u)}
                        >
                          Rusak
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
            </div>
          </>
        )}
      </Card>

      <ModalLolos unit={lolosUntuk} onClose={() => setLolosUntuk(null)} />
      <ModalGagal unit={gagalUntuk} onClose={() => setGagalUntuk(null)} />
      <ModalRusak unit={rusakUntuk} onClose={() => setRusakUntuk(null)} />
    </>
  );
}

const KELENGKAPAN_AWAL = {
  adaBox: false,
  adaSurat: false,
  adaBuku: false,
  adaExtraLink: false,
  adaSertifikat: false,
};

function ModalLolos({ unit, onClose }: { unit: BarisQc | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [grade, setGrade] = React.useState<string | null>("B");
  const [hargaJual, setHargaJual] = React.useState<number | null>(null);
  const [catatanKondisi, setCatatanKondisi] = React.useState("");
  const [kelengkapan, setKelengkapan] = React.useState(KELENGKAPAN_AWAL);
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!unit) return;
    setGrade("B");
    setHargaJual(null);
    setCatatanKondisi("");
    setKelengkapan(KELENGKAPAN_AWAL);
    setErr({});
  }, [unit]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post("/api/qc", {
        unitId: unit!.id,
        hasil: "LOLOS",
        grade,
        hargaJual,
        catatanKondisi: catatanKondisi.trim() || null,
        ...kelengkapan,
      }),
    onSuccess: () => {
      toast.success(`${unit!.kodeUnit} masuk inventory`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const margin = (hargaJual ?? 0) - (unit?.hpp ?? 0);

  return (
    <Modal
      open={!!unit}
      onOpenChange={(v) => !v && onClose()}
      judul="QC Lolos"
      deskripsi={unit ? `${unit.kodeUnit} — ${unit.namaLengkap}` : undefined}
      lebar="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Grade Kondisi" required error={err.grade}>
            <SearchableSelect
              options={[
                { value: "A", label: "A — Mulus", hint: "Nyaris tanpa cacat" },
                { value: "B", label: "B — Wajar pakai", hint: "Ada bekas pakai normal" },
                { value: "C", label: "C — Banyak minus", hint: "Cacat terlihat jelas" },
              ]}
              value={grade}
              onChange={setGrade}
              placeholder="Pilih grade"
            />
          </Field>

          <Field
            label="Harga Jual"
            required
            error={err.hargaJual}
            hint={unit ? `HPP unit ini ${formatRupiah(unit.hpp)}` : undefined}
          >
            <InputRupiah value={hargaJual} onChange={setHargaJual} />
          </Field>
        </div>

        {hargaJual !== null && unit && (
          <p
            className={
              margin >= 0
                ? "text-sm text-green-700 dark:text-green-400"
                : "text-sm font-medium text-red-700 dark:text-red-400"
            }
          >
            {margin >= 0
              ? `Margin ${formatRupiah(margin)}`
              : `Harga jual di bawah HPP — rugi ${formatRupiah(Math.abs(margin))}`}
          </p>
        )}

        <Field label="Kelengkapan">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["adaBox", "Box"],
                ["adaSurat", "Surat / Garansi"],
                ["adaBuku", "Buku Manual"],
                ["adaExtraLink", "Extra Link"],
                ["adaSertifikat", "Sertifikat"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setKelengkapan((k) => ({ ...k, [key]: !k[key] }))}
                aria-pressed={kelengkapan[key]}
                className={
                  kelengkapan[key]
                    ? "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 text-sm font-medium text-white dark:border-blue-500 dark:bg-blue-500"
                    : "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                }
              >
                {kelengkapan[key] ? <Check className="h-4 w-4" /> : null}
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Catatan Kondisi">
          <Textarea
            value={catatanKondisi}
            onChange={(e) => setCatatanKondisi(e.target.value)}
            placeholder="Goresan di dial jam 3, bezel sedikit pudar, dll"
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            varian="success"
            loading={simpan.isPending}
            onClick={() => {
              const e: Record<string, string> = {};
              if (!grade) e.grade = "Grade wajib dipilih";
              if (!hargaJual || hargaJual <= 0) e.hargaJual = "Harga jual wajib diisi";
              setErr(e);
              if (Object.keys(e).length === 0) simpan.mutate();
            }}
          >
            Masukkan ke inventory
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModalGagal({ unit, onClose }: { unit: BarisQc | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [keterangan, setKeterangan] = React.useState("");
  const [err, setErr] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!unit) return;
    setKeterangan("");
    setErr(undefined);
  }, [unit]);

  const simpan = useMutation({
    mutationFn: () => api.post("/api/qc", { unitId: unit!.id, hasil: "GAGAL", keterangan }),
    onSuccess: () => {
      toast.success(`${unit!.kodeUnit} dikirim ke bengkel`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!unit}
      onOpenChange={(v) => !v && onClose()}
      judul="QC Gagal — kirim ke service"
      deskripsi={unit ? `${unit.kodeUnit} — ${unit.namaLengkap}` : undefined}
    >
      <div className="space-y-4">
        <Field label="Masalah yang ditemukan" required error={err}>
          <Textarea
            autoFocus
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: mesin mati, batre soak, kaca retak"
          />
        </Field>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Unit masuk antrian service. Biaya komponen yang dikeluarkan nanti otomatis menambah HPP
          unit ini.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              if (!keterangan.trim()) {
                setErr("Keterangan masalah wajib diisi");
                return;
              }
              setErr(undefined);
              simpan.mutate();
            }}
          >
            Kirim ke service
          </Button>
        </div>
      </div>
    </Modal>
  );
}
