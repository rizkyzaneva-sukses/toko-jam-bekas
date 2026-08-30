import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { batalRusak, tandaiRusak } from "@/lib/unit";
import { tanggalInputKeDate } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

const skema = z.object({
  alasan: z.string().min(1, "Alasan wajib diisi"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
});

/** Pindahkan unit ke RUSAK (write-off). */
export const POST = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  const unit = await tandaiRusak(id, body.alasan, tanggalInputKeDate(body.tanggal));
  await catatAudit(user.id, "UPDATE", "Unit", id, {
    aksi: "WRITE_OFF",
    kodeUnit: unit.kodeUnit,
    alasan: body.alasan,
    hpp: unit.hpp.toString(),
  });

  return NextResponse.json({ ok: true, kodeUnit: unit.kodeUnit });
});

/** Batalkan write-off — unit kembali ke status sebelumnya. */
export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const unit = await batalRusak(id);
  await catatAudit(user.id, "UPDATE", "Unit", id, {
    aksi: "BATAL_WRITE_OFF",
    kodeUnit: unit.kodeUnit,
  });
  return NextResponse.json({ ok: true, kodeUnit: unit.kodeUnit, status: unit.status });
});
