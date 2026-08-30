import { NextResponse } from "next/server";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { hapusKasManual } from "@/lib/kas";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const baris = await hapusKasManual(id);
  await catatAudit(user.id, "DELETE", "KasEntry", id, {
    jenis: baris.jenis,
    jumlah: baris.jumlah.toString(),
  });
  return NextResponse.json({ ok: true });
});
