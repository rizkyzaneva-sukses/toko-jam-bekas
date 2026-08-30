import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type Role = "OWNER" | "ADMIN" | "STAFF" | "VIEWER";

export interface SessionData {
  userId?: string;
  nama?: string;
  email?: string;
  isLoggedIn?: boolean;
  // CATATAN: role SENGAJA tidak disimpan di sini.
  // Role selalu dibaca fresh dari DB (lihat api-helpers.ts) supaya pencabutan
  // hak berlaku seketika, bukan menunggu session kedaluwarsa.
}

const secret = process.env.SESSION_SECRET;

/**
 * Divalidasi saat request, bukan saat modul dimuat.
 * Kalau dicek di module scope, `next build` ikut gagal karena env produksi
 * belum tersedia di mesin build.
 */
function pastikanSecretAman() {
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("SESSION_SECRET wajib diisi minimal 32 karakter di produksi");
  }
}

export const sessionOptions: SessionOptions = {
  password: secret || "dev_only_password_at_least_32_characters_long",
  cookieName: process.env.SESSION_COOKIE_NAME || "jam_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  },
};

export async function getSession() {
  pastikanSecretAman();
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Generate secret:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
