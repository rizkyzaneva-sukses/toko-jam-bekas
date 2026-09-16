import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { periksaDampakHapusUnit } from "@/lib/unit";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Pratinjau dampak pembatalan unit: apa saja yang akan ikut terhapus dan
 * berapa kerugian kas yang timbul. Dipakai dialog konfirmasi sebelum DELETE.
 */
export const GET = withAuth<Ctx>(async (_req, _user, ctx) => {
  const { id } = await ctx.params;
  const dampak = await periksaDampakHapusUnit(id);
  return NextResponse.json(dampak);
});