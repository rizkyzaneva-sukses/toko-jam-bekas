import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-helpers";
import { rentangBulanWIB } from "@/lib/utils";
import type { BarisLedger } from "@/lib/tipe";
import { namaUnitDariItems } from "@/lib/nama-unit";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan");
  const jenis = searchParams.get("jenis");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.StokLedgerWhereInput = {};
  if (bulan && bulan !== "SEMUA") {
    const { dari, sampai } = rentangBulanWIB(bulan);
    where.tanggal = { gte: dari, lt: sampai };
  }
  if (jenis && jenis !== "SEMUA") where.jenis = jenis as Prisma.StokLedgerWhereInput["jenis"];
  if (q) {
    where.unit = {
      OR: [
        { kodeUnit: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const rows = await getPrisma().stokLedger.findMany({
    where,
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    take: 1000,
    include: {
      unit: {
        select: {
          kodeUnit: true,
          brand: true,
          model: true,
          services: {
            orderBy: { tglMasuk: "asc" },
            select: {
              items: {
                orderBy: { createdAt: "asc" },
                select: { jenis: true, deskripsi: true },
              },
            },
          },
        },
      },
    },
  });

  const data: BarisLedger[] = rows.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    jenis: r.jenis,
    qty: r.qty,
    keterangan: r.keterangan,
    tanggal: r.tanggal.toISOString(),
    kodeUnit: r.unit.kodeUnit,
    brand: r.unit.brand,
    model: r.unit.model,
    namaLengkap: namaUnitDariItems(
      r.unit.brand,
      r.unit.model,
      r.unit.services.flatMap((sv) => sv.items)
    ).namaLengkap,
  }));

  return NextResponse.json(data);
});
