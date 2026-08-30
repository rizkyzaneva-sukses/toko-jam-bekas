import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { laporanLabaRugi } from "@/lib/laporan";
import { bulanIniWIB } from "@/lib/utils";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan") || bulanIniWIB();

  if (!/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ error: "Format bulan harus YYYY-MM" }, { status: 400 });
  }

  return NextResponse.json(await laporanLabaRugi(bulan));
});
