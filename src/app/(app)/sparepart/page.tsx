"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Download, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

export default function HalamanSparepart() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState("SEMUA");
  const [q, setQ] = React.useState("");
  const [formBaru, setFormBaru] = React.useState(false);
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
            aksi={<Button onClick={() => setFormBaru(true)}>Tambah sparepart</Button>}
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
                  <Th />
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
                          className="min-h-[36px] px-2.5 py-1"
                          onClick={() => setIsiStokUntuk(s)}
                        >
                          <PackagePlus className="h-4 w-4" /> Isi
                        </Button>
                        <Button
                          varian="ghost"
                          className="min-h-[36px] px-2.5 py-1"
                          onClick={() => setOpnameUntuk(s)}
                          title="Stok opname"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        <button
                          onClick={() => setEditUntuk(s)}
                          aria-label={`Edit ${s.nama}`}
                          className="rounded p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setHapusUntuk(s)}
                          aria-label={`Hapus ${s.nama}`}
                          className="rounded p-2 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
              Kalau sparepart ini pernah dipakai di service, penghapusan akan ditolak —
              nonaktifkan saja lewat tombol edit.
            </p>
          </>
        }
      />
    </>
  );
}

function FormSparepart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [nama, setNama] = React.useState("");
  const [jenis, setJenis] = React.useState<string | null>("BATRE");
  const [satuan, setSatuan] = React.useState("pcs");
  const [minStok, setMinStok] = React.useState("0");
  const [catatan, setCatatan] = React.useState("");
  const [err, setErr] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!open) return;
    setNama("");
    setJenis("BATRE");
    setSatuan("pcs");
    setMinStok("0");
    setCatatan("");
    setErr(undefined);
  }, [open]);

  const simpan = useMutation({
    mutationFn: () =>
      api.post<{ kode: string }>("/api/sparepart", {
        nama: nama.trim(),
        jenis,
        satuan: satuan.trim() || "pcs",
        minStok: Number(minStok) || 0,
        catatan: catatan.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success(`Sparepart ${res.kode} ditambahkan`);
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} judul="Tambah Sparepart">
      <div className="space-y-4">
        <Field label="Nama" required error={err}>
          <Input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Batre Maxell SR626SW"
          />
        </Field>

        <Field label="Jenis" required>
          <SearchableSelect
            options={OPSI_JENIS}
            value={jenis}
            onChange={setJenis}
            placeholder="Pilih jenis"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan">
            <Input value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="pcs" />
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

        <Field label="Catatan">
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Opsional"
          />
        </Field>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Stok masih kosong setelah disimpan. Isi stoknya lewat tombol{" "}
          <strong>Isi</strong> di daftar.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              if (!nama.trim()) {
                setErr("Nama wajib diisi");
                return;
              }
              setErr(undefined);
              simpan.mutate();
            }}
          >
            Simpan
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
  const [qty, setQty] = React.useState("");
  const [harga, setHarga] = React.useState<number | null>(null);
  const [tanggal, setTanggal] = React.useState(tanggalWIB());
  const [keterangan, setKeterangan] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!sparepart) return;
    setQty("");
    setHarga(sparepart.hargaRata > 0 ? sparepart.hargaRata : null);
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
      toast.success("Stok bertambah, kas berkurang");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const jumlahQty = Number(qty) || 0;
  const total = jumlahQty * (harga ?? 0);

  return (
    <Modal
      open={!!sparepart}
      onOpenChange={(v) => !v && onClose()}
      judul="Isi Stok Sparepart"
      deskripsi={
        sparepart
          ? `${sparepart.nama} — stok sekarang ${sparepart.stok} ${sparepart.satuan}, harga rata-rata ${formatRupiah(sparepart.hargaRata)}`
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jumlah" required error={err.qty}>
            <Input
              type="number"
              min={1}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Harga satuan" required error={err.harga}>
            <InputRupiah value={harga} onChange={setHarga} />
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
