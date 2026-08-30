import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { buatBiaya, LABEL_KATEGORI, ringkasanBiaya } from "@/lib/biaya";
import { bulanIniWIB, rentangBulanWIB, tanggalInputKeDate, toNumber } from "@/lib/utils";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan") || bulanIniWIB();

  if (!/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ error: "Format bulan harus YYYY-MM" }, { status: 400 });
  }

  const { dari, sampai } = rentangBulanWIB(bulan);
  const [rows, ringkasan] = await Promise.all([
    getPrisma().biayaOperasional.findMany({
      where: { tanggal: { gte: dari, lt: sampai } },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    ringkasanBiaya(bulan),
  ]);

  return NextResponse.json({
    ...ringkasan,
    baris: rows.map((b) => ({
      id: b.id,
      tanggal: b.tanggal.toISOString(),
      kategori: b.kategori,
      label: LABEL_KATEGORI[b.kategori],
      deskripsi: b.deskripsi,
      jumlah: toNumber(b.jumlah),
      catatan: b.catatan,
    })),
  });
});

const skema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  kategori: z.enum([
    "SEWA",
    "GAJI",
    "LISTRIK",
    "AIR",
    "INTERNET",
    "TRANSPORT",
    "PERLENGKAPAN",
    "PEMASARAN",
    "PAJAK_RETRIBUSI",
    "LAINNYA",
  ]),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  jumlah: z.number().positive("Jumlah harus lebih dari Rp 0"),
  catatan: z.string().optional().nullable(),
});

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());

  const biaya = await buatBiaya({
    tanggal: tanggalInputKeDate(body.tanggal),
    kategori: body.kategori,
    deskripsi: body.deskripsi,
    jumlah: body.jumlah,
    catatan: body.catatan,
  });

  await catatAudit(user.id, "CREATE", "BiayaOperasional", biaya.id, {
    kategori: body.kategori,
    jumlah: body.jumlah,
  });

  return NextResponse.json({ id: biaya.id }, { status: 201 });
});
