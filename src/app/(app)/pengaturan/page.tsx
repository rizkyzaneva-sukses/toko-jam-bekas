"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { api } from "@/lib/api-client";

interface UserInfo {
  id: string;
  nama: string;
  email: string | null;
  role: string;
}

export default function PengaturanPage() {
  const queryClient = useQueryClient();
  const [konfirmasi, setKonfirmasi] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  const { data: user } = useQuery<UserInfo>({
    queryKey: ["me"],
    queryFn: () => api.get("/api/auth/me"),
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post("/api/reset", { konfirmasi: "RESET" }),
    onSuccess: (data: any) => {
      toast.success("Data berhasil direset!");
      setKonfirmasi("");
      setShowModal(false);
      // Refresh semua data
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Gagal reset data");
    },
  });

  if (!user) return null;

  // Hanya OWNER yang bisa akses
  if (user.role !== "OWNER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
          Akses Terbatas
        </h1>
        <p className="text-gray-500">
          Halaman ini hanya bisa diakses oleh Owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-gray-500">
          Pengaturan khusus owner untuk mengelola aplikasi.
        </p>
      </div>

      {/* Info User */}
      <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800">
        <h2 className="font-semibold mb-3">Info Akun</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Nama</dt>
          <dd>{user.nama}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd>{user.email || "-"}</dd>
          <dt className="text-gray-500">Role</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {user.role}
            </span>
          </dd>
        </dl>
      </div>

      {/* Reset Data */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/30 dark:border-red-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-semibold text-red-800 dark:text-red-300">
              Reset Semua Data
            </h2>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              Tindakan ini akan <strong>menghapus semua data transaksi</strong>{" "}
              termasuk: unit jam, sparepart, penjualan, kas, service, QC, piutang,
              mitra, dan biaya operasional. Data user dan audit log tidak akan
              terhapus.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Reset
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Ketik <strong className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded">RESET</strong> di bawah
              untuk mengkonfirmasi penghapusan semua data transaksi.
            </p>

            <input
              type="text"
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              placeholder='Ketik "RESET"'
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setKonfirmasi("");
                }}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={konfirmasi !== "RESET" || resetMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetMutation.isPending ? "Menghapus..." : "Hapus Semua Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
