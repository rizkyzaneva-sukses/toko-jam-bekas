"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { api } from "@/lib/api-client";
import type { JenisKomponenStr } from "@/lib/tipe";
import { LABEL_KOMPONEN } from "@/lib/tipe";
import { formatAngka, formatRupiah, tanggalWIB } from "@/lib/utils";
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

export interface SparepartRingkas {
  id: string;
  kode: string;
  nama: string;
  jenis: JenisKomponenStr;
  satuan: string;
  stok: number;
  hargaRata: number;
  nilai: number;
  minStok: number;
  menipis: boolean;
  aktif: boolean;
  catatan: string | null;
}

const OPSI_JENIS = (["BATRE", "STRAP", "KACA", "MESIN", "LAINNYA"] as JenisKomponenStr[]).map(
  (j) => ({ value: j, label: LABEL_KOMPONEN[j] })
);

function normalisasiJenis(raw: string): JenisKomponenStr | null {
  const bersih = String(raw || "").trim().toUpperCase();
  if (bersih === "BATRE" || bersih === "BATERAI" || bersih === "BATTERY") return "BATRE";
  if (bersih === "STRAP" || bersih === "TALI" || bersih === "RANTAI" || bersih === "BRACELET") return "STRAP";
  if (bersih === "KACA" || bersih === "GLASS" || bersih === "CRYSTAL") return "KACA";
  if (bersih === "MESIN" || bersih === "MOVEMENT") return "MESIN";
  if (bersih === "LAINNYA" || bersih === "LAIN" || bersih === "OTHER") return "LAINNYA";
  return null;
}

export default function HalamanSparepart() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState("SEMUA");
  const [q, setQ] = React.useState("");
  const [formBaru, setFormBaru] = React.useState(false);
  const [formImport, setFormImport] = React.useState(false);
  const [isiStokUntuk, setIsiStokUntuk] = React.useState<SparepartRingkas | null>(null);
  const [opnameUntuk, setOpnameUntuk] = React.useState<SparepartRingkas | null>(null);
  const [editUntuk, setEditUntuk] = React.useState<SparepartRingkas | null>(null);
  const [hapusUntuk, setHapusUntuk] = React.useState<SparepartRingkas | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sparepart", filter, q],
    queryFn: () =>
      api.get<SparepartRingkas[]>(
        `/api/sparepart?jenis=${filter}&q=${encodeURIComponent(q)}`
      ),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.del(`/api/sparepart/${id}`),
    onSuccess: () => {
      toast.success("Sparepart dihapus");
      setHapusUntuk(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setHapusUntuk(null);
    },
  });

  const rows = data ?? [];
  const nilaiTotal = rows.reduce((t, s) => t + s.nilai, 0);
  const menipis = rows.filter((s) => s.menipis);

  return (
    <>
      <PageHeader
        judul="Stok Sparepart"
        deskripsi="Persediaan batre, strap, kaca, dan mesin. Uang keluar saat dibeli; saat dipakai, nilainya pindah ke HPP jam."
        aksi={
          <div className="flex flex-wrap gap-2">
            <Button varian="secondary" onClick={() => setFormImport(true)}>
              <Upload className="h-4 w-4" /> Import Excel
            </Button>
            <a href="/api/export?jenis=sparepart">
              <Button varian="secondary">
                <Download className="h-4 w-4" /> Export
              </Button>
            </a>
            <Button onClick={() => setFormBaru(true)}>
              <Plus className="h-4 w-4" /> Tambah sparepart
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jenis Barang" nilai={rows.length} rupiah={false} />
        <StatCard
          label="Total Unit di Rak"
          nilai={rows.reduce((t, s) => t + s.stok, 0)}
          rupiah={false}
        />
        <StatCard label="Nilai Persediaan" nilai={nilaiTotal} />
        <StatCard
          label="Perlu Restock"
          nilai={menipis.length}
          rupiah={false}
          nada={menipis.length > 0 ? "buruk" : "netral"}
        />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Field label="Cari">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nama atau kode sparepart"
            />
          </Field>
          <Field label="Jenis">
            <SearchableSelect
              options={[{ value: "SEMUA", label: "Semua jenis" }, ...OPSI_JENIS]}
              value={filter}
              onChange={(v) => setFilter(v ?? "SEMUA")}
              placeholder="Semua jenis"
            />
          </Field>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={6} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            judul="Belum ada sparepart"
            deskripsi="Daftarkan barang yang biasa Anda stok, lalu isi stoknya. Setelah itu bisa dipakai langsung saat service."
            aksi={
              <div className="flex gap-2">
                <Button varian="secondary" onClick={() => setFormImport(true)}>
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
                <Button onClick={() => setFormBaru(true)}>Tambah sparepart</Button>
              </div>
            }
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Nama</Th>
                  <Th>Jenis</Th>
                  <Th className="text-right">Stok</Th>
                  <Th className="text-right">Harga Rata-rata</Th>
                  <Th className="text-right">Nilai</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-medium">{s.kode}</Td>
                    <Td>
                      {s.nama}
                      {!s.aktif && (
                        <Badge warna="abu" className="ml-2">
                          Nonaktif
                        </Badge>
                      )}
                    </Td>
                    <Td>{LABEL_KOMPONEN[s.jenis]}</Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="tabular-nums">
                          {formatAngka(s.stok)} {s.satuan}
                        </span>
                        {s.menipis && (
                          <Badge warna={s.stok === 0 ? "merah" : "kuning"}>
                            {s.stok === 0 ? "habis" : "menipis"}
                          </Badge>
                        )}
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">{formatRupiah(s.hargaRata)}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatRupiah(s.nilai)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          varian="secondary"
                          className="min-h-[36px] px-2.5 py-1 text-xs"
                          onClick={() => setIsiStokUntuk(s)}
                          title="Pengisian stok"
                        >
                          <PackagePlus className="h-4 w-4 mr-1" /> Isi
                        </Button>
                        <Button
                          varian="ghost"
                          className="min-h-[36px] px-2.5 py-1 text-xs"
                          onClick={() => setOpnameUntuk(s)}
                          title="Stok opname"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        <Button
                          varian="ghost"
                          className="min-h-[36px] px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                          onClick={() => setEditUntuk(s)}
                          title={`Edit ${s.nama}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <button
                          onClick={() => setHapusUntuk(s)}
                          aria-label={`Hapus ${s.nama}`}
                          className="rounded p-2 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>

      <FormSparepart open={formBaru} onClose={() => setFormBaru(false)} />
      <FormImportSparepart open={formImport} onClose={() => setFormImport(false)} />
      <FormIsiStok sparepart={isiStokUntuk} onClose={() => setIsiStokUntuk(null)} />
      <FormOpname sparepart={opnameUntuk} onClose={() => setOpnameUntuk(null)} />
      <FormEdit sparepart={editUntuk} onClose={() => setEditUntuk(null)} />

      <ConfirmDialog
        open={!!hapusUntuk}
        onOpenChange={(v) => !v && setHapusUntuk(null)}
        judul="Hapus sparepart?"
        loading={hapus.isPending}
        onKonfirmasi={() => hapusUntuk && hapus.mutate(hapusUntuk.id)}
        pesan={
          <>
            <p>
              <strong>{hapusUntuk?.nama}</strong> akan dihapus permanen beserta riwayat
              pengisian stoknya.
            </p>
            <p className="mt-2">
              Kalau sparepart ini pernah dipakai di service, penghapusan akan ditolak.
              Nonaktifkan saja lewat tombol edit.
            </p>
          </>
        }
      />
    </>
  );
}

﻿function FormSparepart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [nama, setNama] = React.useState("");
  const [jenis, setJenis] = React.useState<JenisKomponenStr>("BATRE");
  const [satuan, setSatuan] = React.useState("pcs");
  const [minStok, setMinStok] = React.useState("0");
  const [catatan, setCatatan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  const simpan = useMutation({
    mutationFn: () =>
      api.post("/api/sparepart", {
        nama: nama.trim(),
        jenis,
        satuan: satuan.trim() || "pcs",
        minStok: Number(minStok) || 0,
        catatan: catatan.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Sparepart ditambahkan");
      qc.invalidateQueries();
      onClose();
      setNama("");
      setCatatan("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Tambah Sparepart Baru"
      deskripsi="Daftarkan katalog barang. Pengisian stoknya dilakukan setelah barang dibuat."
    >
      <div className="space-y-4">
        <Field label="Jenis" required>
          <SearchableSelect
            options={OPSI_JENIS}
            value={jenis}
            onChange={(v) => v && setJenis(v as JenisKomponenStr)}
            placeholder="Pilih jenis"
          />
        </Field>

        <Field label="Nama barang" required error={err.nama}>
          <Input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Batre Seiko 371 (SR920SW), Strap Kulit Coklat 20mm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan">
            <Input
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              placeholder="pcs, set, roll"
            />
          </Field>
          <Field label="Peringatan stok menipis" hint="0 = tanpa peringatan">
            <Input
              type="number"
              min={0}
              value={minStok}
              onChange={(e) => setMinStok(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Catatan (opsional)">
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Supplier langganan, nomor seri, dll"
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
              if (!nama.trim()) e.nama = "Nama sparepart wajib diisi";
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

interface ParsedSparepartRow {
  nama: string;
  jenis: JenisKomponenStr | null;
  rawJenis: string;
  satuan: string;
  minStok: number;
  stokAwal: number;
  hargaBeliSatuan: number;
  catatan: string | null;
  valid: boolean;
  pesanError?: string;
}

function FormImportSparepart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dataParsed, setDataParsed] = React.useState<ParsedSparepartRow[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setDataParsed([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (rows.length === 0) {
          toast.error("File Excel kosong atau tidak memiliki data");
          setIsProcessing(false);
          return;
        }

        const hasil: ParsedSparepartRow[] = rows.map((r) => {
          const nama = String(r["Nama"] || r["nama"] || r["NAMA"] || r["Nama Barang"] || "").trim();
          const rawJenis = String(r["Jenis"] || r["jenis"] || r["JENIS"] || r["Kategori"] || "").trim();
          const jenis = normalisasiJenis(rawJenis);
          const satuan = String(r["Satuan"] || r["satuan"] || r["SATUAN"] || "pcs").trim() || "pcs";
          const minStok = Math.max(0, parseInt(String(r["Min Stok"] || r["minStok"] || r["Min_Stok"] || 0), 10) || 0);
          const stokAwal = Math.max(0, parseInt(String(r["Stok Awal"] || r["stokAwal"] || r["Stok"] || 0), 10) || 0);
          const hargaBeliSatuan = Math.max(0, parseFloat(String(r["Harga Beli Satuan"] || r["Harga Beli"] || r["hargaBeliSatuan"] || r["Harga"] || 0)) || 0);
          const catatan = String(r["Catatan"] || r["catatan"] || r["CATATAN"] || r["Keterangan"] || "").trim() || null;

          const errorList: string[] = [];
          if (!nama) errorList.push("Nama wajib diisi");
          if (!jenis) errorList.push(`Jenis "${rawJenis || "-"}" tidak valid (BATRE/STRAP/KACA/MESIN/LAINNYA)`);
          if (stokAwal > 0 && hargaBeliSatuan <= 0) {
            errorList.push("Harga beli satuan wajib jika ada stok awal");
          }

          return {
            nama,
            jenis,
            rawJenis,
            satuan,
            minStok,
            stokAwal,
            hargaBeliSatuan,
            catatan,
            valid: errorList.length === 0,
            pesanError: errorList.join(", "),
          };
        });

        setDataParsed(hasil);
      } catch (err) {
        toast.error("Gagal membaca file Excel: " + (err instanceof Error ? err.message : "Format tidak sesuai"));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importMutation = useMutation({
    mutationFn: () => {
      const itemsValid = dataParsed
        .filter((r) => r.valid && r.jenis)
        .map((r) => ({
          nama: r.nama,
          jenis: r.jenis!,
          satuan: r.satuan,
          minStok: r.minStok,
          stokAwal: r.stokAwal,
          hargaBeliSatuan: r.hargaBeliSatuan,
          catatan: r.catatan,
        }));

      return api.post<{ ok: boolean; count: number }>("/api/sparepart/import", { items: itemsValid });
    },
    onSuccess: (res: { count?: number }) => {
      toast.success(`${res?.count ?? dataParsed.length} sparepart berhasil diimport!`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const validCount = dataParsed.filter((r) => r.valid).length;
  const invalidCount = dataParsed.length - validCount;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Import Sparepart via Excel"
      deskripsi="Unggah file spreadsheet (.xlsx / .xls / .csv) untuk memasukkan katalog sparepart secara massal sekaligus."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Belum punya format Excel?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Unduh template resmi lengkap dengan contoh data dan petunjuk kolom.
            </p>
          </div>
          <a href="/api/sparepart/template" download="Template-Import-Sparepart.xlsx">
            <Button varian="secondary" className="bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Unduh Template
            </Button>
          </a>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Pilih File Excel / CSV
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-blue-400 dark:text-gray-400"
            />
          </div>
        </div>

        {dataParsed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Pratinjau Data ({dataParsed.length} baris)
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center text-red-700 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" /> {invalidCount} ada error
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-zinc-700">
              <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-zinc-700">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Nama</th>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Jenis</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">Stok Awal</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">Harga Modal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                  {dataParsed.map((r, i) => (
                    <tr key={i} className={!r.valid ? "bg-red-50/60 dark:bg-red-950/30" : undefined}>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        {r.valid ? (
                          <Badge warna="hijau">OK</Badge>
                        ) : (
                          <span className="text-red-700 dark:text-red-400 font-medium" title={r.pesanError}>
                            {r.pesanError}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-gray-900 dark:text-gray-100">{r.nama || "-"}</td>
                      <td className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300">{r.jenis ?? r.rawJenis ?? "-"}</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {r.stokAwal} {r.satuan}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {r.hargaBeliSatuan > 0 ? formatRupiah(r.hargaBeliSatuan) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
          <Button varian="secondary" onClick={onClose} disabled={importMutation.isPending}>
            Batal
          </Button>
          <Button
            loading={importMutation.isPending || isProcessing}
            disabled={validCount === 0 || isProcessing}
            onClick={() => importMutation.mutate()}
          >
            Import {validCount > 0 ? `${validCount} Barang` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormIsiStok({
  sparepart,
  onClose,
}: {
  sparepart: SparepartRingkas | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [qty, setQty] = React.useState("1");
  const [harga, setHarga] = React.useState(0);
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [keterangan, setKeterangan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!sparepart) return;
    setQty("1");
    setHarga(sparepart.hargaRata > 0 ? sparepart.hargaRata : 0);
    setTanggal(tanggalWIB());
    setKeterangan("");
    setErr({});
  }, [sparepart]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post(`/api/sparepart/${sparepart!.id}/stok`, {
        aksi: "ISI",
        qty: Number(qty),
        hargaSatuan: harga,
        tanggal,
        keterangan: keterangan.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Stok berhasil diisi");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const jumlahQty = Number(qty) || 0;
  const total = jumlahQty * (harga || 0);

  return (
    <Modal
      open={!!sparepart}
      onOpenChange={(v) => !v && onClose()}
      judul="Isi Stok Sparepart"
      deskripsi={
        sparepart
          ? `${sparepart.nama} — stok saat ini ${sparepart.stok} ${sparepart.satuan}`
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jumlah masuk" required error={err.qty}>
            <Input
              type="number"
              min={1}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>

          <Field label="Harga beli per pcs" required error={err.harga}>
            <InputRupiah value={harga} onChange={(v) => setHarga(v ?? 0)} placeholder="0" />
          </Field>
        </div>

        {total > 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Total uang keluar dari kas: <strong>{formatRupiah(total)}</strong>
          </p>
        )}

        <Field label="Tanggal" required>
          <Input
            type="date"
            value={tanggal}
            max={tanggalWIB()}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </Field>

        <Field label="Keterangan">
          <Input
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Beli dari toko mana (opsional)"
          />
        </Field>

        <p className="rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-zinc-900 dark:text-gray-300">
          Harga rata-rata akan dihitung ulang otomatis dengan menggabungkan stok lama dan
          pembelian ini.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              const e: Record<string, string> = {};
              if (jumlahQty <= 0) e.qty = "Jumlah wajib diisi";
              if (!harga || harga <= 0) e.harga = "Harga satuan wajib diisi";
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

function FormOpname({
  sparepart,
  onClose,
}: {
  sparepart: SparepartRingkas | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [stokBaru, setStokBaru] = React.useState("");
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [keterangan, setKeterangan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!sparepart) return;
    setStokBaru(String(sparepart.stok));
    setTanggal(tanggalWIB());
    setKeterangan("");
    setErr({});
  }, [sparepart]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post(`/api/sparepart/${sparepart!.id}/stok`, {
        aksi: "OPNAME",
        stokBaru: Number(stokBaru),
        tanggal,
        keterangan: keterangan.trim(),
      }),
    onSuccess: () => {
      toast.success("Stok disesuaikan");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selisih = (Number(stokBaru) || 0) - (sparepart?.stok ?? 0);
  const nilaiSelisih = Math.abs(selisih) * (sparepart?.hargaRata ?? 0);

  return (
    <Modal
      open={!!sparepart}
      onOpenChange={(v) => !v && onClose()}
      judul="Stok Opname"
      deskripsi={
        sparepart
          ? `${sparepart.nama} — catatan sistem ${sparepart.stok} ${sparepart.satuan}`
          : undefined
      }
    >
      <div className="space-y-4">
        <Field label="Jumlah hasil hitung fisik" required error={err.stokBaru}>
          <Input
            type="number"
            min={0}
            autoFocus
            value={stokBaru}
            onChange={(e) => setStokBaru(e.target.value)}
          />
        </Field>

        {selisih !== 0 && sparepart && (
          <p
            className={
              selisih < 0
                ? "text-sm font-medium text-red-700 dark:text-red-400"
                : "text-sm text-green-700 dark:text-green-400"
            }
          >
            {selisih < 0
              ? `Susut ${Math.abs(selisih)} ${sparepart.satuan} — kerugian ${formatRupiah(nilaiSelisih)} masuk ke Laporan L/R`
              : `Lebih ${selisih} ${sparepart.satuan} — persediaan bertambah ${formatRupiah(nilaiSelisih)}`}
          </p>
        )}

        <Field label="Tanggal" required>
          <Input
            type="date"
            value={tanggal}
            max={tanggalWIB()}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </Field>

        <Field label="Alasan" required error={err.keterangan}>
          <Textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: hasil stok opname bulanan, 2 batre rusak"
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
              if (stokBaru === "" || Number(stokBaru) < 0) e.stokBaru = "Isi jumlah hasil hitung";
              if (!keterangan.trim()) e.keterangan = "Alasan wajib diisi";
              if (selisih === 0) e.stokBaru = "Stok tidak berubah";
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

function FormEdit({
  sparepart,
  onClose,
}: {
  sparepart: SparepartRingkas | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [nama, setNama] = React.useState("");
  const [satuan, setSatuan] = React.useState("pcs");
  const [minStok, setMinStok] = React.useState("0");
  const [aktif, setAktif] = React.useState(true);
  const [catatan, setCatatan] = React.useState("");

  React.useEffect(() => {
    if (!sparepart) return;
    setNama(sparepart.nama);
    setSatuan(sparepart.satuan);
    setMinStok(String(sparepart.minStok));
    setAktif(sparepart.aktif);
    setCatatan(sparepart.catatan ?? "");
  }, [sparepart]);

  const simpan = useMutation({
    mutationFn: () =>
      api.patch(`/api/sparepart/${sparepart!.id}`, {
        nama: nama.trim(),
        satuan: satuan.trim() || "pcs",
        minStok: Number(minStok) || 0,
        aktif,
        catatan: catatan.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Sparepart diperbarui");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!sparepart}
      onOpenChange={(v) => !v && onClose()}
      judul={sparepart ? `Edit ${sparepart.kode}` : "Edit Sparepart"}
    >
      <div className="space-y-4">
        <Field label="Nama" required>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan">
            <Input value={satuan} onChange={(e) => setSatuan(e.target.value)} />
          </Field>
          <Field label="Min. stok" hint="0 = tanpa peringatan">
            <Input
              type="number"
              min={0}
              value={minStok}
              onChange={(e) => setMinStok(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Status">
          <SearchableSelect
            options={[
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif — tidak muncul saat service" },
            ]}
            value={aktif ? "aktif" : "nonaktif"}
            onChange={(v) => setAktif(v === "aktif")}
            placeholder="Pilih status"
          />
        </Field>

        <Field label="Catatan">
          <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button loading={simpan.isPending} onClick={() => simpan.mutate()}>
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
