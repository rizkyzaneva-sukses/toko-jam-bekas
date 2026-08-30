import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { tambahItemService } from "@/lib/service";

type Ctx = { params: Promise<{ id: string }> };

const skema = z
  .object({
    jenis: z.enum(["BATRE", "STRAP", "KACA", "MESIN", "LAINNYA"]),
    deskripsi: z.string().optional().nullable(),
    /** Dipakai kalau komponen dibeli langsung / jasa tukang */
    biaya: z.number().positive().optional().nullable(),
    /** Dipakai kalau komponen diambil dari stok sparepart */
    sparepartId: z.string().optional().nullable(),
    qty: z.number().int().positive().optional().nullable(),
  })
  .refine((d) => !!d.sparepartId || (d.biaya ?? 0) > 0, {
    message: "Isi biaya, atau pilih sparepart dari stok",
    path: ["biaya"],
  })
  .refine((d) => !d.sparepartId || (d.qty ?? 0) > 0, {
    message: "Jumlah pemakaian sparepart wajib diisi",
    path: ["qty"],
  });

/** Tambah komponen ke tiket service — otomatis menambah HPP unit. */
export const POST = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  const item = await tambahItemService(id, body);
  await catatAudit(user.id, "CREATE", "ServiceItem", item.id, {
    serviceId: id,
    jenis: body.jenis,
    biaya: item.biaya.toString(),
    dariStok: !!body.sparepartId,
  });

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
});
