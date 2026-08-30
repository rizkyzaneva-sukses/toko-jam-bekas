import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, waktu: new Date().toISOString() });
}
