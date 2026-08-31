"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { tanggalWIB } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button, Field, Input, InputRupiah, Textarea } from "@/components/ui/ui";

export interface DataEditUnitProp {
  id: string;
  kodeUnit: string;
  brand: string;
  model: string;
  status: string;
  grade?: string | null;
  hargaBeli: number;
  hargaJual?: number | null;
  tglBeli?: string;
  catatan?: string | null;
  catatanKondisi?: string | null;
  adaBox?: boolean;
  adaSurat?: boolean;
  adaBuku?: boolean;
  adaExtraLink?: boolean;
  adaSertifikat?: boolean;
}

const OPSI_GRADE = [
  { value: "TANPA_GRADE", label: "Tanpa grade / Belum QC" },
  { value: "A", label: "Grade A --- Sangat mulus / Lengkap" },
  { value: "B", label: "Grade B --- Bekas wajar" },
  { value: "C", label: "Grade C --- Butuh perbaikan / Ada minus" },
];

export function ModalEditUnit({
  unit,
  open,
  onClose,
}: {
  unit: DataEditUnitProp | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const [brand, setBrand] = React.useState("");
  const [model, setModel] = React.useState("");
  const [tglBeli, setTglBeli] = React.useState(tanggalWIB());
  const [hargaBeli, setHargaBeli] = React.useState(0);
  const [hargaJual, setHargaJual] = React.useState<number | null>(null);
  const [grade, setGrade] = React.useState("TANPA_GRADE");
  const [catatanKondisi, setCatatanKondisi] = React.useState("");
  const [catatan, setCatatan] = React.useState("");

  // Kelengkapan
  const [adaBox, setAdaBox] = React.useState(false);
  const [adaSurat, setAdaSurat] = React.useState(false);
  const [adaBuku, setAdaBuku] = React.useState(false);
  const [adaExtraLink, setAdaExtraLink] = React.useState(false);
  const [adaSertifikat, setAdaSertifikat] = React.useState(false);

  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!unit) return;
    setBrand(unit.brand || "");
    setModel(unit.model || "");
    setTglBeli(unit.tglBeli ? unit.tglBeli.slice(0, 10) : tanggalWIB());
    setHargaBeli(unit.hargaBeli || 0);
    setHargaJual(unit.hargaJual !== undefined ? unit.hargaJual : null);
    setGrade(unit.grade ?? "TANPA_GRADE");
    setCatatanKondisi(unit.catatanKondisi ?? "");
    setCatatan(unit.catatan ?? "");
    setAdaBox(unit.adaBox ?? false);
    setAdaSurat(unit.adaSurat ?? false);
    setAdaBuku(unit.adaBuku ?? false);
    setAdaExtraLink(unit.adaExtraLink ?? false);
    setAdaSertifikat(unit.adaSertifikat ?? false);
    setErr({});
  }, [unit, open]);

  const simpan = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        brand: brand.trim(),
        model: model.trim(),
        tglBeli,
        catatan: catatan.trim() || null,
        catatanKondisi: catatanKondisi.trim() || null,
        grade: grade === "TANPA_GRADE" ? null : grade,
        hargaJual: hargaJual !== null && hargaJual > 0 ? hargaJual : null,
        adaBox,
        adaSurat,
        adaBuku,
        adaExtraLink,
        adaSertifikat,
      };

      if (unit?.status !== "TERJUAL") {
        payload.hargaBeli = hargaBeli;
      }

      return api.patch(`/api/units/${unit!.id}`, payload);
    },
    onSuccess: () => {
      toast.success(`Data unit ${unit?.kodeUnit} berhasil diperbarui`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isTerjual = unit?.status === "TERJUAL";
  return (
    <Modal
      open={open && !!unit}
      onOpenChange={(v) => !v && onClose()}
      judul={unit ? `Edit Data Unit ${unit.kodeUnit}` : "Edit Unit"}
      deskripsi="Perbaiki kesalahan input identitas, harga beli/jual, kondisi, atau kelengkapan jam."
    >
      <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
        {/* Identitas Produk */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Identitas Jam
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Brand / Merek" required error={err.brand}>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Mis. Seiko, Rolex, Casio"
              />
            </Field>

            <Field label="Model / Seri" required error={err.model}>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Mis. SKX007, Datejust 36"
              />
            </Field>

            <Field label="Tanggal Pembelian" required>
              <Input
                type="date"
                value={tglBeli}
                max={tanggalWIB()}
                onChange={(e) => setTglBeli(e.target.value)}
              />
            </Field>

            <Field
              label="Harga Beli (Modal)"
              required
              error={err.hargaBeli}
              hint={isTerjual ? "Terkunci (unit sudah terjual)" : undefined}
            >
              <InputRupiah
                value={hargaBeli}
                onChange={(v) => setHargaBeli(v ?? 0)}
                disabled={isTerjual}
                placeholder="0"
              />
            </Field>
          </div>
        </div>

        {/* Harga Jual & Grade */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kondisi & Harga Jual
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Grade Unit">
              <SearchableSelect
                options={OPSI_GRADE}
                value={grade}
                onChange={(v) => setGrade(v ?? "TANPA_GRADE")}
                placeholder="Pilih grade"
              />
            </Field>

            <Field label="Harga Jual Target / Estimasi">
              <InputRupiah
                value={hargaJual ?? 0}
                onChange={(v) => setHargaJual(v && v > 0 ? v : null)}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="mt-3 space-y-3">
            <Field label="Catatan Kondisi Fisik">
              <Textarea
                rows={2}
                value={catatanKondisi}
                onChange={(e) => setCatatanKondisi(e.target.value)}
                placeholder="Goresan halus di bezel, dial original mulus, rantai original"
              />
            </Field>

            <Field label="Catatan Pembelian">
              <Textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Beli dari kolektor Bandung, nomor nota supplier"
              />
            </Field>
          </div>
        </div>

        {/* Kelengkapan */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kelengkapan Jam
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={adaBox}
                onChange={(e) => setAdaBox(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Ada Box
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={adaSurat}
                onChange={(e) => setAdaSurat(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Surat / Garansi
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={adaBuku}
                onChange={(e) => setAdaBuku(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Buku Manual
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={adaExtraLink}
                onChange={(e) => setAdaExtraLink(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Extra Link Rantai
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={adaSertifikat}
                onChange={(e) => setAdaSertifikat(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Sertifikat / COA
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              const e: Record<string, string> = {};
              if (!brand.trim()) e.brand = "Brand wajib diisi";
              if (!model.trim()) e.model = "Model wajib diisi";
              if (!isTerjual && hargaBeli <= 0) e.hargaBeli = "Harga beli harus lebih dari Rp 0";
              setErr(e);
              if (Object.keys(e).length === 0) simpan.mutate();
            }}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
