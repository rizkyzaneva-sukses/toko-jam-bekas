"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { MitraRingkas, UnitRingkas } from "@/lib/tipe";
import { formatRupiah, tanggalWIB } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Button,
  Card,
  Field,
  Input,
  InputRupiah,
  PageHeader,
  Skeleton,
  Textarea,
} from "@/components/ui/ui";

interface BarisItem {
  unitId: string;
  kodeUnit: string;
  nama: string;
  hpp: number;
  hargaJual: number | null;
}

export default function HalamanPenjualanBaru() {
  const router = useRouter();
  const qc = useQueryClient();

  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [tipePembeli, setTipePembeli] = React.useState<string>("B2B");
  const [mitraId, setMitraId] = React.useState<string | null>(null);
  const [namaPembeli, setNamaPembeli] = React.useState("");
  const [channel, setChannel] = React.useState<string>("OFFLINE");
  const [items, setItems] = React.useState<BarisItem[]>([]);
  const [pilihUnit, setPilihUnit] = React.useState<string | null>(null);
  const [ongkir, setOngkir] = React.useState<number | null>(null);
  const [penanggungOngkir, setPenanggungOngkir] = React.useState<string>("PEMBELI");
  const [metodeBayar, setMetodeBayar] = React.useState<string>("CASH");
  const [dibayar, setDibayar] = React.useState<number | null>(null);
  const [jatuhTempo, setJatuhTempo] = React.useState("");
  const [catatan, setCatatan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  const { data: dataUnit, isLoading: loadingUnit } = useQuery({
    queryKey: ["units", "READY"],
    queryFn: () => api.get<{ data: UnitRingkas[] }>("/api/units?status=READY"),
  });

  const { data: mitra } = useQuery({
    queryKey: ["mitra"],
    queryFn: () => api.get<MitraRingkas[]>("/api/mitra"),
  });

  const unitTersedia = (dataUnit?.data ?? []).filter(
    (u) => !items.some((i) => i.unitId === u.id)
  );

  const subtotal = items.reduce((t, i) => t + (i.hargaJual ?? 0), 0);
  const totalHpp = items.reduce((t, i) => t + i.hpp, 0);
  const ongkirNilai = ongkir ?? 0;
  const totalTagihan = penanggungOngkir === "PEMBELI" ? subtotal + ongkirNilai : subtotal;
  const ongkirToko = penanggungOngkir === "TOKO" ? ongkirNilai : 0;
  const labaEstimasi = subtotal - totalHpp - ongkirToko;
  const sisaPiutang =
    metodeBayar === "PIUTANG" ? Math.max(0, totalTagihan - (dibayar ?? 0)) : 0;

  function tambahUnit(unitId: string | null) {
    if (!unitId) return;
    const u = unitTersedia.find((x) => x.id === unitId);
    if (!u) return;
    setItems((s) => [
      ...s,
      {
        unitId: u.id,
        kodeUnit: u.kodeUnit,
        nama: u.namaLengkap,
        hpp: u.hpp,
        hargaJual: u.hargaJual > 0 ? u.hargaJual : null,
      },
    ]);
    setPilihUnit(null);
  }

  const simpan = useMutation({
    mutationFn: () =>
      api.post<{ id: string; noNota: string }>("/api/penjualan", {
        tanggal,
        tipePembeli,
        mitraId: tipePembeli === "B2B" ? mitraId : null,
        namaPembeli: tipePembeli === "B2C" ? namaPembeli.trim() || null : null,
        channel,
        items: items.map((i) => ({ unitId: i.unitId, hargaJual: i.hargaJual ?? 0 })),
        ongkir: ongkirNilai,
        penanggungOngkir,
        metodeBayar,
        dibayar: metodeBayar === "PIUTANG" ? (dibayar ?? 0) : undefined,
        jatuhTempo: metodeBayar === "PIUTANG" ? jatuhTempo : null,
        catatan: catatan.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(`Nota ${res.noNota} tersimpan`);
      qc.invalidateQueries();
      router.push("/penjualan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (items.length === 0) v.items = "Minimal satu unit harus dipilih";
    if (items.some((i) => !i.hargaJual || i.hargaJual <= 0))
      v.items = "Semua harga jual harus diisi";
    if (tipePembeli === "B2B" && !mitraId) v.mitraId = "Mitra wajib dipilih untuk B2B";
    if (metodeBayar === "PIUTANG" && !jatuhTempo) v.jatuhTempo = "Jatuh tempo wajib diisi";
    if (metodeBayar === "PIUTANG" && (dibayar ?? 0) > totalTagihan)
      v.dibayar = "Jumlah dibayar melebihi total tagihan";
    setErr(v);
    if (Object.keys(v).length === 0) simpan.mutate();
  }

  return (
    <>
      <Link
        href="/penjualan"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline dark:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Penjualan
      </Link>

      <PageHeader
        judul="Transaksi Penjualan Baru"
        deskripsi="Satu nota bisa berisi beberapa unit. Laba per unit dikunci saat nota disimpan."
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Pembeli */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Pembeli</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tanggal" required>
                <Input
                  type="date"
                  value={tanggal}
                  max={tanggalWIB()}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </Field>

              <Field label="Tipe Pembeli" required>
                <SearchableSelect
                  options={[
                    { value: "B2B", label: "B2B — Mitra / Reseller" },
                    { value: "B2C", label: "B2C — Konsumen akhir" },
                  ]}
                  value={tipePembeli}
                  onChange={(v) => setTipePembeli(v ?? "B2B")}
                  placeholder="Pilih tipe"
                />
              </Field>

              {tipePembeli === "B2B" ? (
                <Field label="Mitra" required error={err.mitraId}>
                  <SearchableSelect
                    options={(mitra ?? [])
                      .filter((m) => m.aktif)
                      .map((m) => ({
                        value: m.id,
                        label: m.nama,
                        hint: m.kota ?? undefined,
                      }))}
                    value={mitraId}
                    onChange={setMitraId}
                    placeholder="Pilih mitra"
                    emptyText="Mitra belum ada — tambah dulu di menu Mitra"
                  />
                </Field>
              ) : (
                <Field label="Nama Pembeli" hint="Opsional">
                  <Input
                    value={namaPembeli}
                    onChange={(e) => setNamaPembeli(e.target.value)}
                    placeholder="Nama konsumen"
                  />
                </Field>
              )}

              <Field label="Channel" required>
                <SearchableSelect
                  options={[
                    { value: "OFFLINE", label: "Offline / Toko / COD" },
                    { value: "WA_SOSMED", label: "WhatsApp / Sosmed" },
                  ]}
                  value={channel}
                  onChange={(v) => setChannel(v ?? "OFFLINE")}
                  placeholder="Pilih channel"
                />
              </Field>
            </div>
          </Card>

          {/* Unit */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Unit yang Dijual
            </h2>

            {loadingUnit ? (
              <Skeleton className="h-11" />
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <SearchableSelect
                  className="flex-1"
                  label="Pilih unit ready"
                  options={unitTersedia.map((u) => ({
                    value: u.id,
                    label: `${u.kodeUnit} — ${u.namaLengkap}`,
                    hint: `HPP ${formatRupiah(u.hpp)} · list ${formatRupiah(u.hargaJual)}`,
                  }))}
                  value={pilihUnit}
                  onChange={tambahUnit}
                  placeholder="Cari kode unit / brand / model"
                  emptyText="Tidak ada unit ready yang cocok"
                />
                <Button
                  type="button"
                  varian="secondary"
                  onClick={() => tambahUnit(pilihUnit)}
                  disabled={!pilihUnit}
                >
                  <Plus className="h-4 w-4" /> Tambah
                </Button>
              </div>
            )}

            {err.items && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{err.items}</p>
            )}

            {items.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-600 dark:border-zinc-700 dark:text-gray-400">
                Belum ada unit dipilih.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((i, idx) => {
                  const margin = (i.hargaJual ?? 0) - i.hpp;
                  return (
                    <li
                      key={i.unitId}
                      className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-50">
                            {i.kodeUnit}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {i.nama} · HPP {formatRupiah(i.hpp)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Hapus ${i.kodeUnit}`}
                          onClick={() =>
                            setItems((s) => s.filter((x) => x.unitId !== i.unitId))
                          }
                          className="rounded p-1.5 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <Field label="Harga jual final" className="sm:max-w-[220px]">
                          <InputRupiah
                            value={i.hargaJual}
                            onChange={(v) =>
                              setItems((s) =>
                                s.map((x, j) => (j === idx ? { ...x, hargaJual: v } : x))
                              )
                            }
                          />
                        </Field>
                        <p
                          className={
                            margin < 0
                              ? "pb-2.5 text-sm font-medium text-red-700 dark:text-red-400"
                              : "pb-2.5 text-sm text-green-700 dark:text-green-400"
                          }
                        >
                          {i.hargaJual === null
                            ? ""
                            : margin < 0
                              ? `Rugi ${formatRupiah(Math.abs(margin))}`
                              : `Laba ${formatRupiah(margin)}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Ongkir & pembayaran */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Ongkir & Pembayaran
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Ongkir" hint="Kosongkan kalau tidak ada">
                <InputRupiah value={ongkir} onChange={setOngkir} />
              </Field>

              <Field
                label="Ongkir ditanggung"
                required
                hint={
                  penanggungOngkir === "TOKO"
                    ? "Ongkir mengurangi laba transaksi ini"
                    : "Ongkir ditagihkan ke pembeli, tidak mengurangi laba"
                }
              >
                <SearchableSelect
                  options={[
                    { value: "PEMBELI", label: "Pembeli" },
                    { value: "TOKO", label: "Toko" },
                  ]}
                  value={penanggungOngkir}
                  onChange={(v) => setPenanggungOngkir(v ?? "PEMBELI")}
                  placeholder="Pilih penanggung"
                />
              </Field>

              <Field label="Metode Bayar" required>
                <SearchableSelect
                  options={[
                    { value: "CASH", label: "Cash — lunas di tempat" },
                    { value: "PIUTANG", label: "Piutang — tempo / cicilan" },
                  ]}
                  value={metodeBayar}
                  onChange={(v) => setMetodeBayar(v ?? "CASH")}
                  placeholder="Pilih metode"
                />
              </Field>

              {metodeBayar === "PIUTANG" && (
                <>
                  <Field
                    label="Dibayar sekarang (DP)"
                    error={err.dibayar}
                    hint="Boleh kosong kalau belum bayar sama sekali"
                  >
                    <InputRupiah value={dibayar} onChange={setDibayar} />
                  </Field>

                  <Field label="Jatuh Tempo" required error={err.jatuhTempo}>
                    <Input
                      type="date"
                      value={jatuhTempo}
                      min={tanggal}
                      onChange={(e) => setJatuhTempo(e.target.value)}
                    />
                  </Field>
                </>
              )}
            </div>

            <Field label="Catatan" className="mt-3">
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan transaksi (opsional)"
              />
            </Field>
          </Card>
        </div>

        {/* Ringkasan */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Ringkasan
            </h2>

            <dl className="space-y-2 text-sm">
              <Baris label={`Subtotal (${items.length} unit)`} nilai={subtotal} />
              <Baris
                label={`Ongkir (${penanggungOngkir === "TOKO" ? "toko" : "pembeli"})`}
                nilai={ongkirNilai}
              />
              <div className="border-t border-gray-200 pt-2 dark:border-zinc-700">
                <Baris label="Total Tagihan" nilai={totalTagihan} tebal />
              </div>

              {metodeBayar === "PIUTANG" && (
                <>
                  <Baris label="Dibayar sekarang" nilai={dibayar ?? 0} />
                  <Baris label="Sisa piutang" nilai={sisaPiutang} warna="kuning" />
                </>
              )}

              <div className="border-t border-gray-200 pt-2 dark:border-zinc-700">
                <Baris label="Total HPP" nilai={totalHpp} />
                <Baris
                  label="Laba estimasi"
                  nilai={labaEstimasi}
                  tebal
                  warna={labaEstimasi >= 0 ? "hijau" : "merah"}
                />
              </div>
            </dl>

            {labaEstimasi < 0 && items.length > 0 && (
              <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                Transaksi ini rugi {formatRupiah(Math.abs(labaEstimasi))}. Masih bisa disimpan,
                tapi akan ditandai merah di laporan.
              </p>
            )}

            <Button type="submit" loading={simpan.isPending} className="mt-4 w-full">
              Simpan transaksi
            </Button>
          </Card>
        </div>
      </form>
    </>
  );
}

function Baris({
  label,
  nilai,
  tebal,
  warna,
}: {
  label: string;
  nilai: number;
  tebal?: boolean;
  warna?: "hijau" | "merah" | "kuning";
}) {
  const kelasWarna =
    warna === "hijau"
      ? "text-green-700 dark:text-green-400"
      : warna === "merah"
        ? "text-red-700 dark:text-red-400"
        : warna === "kuning"
          ? "text-amber-700 dark:text-amber-400"
          : "text-gray-900 dark:text-gray-100";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
      <dd
        className={`tabular-nums ${kelasWarna} ${tebal ? "text-base font-semibold" : ""}`}
      >
        {formatRupiah(nilai)}
      </dd>
    </div>
  );
}
