import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { buatSparepart } from "@/lib/sparepart";
import { toNumber } from "@/lib/utils";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis");
  const q = searchParams.get("q")?.trim();
  const hanyaTersedia = searchParams.get("tersedia") === "1";

  const where: Prisma.SparepartWhereInput = {};
  if (jenis && jenis !== "SEMUA") {
    where.jenis = jenis as Prisma.SparepartWhereInput["jenis"];
  }
  if (hanyaTersedia) {
    where.aktif = true;
    where.stok = { gt: 0 };
  }
  if (q) {
    where.OR = [
      { nama: { contains: q, mode: "insensitive" } },
      { kode: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await getPrisma().sparepart.findMany({
    where,
    orderBy: [{ jenis: "asc" }, { nama: "asc" }],
  });

  return NextResponse.json(
    rows.map((s) => ({
      id: s.id,
      kode: s.kode,
      nama: s.nama,
      jenis: s.jenis,
      satuan: s.satuan,
      stok: s.stok,
      hargaRata: toNumber(s.hargaRata),
      nilai: s.stok * toNumber(s.hargaRata),
      minStok: s.minStok,
      menipis: s.minStok > 0 && s.stok <= s.minStok,
      aktif: s.aktif,
      catatan: s.catatan,
    }))
  );
});

const skema = z.object({
  nama: z.string().min(1, "Nama sparepart wajib diisi"),
  jenis: z.enum(["BATRE", "STRAP", "KACA", "MESIN", "LAINNYA"]),
  satuan: z.string().optional().nullable(),
  minStok: z.number().int().min(0).optional(),
  catatan: z.string().optional().nullable(),
});

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());

  const sp = await buatSparepart({
    nama: body.nama,
    jenis: body.jenis,
    satuan: body.satuan ?? undefined,
    minStok: body.minStok,
    catatan: body.catatan,
  });

  await catatAudit(user.id, "CREATE", "Sparepart", sp.id, { kode: sp.kode, nama: sp.nama });
  return NextResponse.json({ id: sp.id, kode: sp.kode }, { status: 201 });
});
