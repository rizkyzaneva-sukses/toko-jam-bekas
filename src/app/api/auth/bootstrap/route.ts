// Pembuatan akun owner pertama, langsung dari halaman login.
//
// Kenapa ada: image produksi memakai Next.js standalone, jadi `tsx` dan
// `prisma/seed.ts` tidak tersedia di dalam container. Tanpa endpoint ini,
// app yang baru di-deploy tidak punya satu pun user dan tidak bisa dimasuki.
//
// Gerbang keamanannya: endpoint hanya bekerja saat tabel user benar-benar
// KOSONG. Sekali akun owner dibuat, endpoint ini menolak semua permintaan.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { apiError, KesalahanBisnis } from "@/lib/api-helpers";
import { getSession } from "@/lib/session";

/** Apakah app ini masih butuh setup awal? */
export async function GET() {
  try {
    const jumlah = await getPrisma().user.count();
    return NextResponse.json({ perluSetup: jumlah === 0 });
  } catch (error) {
    return apiError(error);
  }
}

const skema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username hanya boleh huruf, angka, titik, strip, underscore"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(req: Request) {
  try {
    const jumlah = await getPrisma().user.count();
    if (jumlah > 0) {
      throw new KesalahanBisnis(
        "Akun sudah pernah dibuat. Silakan login seperti biasa.",
        409
      );
    }

    const body = skema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await getPrisma().user.create({
      data: {
        nama: body.nama.trim(),
        username: body.username.toLowerCase().trim(),
        passwordHash,
        role: "OWNER",
        lastLoginAt: new Date(),
      },
    });

    const session = await getSession();
    session.userId = user.id;
    session.nama = user.nama;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, nama: user.nama }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
