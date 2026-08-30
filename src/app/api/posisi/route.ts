import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { posisiKeuangan } from "@/lib/laporan";

/** Posisi keuangan sejak app dipakai + pemeriksaan silang saldo kas. */
export const GET = withAuth(async () => NextResponse.json(await posisiKeuangan()));
