import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { catatKasManual, ringkasanKas } from "@/lib/kas";
import { bulanIniWIB, tanggalInputKeDate } from "@/lib/utils";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan") || bulanIniWIB();

  if (!/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ error: "Format bulan harus YYYY-MM" }, { status: 400 });
  }

  return NextResponse.json(await ringkasanKas(bulan));
});

const skema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jenis: z.enum([
    "MODAL_MASUK",
    "PRIVE",
    "LAINNYA_MASUK",
    "LAINNYA_KELUAR",
    "PENYESUAIAN_MASUK",
    "PENYESUAIAN_KELUAR",
  ]),
  jumlah: z.number().positive("Jumlah harus lebih dari Rp 0"),
  keterangan: z.string().optional().nullable(),
});

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());

  const baris = await catatKasManual({
    tanggal: tanggalInputKeDate(body.tanggal),
    jenis: body.jenis,
    jumlah: body.jumlah,
    keterangan: body.keterangan,
  });

  await catatAudit(user.id, "CREATE", "KasEntry", baris.id, {
    jenis: body.jenis,
    jumlah: body.jumlah,
  });

  return NextResponse.json({ id: baris.id }, { status: 201 });
});
