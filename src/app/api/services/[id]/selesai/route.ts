import { NextResponse } from "next/server";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { selesaikanService } from "@/lib/service";

type Ctx = { params: Promise<{ id: string }> };

/** Service selesai -> unit kembali ke antrian QC. */
export const POST = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  await selesaikanService(id);
  await catatAudit(user.id, "UPDATE", "Service", id, { aksi: "SELESAI" });
  return NextResponse.json({ ok: true });
});
