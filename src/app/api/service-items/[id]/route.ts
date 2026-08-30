import { NextResponse } from "next/server";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { hapusItemService } from "@/lib/service";

type Ctx = { params: Promise<{ id: string }> };

/** Hapus satu komponen service — HPP unit dihitung ulang otomatis. */
export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  await hapusItemService(id);
  await catatAudit(user.id, "DELETE", "ServiceItem", id);
  return NextResponse.json({ ok: true });
});
