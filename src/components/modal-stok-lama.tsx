"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { tanggalWIB } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button, Field, Input, InputRupiah, Textarea } from "@/components/ui/ui";

const OPSI_STATUS = [
  { value: "READY", label: "Ready — Langsung Siap Jual di Inventory" },
  { value: "MASUK_QC", label: "Antrian QC — Perlu Diperiksa Dahulu" },
];

const OPSI_GRADE = [
  { value: "A", label: "Grade A — Mulus / Lengkap" },
  { value: "B", label: "Grade B — Bekas Wajar (Standar)" },
  { value: "C", label: "Grade C — Ada Minus / Butuh Service" },
];

export function ModalInputStokLama({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const [brand, setBrand] = React.useState("");
  const [brandBaru, setBrandBaru] = React.useState("");
  const [model, setModel] = React.useState("");
  const [hargaBeli, setHargaBeli] = React.useState<number | null>(null);
  const [tglBeli, setTglBeli] = React.useState(tanggalWIB());
  const [status, setStatus] = React.useState<"READY" | "MASUK_QC">("READY");
  const [grade, setGrade] = React.useState("B");
  const [hargaJual, setHargaJual] = React.useState<number | null>(null);
  const [catatanKondisi, setCatatanKondisi] = React.useState("");
  const [catatan, setCatatan] = React.useState("");

  // Kelengkapan
  const [adaBox, setAdaBox] = React.useState(false);
  const [adaSurat, setAdaSurat] = React.useState(false);
  const [adaBuku, setAdaBuku] = React.useState(false);
  const [adaExtraLink, setAdaExtraLink] = React.useState(false);
  const [adaSertifikat, setAdaSertifikat] = React.useState(false);

  const [err, setErr] = React.useState<Record<string, string>>({});

  const { data: dataUnits } = useQuery({
    queryKey: ["units", "brands-stok-lama"],
    queryFn: () => api.get<{ brands: string[] }>("/api/units?status=SEMUA"),
  });

  const brandFinal = brand === "__BARU__" ? brandBaru.trim() : brand;

  const resetForm = () => {
    setBrand("");
    setBrandBaru("");
    setModel("");
    setHargaBeli(null);
    setTglBeli(tanggalWIB());
    setStatus("READY");
    setGrade("B");
    setHargaJual(null);
    setCatatanKondisi("");
    setCatatan("");
    setAdaBox(false);
    setAdaSurat(false);
    setAdaBuku(false);
    setAdaExtraLink(false);
    setAdaSertifikat(false);
    setErr({});
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post<{ ok: boolean; id: string; kodeUnit: string }>("/api/units/stok-lama", {
        brand: brandFinal,
        model: model.trim(),
        hargaBeli,
        tglBeli,
        status,
        grade: status === "READY" ? grade : null,
        hargaJual: status === "READY" && hargaJual && hargaJual > 0 ? hargaJual : null,
        adaBox,
        adaSurat,
        adaBuku,
        adaExtraLink,
        adaSertifikat,
        catatanKondisi: catatanKondisi.trim() || null,
        catatan: catatan.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(`Unit ${res.kodeUnit} berhasil dimasukkan ke stok lama`);
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["qc"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
      onClose();
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errorList: Record<string, string> = {};
    if (!brandFinal) errorList.brand = "Brand wajib diisi";
    if (!model.trim()) errorList.model = "Model jam wajib diisi";
    if (!hargaBeli || hargaBeli <= 0) errorList.hargaBeli = "Harga beli (modal) harus lebih dari Rp 0";
    if (!tglBeli) errorList.tglBeli = "Tanggal beli wajib diisi";

    setErr(errorList);
    if (Object.keys(errorList).length > 0) return;
    simpan.mutate();
  }

  const opsiBrand = [
    ...(dataUnits?.brands ?? []).map((b) => ({ value: b, label: b })),
    { value: "__BARU__", label: "+ Tambah Brand Baru..." },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Input Stok Lama (Saldo Awal)"
      deskripsi="Tambahkan jam koleksi/inventaris lama ke sistem tanpa mengurangi saldo kas operasional."
    >
      <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
        {/* Identitas Produk */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Identitas Jam
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Brand / Merek" required error={err.brand}>
              <SearchableSelect
                options={opsiBrand}
                value={brand || null}
                onChange={(v) => setBrand(v ?? "")}
                placeholder="Pilih atau ketik brand"
                searchPlaceholder="Cari brand..."
                emptyText="Brand belum ada — pilih '+ Tambah Brand Baru'"
              />
            </Field>

            {brand === "__BARU__" && (
              <Field label="Nama Brand Baru" required>
                <Input
                  value={brandBaru}
                  onChange={(e) => setBrandBaru(e.target.value)}
                  placeholder="Mis. Seiko, Rolex, Casio"
                  autoFocus
                />
              </Field>
            )}

            <Field label="Model / Tipe Jam" required error={err.model}>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Mis. SKX007, Speedmaster, Submariner"
              />
            </Field>

            <Field label="Tanggal Beli / Masuk" required error={err.tglBeli}>
              <Input
                type="date"
                value={tglBeli}
                max={tanggalWIB()}
                onChange={(e) => setTglBeli(e.target.value)}
              />
            </Field>

            <Field
              label="Harga Beli (Modal Awal)"
              required
              error={err.hargaBeli}
              hint="HPP awal unit. Tidak memotong saldo kas."
            >
              <InputRupiah value={hargaBeli} onChange={setHargaBeli} placeholder="0" />
            </Field>
          </div>
        </div>

        {/* Status & Kondisi */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Status & Penjualan
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Status Unit" required>
              <SearchableSelect
                options={OPSI_STATUS}
                value={status}
                onChange={(v) => v && setStatus(v as "READY" | "MASUK_QC")}
                placeholder="Pilih status unit"
              />
            </Field>

            {status === "READY" && (
              <>
                <Field label="Grade Unit" required>
                  <SearchableSelect
                    options={OPSI_GRADE}
                    value={grade}
                    onChange={(v) => v && setGrade(v)}
                    placeholder="Pilih grade fisik"
                  />
                </Field>

                <Field label="Target Harga Jual (Opsional)">
                  <InputRupiah
                    value={hargaJual}
                    onChange={setHargaJual}
                    placeholder="Harga jual di toko"
                  />
                </Field>
              </>
            )}
          </div>

          <div className="mt-3 space-y-3">
            <Field label="Catatan Kondisi Fisik (Opsional)">
              <Textarea
                rows={2}
                value={catatanKondisi}
                onChange={(e) => setCatatanKondisi(e.target.value)}
                placeholder="Mis. Goresan halus di bezel, kaca mulus, strap bawaan ada aus"
              />
            </Field>

            <Field label="Catatan Tambahan / Asal Jam (Opsional)">
              <Textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Mis. Koleksi lama etalase, titipan konsinyasi"
              />
            </Field>
          </div>
        </div>

        {/* Kelengkapan */}
        <div className="rounded-lg border border-gray-200 p-3.5 dark:border-zinc-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kelengkapan Fisik
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

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending} type="button">
            Batal
          </Button>
          <Button loading={simpan.isPending} type="submit">
            Simpan ke Stok Lama
          </Button>
        </div>
      </form>
    </Modal>
  );
}
