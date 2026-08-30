"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { UnitRingkas } from "@/lib/tipe";
import { formatRupiah, formatTanggal, tanggalWIB } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  InputRupiah,
  PageHeader,
  SkeletonTabel,
  Tabel,
  TabelWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui/ui";

export default function HalamanBeli() {
  const qc = useQueryClient();

  const [brand, setBrand] = React.useState("");
  const [brandBaru, setBrandBaru] = React.useState("");
  const [model, setModel] = React.useState("");
  const [hargaBeli, setHargaBeli] = React.useState<number | null>(null);
  const [tglBeli, setTglBeli] = React.useState(tanggalWIB());
  const [catatan, setCatatan] = React.useState("");
  const [error, setError] = React.useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["units", "terbaru"],
    queryFn: () => api.get<{ data: UnitRingkas[]; brands: string[] }>("/api/units?status=MASUK_QC"),
  });

  const brandFinal = brand === "__BARU__" ? brandBaru.trim() : brand;

  const simpan = useMutation({
    mutationFn: () =>
      api.post<{ kodeUnit: string }>("/api/units", {
        brand: brandFinal,
        model: model.trim(),
        hargaBeli,
        tglBeli,
        catatan: catatan.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(`Unit ${res.kodeUnit} masuk antrian QC`);
      setModel("");
      setHargaBeli(null);
      setCatatan("");
      setError({});
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["qc"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!brandFinal) err.brand = "Brand wajib diisi";
    if (!model.trim()) err.model = "Model wajib diisi";
    if (!hargaBeli || hargaBeli <= 0) err.hargaBeli = "Harga beli wajib diisi";
    if (!tglBeli) err.tglBeli = "Tanggal beli wajib diisi";
    setError(err);
    if (Object.keys(err).length > 0) return;
    simpan.mutate();
  }

  const opsiBrand = [
    ...(data?.brands ?? []).map((b) => ({ value: b, label: b })),
    { value: "__BARU__", label: "+ Brand baru..." },
  ];

  return (
    <>
      <PageHeader
        judul="Beli Produk"
        deskripsi="Setiap jam yang dibeli langsung masuk antrian QC."
        aksi={
          <Link href="/qc">
            <Button varian="secondary">
              Ke antrian QC <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Brand" required error={error.brand}>
              <SearchableSelect
                options={opsiBrand}
                value={brand || null}
                onChange={(v) => setBrand(v ?? "")}
                placeholder="Pilih atau tambah brand"
                searchPlaceholder="Cari brand..."
                emptyText="Brand belum ada — pilih '+ Brand baru'"
              />
            </Field>

            {brand === "__BARU__" && (
              <Field label="Nama brand baru" required>
                <Input
                  value={brandBaru}
                  onChange={(e) => setBrandBaru(e.target.value)}
                  placeholder="Contoh: Seiko"
                />
              </Field>
            )}

            <Field
              label="Model"
              required
              error={error.model}
              hint="Contoh: SNK809, Speedmaster Reduced"
            >
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model jam"
              />
            </Field>

            <Field
              label="Harga Beli"
              required
              error={error.hargaBeli}
              hint="Modal awal. Biaya service nanti otomatis ditambahkan ke HPP."
            >
              <InputRupiah value={hargaBeli} onChange={setHargaBeli} />
            </Field>

            <Field label="Tanggal Beli" required error={error.tglBeli}>
              <Input
                type="date"
                value={tglBeli}
                max={tanggalWIB()}
                onChange={(e) => setTglBeli(e.target.value)}
              />
            </Field>

            <Field label="Catatan">
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Kondisi awal, dari siapa, dll (opsional)"
              />
            </Field>

            <Button type="submit" loading={simpan.isPending} className="w-full">
              Simpan & masukkan ke antrian QC
            </Button>

            {brandFinal && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Kode unit akan dibuat otomatis, contoh:{" "}
                <span className="font-mono">
                  {brandFinal.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "UNIT"}-001
                </span>
              </p>
            )}
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Baru dibeli — menunggu QC
          </h2>

          {isLoading ? (
            <SkeletonTabel />
          ) : !data?.data.length ? (
            <EmptyState
              judul="Belum ada unit menunggu QC"
              deskripsi="Unit yang baru dibeli akan muncul di sini."
            />
          ) : (
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Kode</Th>
                    <Th>Jam</Th>
                    <Th className="text-right">Harga Beli</Th>
                    <Th>Tgl Beli</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {data.data.map((u) => (
                    <tr key={u.id}>
                      <Td>
                        <Link
                          href={`/unit/${u.id}`}
                          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                        >
                          {u.kodeUnit}
                        </Link>
                      </Td>
                      <Td>{u.namaLengkap}</Td>
                      <Td className="text-right tabular-nums">{formatRupiah(u.hargaBeli)}</Td>
                      <Td>{formatTanggal(u.tglBeli)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWrap>
          )}
        </Card>
      </div>
    </>
  );
}
