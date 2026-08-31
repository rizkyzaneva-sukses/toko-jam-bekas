"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  RefreshCw,
  Search,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { formatTanggalJam } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Modal } from "@/components/ui/dialog";
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
  Th,
} from "@/components/ui/ui";

interface AuditLogItem {
  id: string;
  userId: string;
  aksi: string;
  entitas: string;
  entitasId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    nama: string;
    username: string | null;
    role: string;
  };
}

interface LogApiResponse {
  logs: AuditLogItem[];
  total: number;
  halaman: number;
  totalHalaman: number;
  users: { id: string; nama: string; role: string }[];
  statistik: {
    total: number;
    aktivitasHariIni: number;
  };
}

const OPSI_AKSI = [
  { value: "SEMUA", label: "Semua aksi" },
  { value: "CREATE", label: "Tambah (CREATE)" },
  { value: "UPDATE", label: "Ubah (UPDATE)" },
  { value: "DELETE", label: "Hapus (DELETE)" },
  { value: "LOGIN", label: "Login (LOGIN)" },
  { value: "LOGOUT", label: "Logout (LOGOUT)" },
  { value: "IMPORT", label: "Import Data (IMPORT)" },
  { value: "EXPORT", label: "Export Data (EXPORT)" },
];

const OPSI_ENTITAS = [
  { value: "SEMUA", label: "Semua entitas" },
  { value: "Unit", label: "Unit (Jam)" },
  { value: "Sparepart", label: "Sparepart" },
  { value: "MutasiSparepart", label: "Mutasi Sparepart" },
  { value: "Penjualan", label: "Penjualan" },
  { value: "Pembayaran", label: "Pembayaran Piutang" },
  { value: "Service", label: "Service" },
  { value: "ServiceItem", label: "Komponen Service" },
  { value: "KasEntry", label: "Buku Kas" },
  { value: "BiayaOperasional", label: "Biaya Operasional" },
  { value: "Mitra", label: "Mitra" },
  { value: "Auth", label: "Autentikasi (Sesi)" },
  { value: "Laporan", label: "Laporan" },
];

function badgeAksi(aksi: string) {
  switch (aksi.toUpperCase()) {
    case "CREATE":
      return <Badge warna="hijau">Tambah</Badge>;
    case "UPDATE":
      return <Badge warna="kuning">Ubah</Badge>;
    case "DELETE":
      return <Badge warna="merah">Hapus</Badge>;
    case "LOGIN":
      return <Badge warna="biru">Login</Badge>;
    case "LOGOUT":
      return <Badge warna="abu">Logout</Badge>;
    case "IMPORT":
      return <Badge warna="biru">Import</Badge>;
    case "EXPORT":
      return <Badge warna="kuning">Export</Badge>;
    default:
      return <Badge warna="abu">{aksi}</Badge>;
  }
}

function ringkasanDetail(item: AuditLogItem): string {
  if (!item.detail) return "-";
  const d = item.detail;

  if (item.aksi === "LOGIN") {
    return `Login berhasil (${d.username || d.nama || "User"})`;
  }
  if (item.aksi === "LOGOUT") {
    return "Sesi diakhiri (Logout)";
  }
  if (item.entitas === "Unit") {
    if (d.kodeUnit) {
      return `${d.kodeUnit}${d.brand ? ` — ${d.brand} ${d.model || ""}` : ""}`;
    }
    if (d.brand) return `${d.brand} ${d.model || ""}`;
  }
  if (item.entitas === "Sparepart") {
    if (d.kode && d.nama) return `${d.kode} — ${d.nama}`;
    if (d.nama) return String(d.nama);
  }
  if (item.aksi === "IMPORT" && item.entitas === "Sparepart") {
    return `Import batch: ${d.total ?? 0} sparepart`;
  }
  if (item.entitas === "Penjualan") {
    if (d.noNota) return `Nota ${d.noNota}`;
  }
  if (d.keterangan) return String(d.keterangan);
  if (d.nama) return String(d.nama);
  if (d.deskripsi) return String(d.deskripsi);

  return JSON.stringify(d).slice(0, 60);
}

﻿export default function HalamanLogAktivitas() {
  const [q, setQ] = React.useState("");
  const [qDebounce, setQDebounce] = React.useState("");
  const [aksi, setAksi] = React.useState("SEMUA");
  const [entitas, setEntitas] = React.useState("SEMUA");
  const [userId, setUserId] = React.useState("SEMUA");
  const [halaman, setHalaman] = React.useState(1);
  const [detailItem, setDetailItem] = React.useState<AuditLogItem | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setQDebounce(q);
      setHalaman(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs", qDebounce, aksi, entitas, userId, halaman],
    queryFn: () =>
      api.get<LogApiResponse>(
        `/api/log?q=${encodeURIComponent(qDebounce)}&aksi=${aksi}&entitas=${entitas}&userId=${userId}&halaman=${halaman}&limit=25`
      ),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalHalaman = data?.totalHalaman ?? 1;
  const userOptions = [
    { value: "SEMUA", label: "Semua pengguna" },
    ...(data?.users ?? []).map((u) => ({ value: u.id, label: `${u.nama} (${u.role})` })),
  ];

  return (
    <>
      <PageHeader
        judul="Log Aktivitas"
        deskripsi="Rekaman audit jejak aktivitas, perubahan data, transaksi kas/stok, dan riwayat login seluruh pengguna."
        aksi={
          <Button varian="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Segarkan
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total Aktivitas Tercatat" nilai={total} rupiah={false} />
        <StatCard
          label="Aktivitas Hari Ini"
          nilai={data?.statistik.aktivitasHariIni ?? 0}
          rupiah={false}
          nada={(data?.statistik.aktivitasHariIni ?? 0) > 0 ? "baik" : "netral"}
        />
        <StatCard
          label="Jumlah Pengguna"
          nilai={data?.users.length ?? 0}
          rupiah={false}
        />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Cari">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="User, kode unit, nama, dll"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Aksi">
            <SearchableSelect
              options={OPSI_AKSI}
              value={aksi}
              onChange={(v) => {
                setAksi(v ?? "SEMUA");
                setHalaman(1);
              }}
              placeholder="Semua aksi"
            />
          </Field>

          <Field label="Entitas">
            <SearchableSelect
              options={OPSI_ENTITAS}
              value={entitas}
              onChange={(v) => {
                setEntitas(v ?? "SEMUA");
                setHalaman(1);
              }}
              placeholder="Semua entitas"
            />
          </Field>

          <Field label="Pengguna">
            <SearchableSelect
              options={userOptions}
              value={userId}
              onChange={(v) => {
                setUserId(v ?? "SEMUA");
                setHalaman(1);
              }}
              placeholder="Semua pengguna"
            />
          </Field>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={8} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : logs.length === 0 ? (
          <EmptyState
            judul="Belum ada aktivitas"
            deskripsi="Setiap kali pengguna melakukan aksi tambah, ubah, hapus data, atau login, rekaman audit log akan muncul di sini."
          />
        ) : (
          <>
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Waktu (WIB)</Th>
                    <Th>Pengguna</Th>
                    <Th>Aksi</Th>
                    <Th>Entitas</Th>
                    <Th>Ringkasan</Th>
                    <Th className="text-right">Rincian</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <Td className="whitespace-nowrap text-xs tabular-nums text-gray-600 dark:text-gray-400">
                        {formatTanggalJam(l.createdAt)}
                      </Td>
                      <Td>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {l.user.nama}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          @{l.user.username || l.user.role.toLowerCase()} · {l.user.role}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">{badgeAksi(l.aksi)}</Td>
                      <Td className="whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                        {l.entitas}
                      </Td>
                      <Td className="max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">
                        {ringkasanDetail(l)}
                      </Td>
                      <Td className="text-right">
                        <Button
                          varian="secondary"
                          className="min-h-[32px] px-2.5 py-1 text-xs"
                          onClick={() => setDetailItem(l)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWrap>

            {totalHalaman > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-zinc-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Halaman <strong>{halaman}</strong> dari <strong>{totalHalaman}</strong> (Total{" "}
                  {total} data)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    varian="secondary"
                    className="min-h-[32px] px-2.5 py-1 text-xs"
                    disabled={halaman <= 1}
                    onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
                  </Button>
                  <Button
                    varian="secondary"
                    className="min-h-[32px] px-2.5 py-1 text-xs"
                    disabled={halaman >= totalHalaman}
                    onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                  >
                    Selanjutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ModalDetailLog item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  );
}

function ModalDetailLog({
  item,
  onClose,
}: {
  item: AuditLogItem | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!item}
      onOpenChange={(v) => !v && onClose()}
      judul="Rincian Log Aktivitas"
      deskripsi={item ? `${item.aksi} pada entitas ${item.entitas}` : undefined}
    >
      {item && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800/40">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Pengguna:</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {item.user.nama} ({item.user.role})
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Waktu Kejadian:</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatTanggalJam(item.createdAt)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Tindakan / Aksi:</span>
              <div className="mt-0.5">{badgeAksi(item.aksi)}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Entitas ID / Target:</span>
              <p className="font-mono text-xs text-gray-800 dark:text-gray-200">
                {item.entitasId || "-"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Data Perubahan / Parameter (JSON)
            </label>
            <pre className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-900 p-3 text-xs font-mono text-gray-100 dark:border-zinc-700 dark:bg-black/60">
              {item.detail ? JSON.stringify(item.detail, null, 2) : "Tidak ada detail tambahan"}
            </pre>
          </div>

          <div className="flex justify-end pt-1">
            <Button varian="secondary" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
