"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Watch } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button, Field, Input, Skeleton } from "@/components/ui/ui";
import { ThemeToggle } from "@/components/theme-toggle";

function FormLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("return_to") || "/";

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { username, password });
      toast.success("Berhasil masuk");
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Username" required>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          placeholder="admin"
        />
      </Field>

      <Field label="Password" required error={error ?? undefined}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full">
        Masuk
      </Button>
    </form>
  );
}

/** Ditampilkan saat database belum punya satu pun user (app baru di-deploy). */
function FormSetup({ onSelesai }: { onSelesai: () => void }) {
  const router = useRouter();
  const [nama, setNama] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [ulangi, setUlangi] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!nama.trim()) v.nama = "Nama wajib diisi";
    if (username.trim().length < 3) v.username = "Username minimal 3 karakter";
    if (password.length < 8) v.password = "Password minimal 8 karakter";
    if (password !== ulangi) v.ulangi = "Password tidak sama";
    setErr(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    try {
      await api.post("/api/auth/bootstrap", {
        nama: nama.trim(),
        username: username.trim(),
        password,
      });
      toast.success("Akun owner dibuat");
      onSelesai();
      router.push("/");
      router.refresh();
    } catch (error) {
      setErr({ password: error instanceof Error ? error.message : "Gagal membuat akun" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        Database masih kosong. Buat akun owner sekarang — ini hanya bisa dilakukan sekali.
      </p>

      <Field label="Nama" required error={err.nama}>
        <Input
          autoFocus
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama Anda"
        />
      </Field>

      <Field label="Username" required error={err.username}>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          placeholder="admin"
        />
      </Field>

      <Field label="Password" required error={err.password} hint="Minimal 8 karakter">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Ulangi Password" required error={err.ulangi}>
        <Input
          type="password"
          value={ulangi}
          onChange={(e) => setUlangi(e.target.value)}
          autoComplete="new-password"
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full">
        Buat akun owner
      </Button>
    </form>
  );
}

function IsiHalaman() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api.get<{ perluSetup: boolean }>("/api/auth/bootstrap"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-11" />
      </div>
    );
  }

  if (data?.perluSetup) return <FormSetup onSelesai={() => refetch()} />;
  return <FormLogin />;
}

export default function HalamanLogin() {
  const namaApp = process.env.NEXT_PUBLIC_APP_NAME || "Jam Bekas Ops";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Watch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {namaApp}
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">Masuk</h1>
          <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
            Sistem operasional toko jam bekas.
          </p>

          <React.Suspense fallback={null}>
            <IsiHalaman />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
