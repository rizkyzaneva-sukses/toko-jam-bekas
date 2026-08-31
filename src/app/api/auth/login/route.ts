import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { apiError, catatAudit } from "@/lib/api-helpers";

// Rate limit sederhana per IP. Untuk multi-instance, pindahkan ke Redis/DB.
const percobaan = new Map<string, { n: number; sampai: number }>();
const MAKS = 5;
const JENDELA = 15 * 60 * 1000;

function kenaLimit(ip: string) {
  const now = Date.now();
  const rec = percobaan.get(ip);
  if (!rec || now > rec.sampai) {
    percobaan.set(ip, { n: 1, sampai: now + JENDELA });
    return false;
  }
  rec.n += 1;
  return rec.n > MAKS;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (kenaLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi 15 menit lagi." },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const user = await getPrisma().user.findFirst({
      where: { username: String(username).toLowerCase().trim(), isActive: true },
    });

    // Pesan sengaja generik --- jangan bocorkan mana yang salah.
    const gagal = NextResponse.json({ error: "Username atau password salah" }, { status: 401 });

    if (!user?.passwordHash) return gagal;
    if (!(await bcrypt.compare(String(password), user.passwordHash))) return gagal;

    const session = await getSession();
    session.userId = user.id;
    session.nama = user.nama;
    session.email = user.email ?? undefined;
    session.isLoggedIn = true;
    await session.save();

    await getPrisma().user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await catatAudit(user.id, "LOGIN", "Auth", user.id, {
      username: user.username,
      nama: user.nama,
      role: user.role,
      ip,
    });

    percobaan.delete(ip);
    return NextResponse.json({ ok: true, nama: user.nama, role: user.role });
  } catch (error) {
    return apiError(error);
  }
}
