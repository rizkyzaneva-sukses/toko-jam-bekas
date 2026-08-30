// Pembungkus fetch untuk sisi klien — semua error API dinormalkan jadi Error
// dengan pesan yang bisa langsung ditampilkan ke user.

export class ApiError extends Error {
  status: number;
  constructor(pesan: string, status: number) {
    super(pesan);
    this.name = "ApiError";
    this.status = status;
  }
}

async function jalankan<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new ApiError("Sesi berakhir, silakan login lagi", 401);
  }

  const teks = await res.text();
  const data = teks ? JSON.parse(teks) : null;

  if (!res.ok) {
    throw new ApiError(data?.error ?? "Terjadi kesalahan di server", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => jalankan<T>(url),
  post: <T>(url: string, body?: unknown) =>
    jalankan<T>(url, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(url: string, body?: unknown) =>
    jalankan<T>(url, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T>(url: string) => jalankan<T>(url, { method: "DELETE" }),
};
