// Pembungkus route handler. Middleware saja tidak cukup — API bisa dipanggil
// langsung tanpa lewat navigasi halaman, jadi setiap handler tetap dijaga.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, type Role } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  nama: string;
  email: string | null;
  role: Role;
}

/** Kesalahan yang memang disebabkan input user — dibalas 400, bukan 500. */
export class KesalahanBisnis extends Error {
  status: number;
  constructor(pesan: string, status = 400) {
    super(pesan);
    this.name = "KesalahanBisnis";
    this.status = status;
  }
}

/** Baca user + role SEGAR dari DB. Jangan pernah percaya role dari cookie. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  const user = await getPrisma().user.findFirst({
    where: { id: session.userId, isActive: true },
    select: { id: true, nama: true, email: true, role: true },
  });

  return (user as AuthUser) ?? null;
}

type Handler<T> = (req: Request, user: AuthUser, ctx: T) => Promise<Response> | Response;

export function withAuth<T>(handler: Handler<T>) {
  return async (req: Request, ctx: T) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Belum login", type: "auth_required" },
        { status: 401 }
      );
    }
    try {
      return await handler(req, user, ctx);
    } catch (error) {
      return apiError(error);
    }
  };
}

export function withRole<T>(roles: Role[], handler: Handler<T>) {
  return async (req: Request, ctx: T) => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Belum login", type: "auth_required" },
        { status: 401 }
      );
    }
    if (!roles.includes(user.role)) {
      console.warn(`[auth] Akses ditolak: ${user.email ?? user.id} (role ${user.role})`);
      return NextResponse.json(
        { error: "Anda tidak punya akses untuk tindakan ini.", type: "forbidden" },
        { status: 403 }
      );
    }
    try {
      return await handler(req, user, ctx);
    } catch (error) {
      return apiError(error);
    }
  };
}

export const withOwner = <T>(h: Handler<T>) => withRole<T>(["OWNER"], h);
export const withAdmin = <T>(h: Handler<T>) => withRole<T>(["OWNER", "ADMIN"], h);

/** Error terstruktur -> respons JSON yang konsisten */
export function apiError(error: unknown) {
  if (error instanceof KesalahanBisnis) {
    return NextResponse.json(
      { error: error.message, type: "bad_request" },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    const pesan = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json(
      { error: pesan || "Data yang dikirim tidak valid", type: "validation_error" },
      { status: 400 }
    );
  }
  console.error("[api]", error);
  const pesan = error instanceof Error ? error.message : "Terjadi kesalahan di server";
  return NextResponse.json({ error: pesan, type: "server_error" }, { status: 500 });
}

/** Catat perubahan uang / stok / user. Pembacaan halaman biasa tidak dicatat. */
export async function catatAudit(
  userId: string,
  aksi: string,
  entitas: string,
  entitasId?: string,
  detail?: Record<string, unknown>
) {
  try {
    await getPrisma().auditLog.create({
      data: {
        userId,
        aksi,
        entitas,
        entitasId,
        detail: detail === undefined ? undefined : (detail as Prisma.InputJsonValue),
      },
    });
  } catch (e) {
    // Audit log tidak boleh menggagalkan transaksi bisnis
    console.error("[audit] gagal mencatat:", e);
  }
}
