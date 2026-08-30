import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { catatPembayaran } from "@/lib/penjualan";
import { tanggalInputKeDate } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

const skema = z.object({
  jumlah: z.number().positive("Jumlah pembayaran harus lebih dari Rp 0"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  catatan: z.string().optional().nullable(),
});

/** Catat cicilan / pelunasan piutang. */
export const POST = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  const penjualan = await catatPembayaran(
    id,
    body.jumlah,
    tanggalInputKeDate(body.tanggal),
    body.catatan
  );

  await catatAudit(user.id, "CREATE", "Pembayaran", id, {
    noNota: penjualan.noNota,
    jumlah: body.jumlah,
    statusBayar: penjualan.statusBayar,
  });

  return NextResponse.json({ ok: true, statusBayar: penjualan.statusBayar });
});
