import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { catatAudit } from "@/lib/api-helpers";

export async function POST() {
  const session = await getSession();
  if (session.userId) {
    await catatAudit(session.userId, "LOGOUT", "Auth", session.userId, {
      nama: session.nama,
    });
  }
  session.destroy();
  return NextResponse.json({ ok: true });
}
