"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { MitraRingkas } from "@/lib/tipe";
import { bulanIniWIB, formatRupiah } from "@/lib/utils";
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
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui/ui";

type Urutan = "omzet" | "laba" | "unit";

export default function HalamanMitra() {
  const qc = useQueryClient();
  const [bulan, setBulan] = React.useState(bulanIniWIB());
  const [urutan, setUrutan] = React.useState<Urutan>("omzet");
  const [formUntuk, setFormUntuk] = React.useState<MitraRingkas | "baru" | null>(null);
  const [hapusUntuk, setHapusUntuk] = React.useState<MitraRingkas | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mitra", bulan],
    queryFn: () => api.get<MitraRingkas[]>(`/api/mitra?bulan=${bulan}`),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.del(`/api/mitra/${id}`),
    onSuccess: () => {
      toast.success("Mitra dihapus");
      setHapusUntuk(null);
      qc.invalidateQueries({ queryKey: ["mitra"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setHapusUntuk(null);
    },
  });

  const mitra = React.useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => {
      if (urutan === "laba") return b.totalLaba - a.totalLaba;
      if (urutan === "unit") return b.totalUnit - a.totalUnit;
      return b.totalOmzet - a.totalOmzet;
    });
    return list;
  }, [data, urutan]);

  const totalOmzet = mitra.reduce((t, m) => t + m.totalOmzet, 0);
  const totalPiutang = mitra.reduce((t, m) => t + m.sisaPiutang, 0);

  return (
    <>
      <PageHeader
        judul="Mitra"
        deskripsi="Data mitra B2B beserta ranking dan posisi piutangnya."
        aksi={
          <Button onClick={() => setFormUntuk("baru")}>
            <Plus className="h-4 w-4" /> Tambah mitra
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jumlah mitra" nilai={mitra.length} rupiah={false} />
        <StatCard
          label="Mitra aktif"
          nilai={mitra.filter((m) => m.aktif).length}
          rupiah={false}
        />
        <StatCard label="Omzet periode" nilai={totalOmzet} />
        <StatCard
          label="Piutang mitra"
          nilai={totalPiutang}
          nada={totalPiutang > 0 ? "buruk" : "netral"}
          sub="Seluruh periode"
        />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-lg">
          <Field label="Periode ranking">
            <PilihBulan value={bulan} onChange={setBulan} denganSemua className="w-full" />
          </Field>
          <Field label="Urutkan berdasarkan">
            <SearchableSelect
              options={[
                { value: "omzet", label: "Omzet terbesar" },
                { value: "laba", label: "Laba terbesar" },
                { value: "unit", label: "Unit terbanyak" },
              ]}
              value={urutan}
              onChange={(v) => setUrutan((v as Urutan) ?? "omzet")}
              placeholder="Pilih urutan"
            />
          </Field>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={6} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : mitra.length === 0 ? (
          <EmptyState
            judul="Belum ada mitra"
            deskripsi="Tambah mitra supaya bisa mencatat penjualan B2B dan melihat rankingnya."
            aksi={<Button onClick={() => setFormUntuk("baru")}>Tambah mitra</Button>}
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Mitra</Th>
                  <Th>Kontak</Th>
                  <Th className="text-right">Transaksi</Th>
                  <Th className="text-right">Unit</Th>
                  <Th className="text-right">Omzet</Th>
                  <Th className="text-right">Laba</Th>
                  <Th className="text-right">Piutang</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {mitra.map((m, i) => (
                  <tr key={m.id}>
                    <Td className="text-gray-600 dark:text-gray-400">{i + 1}</Td>
                    <Td>
                      <span className="font-medium text-gray-900 dark:text-gray-50">
                        {m.nama}
                      </span>
                      {!m.aktif && (
                        <Badge warna="abu" className="ml-2">
                          Nonaktif
                        </Badge>
                      )}
                      {m.kota && (
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {m.kota}
                        </span>
                      )}
                    </Td>
                    <Td className="text-gray-600 dark:text-gray-400">{m.kontak ?? "-"}</Td>
                    <Td className="text-right tabular-nums">{m.totalTransaksi}</Td>
                    <Td className="text-right tabular-nums">{m.totalUnit}</Td>
                    <Td className="text-right tabular-nums">{formatRupiah(m.totalOmzet)}</Td>
                    <Td
                      className={
                        m.totalLaba < 0
                          ? "text-right tabular-nums text-red-700 dark:text-red-400"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatRupiah(m.totalLaba)}
                    </Td>
                    <Td
                      className={
                        m.sisaPiutang > 0
                          ? "text-right font-medium tabular-nums text-amber-700 dark:text-amber-400"
                          : "text-right tabular-nums text-gray-600 dark:text-gray-400"
                      }
                    >
                      {m.sisaPiutang > 0 ? formatRupiah(m.sisaPiutang) : "-"}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setFormUntuk(m)}
                          aria-label={`Edit ${m.nama}`}
                          className="rounded p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setHapusUntuk(m)}
                          aria-label={`Hapus ${m.nama}`}
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

      <FormMitra target={formUntuk} onClose={() => setFormUntuk(null)} />

      <ConfirmDialog
        open={!!hapusUntuk}
        onOpenChange={(v) => !v && setHapusUntuk(null)}
        judul="Hapus mitra?"
        loading={hapus.isPending}
        onKonfirmasi={() => hapusUntuk && hapus.mutate(hapusUntuk.id)}
        pesan={
          <>
            <p>
              Mitra <strong>{hapusUntuk?.nama}</strong> akan dihapus permanen.
            </p>
            <p className="mt-2">
              Kalau mitra ini pernah bertransaksi, penghapusan akan ditolak — nonaktifkan saja
              lewat tombol edit supaya riwayat penjualan tetap utuh.
            </p>
          </>
        }
      />
    </>
  );
}

function FormMitra({
  target,
  onClose,
}: {
  target: MitraRingkas | "baru" | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const mitra = target === "baru" ? null : target;

  const [nama, setNama] = React.useState("");
  const [kontak, setKontak] = React.useState("");
  const [kota, setKota] = React.useState("");
  const [catatan, setCatatan] = React.useState("");
  const [aktif, setAktif] = React.useState(true);
  const [err, setErr] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!target) return;
    setNama(mitra?.nama ?? "");
    setKontak(mitra?.kontak ?? "");
    setKota(mitra?.kota ?? "");
    setCatatan(mitra?.catatan ?? "");
    setAktif(mitra?.aktif ?? true);
    setErr(undefined);
  }, [target, mitra]);

  const simpan = useMutation({
    mutationFn: () => {
      const body = {
        nama: nama.trim(),
        kontak: kontak.trim() || null,
        kota: kota.trim() || null,
        catatan: catatan.trim() || null,
        aktif,
      };
      return mitra ? api.patch(`/api/mitra/${mitra.id}`, body) : api.post("/api/mitra", body);
    },
    onSuccess: () => {
      toast.success(mitra ? "Mitra diperbarui" : "Mitra ditambahkan");
      qc.invalidateQueries({ queryKey: ["mitra"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!target}
      onOpenChange={(v) => !v && onClose()}
      judul={mitra ? `Edit ${mitra.nama}` : "Tambah Mitra"}
    >
      <div className="space-y-4">
        <Field label="Nama mitra" required error={err}>
          <Input
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama toko / reseller"
          />
        </Field>

        <Field label="Kontak / WA">
          <Input
            value={kontak}
            onChange={(e) => setKontak(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </Field>

        <Field label="Kota">
          <Input value={kota} onChange={(e) => setKota(e.target.value)} placeholder="Jakarta" />
        </Field>

        <Field label="Catatan">
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Kesepakatan harga, preferensi barang, dll"
          />
        </Field>

        {mitra && (
          <Field label="Status">
            <SearchableSelect
              options={[
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Nonaktif — tidak muncul saat buat nota" },
              ]}
              value={aktif ? "aktif" : "nonaktif"}
              onChange={(v) => setAktif(v === "aktif")}
              placeholder="Pilih status"
            />
          </Field>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button varian="secondary" onClick={onClose} disabled={simpan.isPending}>
            Batal
          </Button>
          <Button
            loading={simpan.isPending}
            onClick={() => {
              if (!nama.trim()) {
                setErr("Nama mitra wajib diisi");
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
