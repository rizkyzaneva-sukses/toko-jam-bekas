import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, KesalahanBisnis, withAuth } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const skema = z.object({
  nama: z.string().min(1, "Nama mitra wajib diisi").optional(),
  kontak: z.string().optional().nullable(),
  kota: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
  aktif: z.boolean().optional(),
});

export const PATCH = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  const mitra = await getPrisma().mitra.update({
    where: { id },
    data: {
      ...(body.nama !== undefined ? { nama: body.nama.trim() } : {}),
      ...(body.kontak !== undefined ? { kontak: body.kontak?.trim() || null } : {}),
      ...(body.kota !== undefined ? { kota: body.kota?.trim() || null } : {}),
      ...(body.catatan !== undefined ? { catatan: body.catatan?.trim() || null } : {}),
      ...(body.aktif !== undefined ? { aktif: body.aktif } : {}),
    },
  });

  await catatAudit(user.id, "UPDATE", "Mitra", id, { nama: mitra.nama });
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;

  const jumlahTransaksi = await getPrisma().penjualan.count({ where: { mitraId: id } });
  if (jumlahTransaksi > 0) {
    throw new KesalahanBisnis(
      `Mitra ini punya ${jumlahTransaksi} transaksi — tidak bisa dihapus. Nonaktifkan saja supaya riwayat tetap utuh.`
    );
  }

  const mitra = await getPrisma().mitra.delete({ where: { id } });
  await catatAudit(user.id, "DELETE", "Mitra", id, { nama: mitra.nama });
  return NextResponse.json({ ok: true });
});
