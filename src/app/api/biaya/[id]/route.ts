import { NextResponse } from "next/server";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { hapusBiaya } from "@/lib/biaya";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const biaya = await hapusBiaya(id);
  await catatAudit(user.id, "DELETE", "BiayaOperasional", id, {
    kategori: biaya.kategori,
    jumlah: biaya.jumlah.toString(),
  });
  return NextResponse.json({ ok: true });
});
