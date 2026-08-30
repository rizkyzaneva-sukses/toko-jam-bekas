import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, KesalahanBisnis, withAuth } from "@/lib/api-helpers";
import { hapusSparepart } from "@/lib/sparepart";
import { toNumber } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

/** Detail sparepart + riwayat mutasinya. */
export const GET = withAuth<Ctx>(async (_req, _user, ctx) => {
  const { id } = await ctx.params;

  const sp = await getPrisma().sparepart.findUnique({
    where: { id },
    include: {
      mutasi: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }], take: 200 },
    },
  });
  if (!sp) throw new KesalahanBisnis("Sparepart tidak ditemukan", 404);

  return NextResponse.json({
    id: sp.id,
    kode: sp.kode,
    nama: sp.nama,
    jenis: sp.jenis,
    satuan: sp.satuan,
    stok: sp.stok,
    hargaRata: toNumber(sp.hargaRata),
    nilai: sp.stok * toNumber(sp.hargaRata),
    minStok: sp.minStok,
    aktif: sp.aktif,
    catatan: sp.catatan,
    mutasi: sp.mutasi.map((m) => ({
      id: m.id,
      jenis: m.jenis,
      qty: m.qty,
      hargaSatuan: toNumber(m.hargaSatuan),
      total: toNumber(m.total),
      stokSesudah: m.stokSesudah,
      keterangan: m.keterangan,
      tanggal: m.tanggal.toISOString(),
    })),
  });
});

const skema = z.object({
  nama: z.string().min(1).optional(),
  satuan: z.string().optional().nullable(),
  minStok: z.number().int().min(0).optional(),
  aktif: z.boolean().optional(),
  catatan: z.string().optional().nullable(),
});

export const PATCH = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  const sp = await getPrisma().sparepart.update({
    where: { id },
    data: {
      ...(body.nama !== undefined ? { nama: body.nama.trim() } : {}),
      ...(body.satuan !== undefined ? { satuan: body.satuan?.trim() || "pcs" } : {}),
      ...(body.minStok !== undefined ? { minStok: body.minStok } : {}),
      ...(body.aktif !== undefined ? { aktif: body.aktif } : {}),
      ...(body.catatan !== undefined ? { catatan: body.catatan?.trim() || null } : {}),
    },
  });

  await catatAudit(user.id, "UPDATE", "Sparepart", id, { nama: sp.nama });
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const sp = await hapusSparepart(id);
  await catatAudit(user.id, "DELETE", "Sparepart", id, { nama: sp.nama });
  return NextResponse.json({ ok: true });
});
