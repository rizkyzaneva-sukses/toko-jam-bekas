import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-helpers";
import { toNumber } from "@/lib/utils";
import type { AntrianService } from "@/lib/tipe";
import { namaUnitDariItems } from "@/lib/nama-unit";

/** Antrian bengkel: tiket service yang masih PROSES. */
export const GET = withAuth(async () => {
  const services = await getPrisma().service.findMany({
    where: { status: "PROSES" },
    orderBy: { tglMasuk: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { sparepart: { select: { nama: true, satuan: true } } },
      },
      unit: {
        select: {
          id: true,
          kodeUnit: true,
          brand: true,
          model: true,
          hargaBeli: true,
          hpp: true,
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

  const data: AntrianService[] = services.map((s) => ({
    id: s.id,
    unitId: s.unit.id,
    kodeUnit: s.unit.kodeUnit,
    brand: s.unit.brand,
    model: s.unit.model,
    ...namaUnitDariItems(
      s.unit.brand,
      s.unit.model,
      s.unit.services.flatMap((sv) => sv.items)
    ),
    hargaBeli: toNumber(s.unit.hargaBeli),
    hpp: toNumber(s.unit.hpp),
    status: s.status,
    catatan: s.catatan,
    tglMasuk: s.tglMasuk.toISOString(),
    totalBiaya: toNumber(s.totalBiaya),
    items: s.items.map((i) => ({
      id: i.id,
      jenis: i.jenis,
      deskripsi: i.deskripsi,
      biaya: toNumber(i.biaya),
      dariStok: !!i.sparepartId,
      qty: i.qty,
      namaSparepart: i.sparepart?.nama ?? null,
      satuan: i.sparepart?.satuan ?? null,
    })),
  }));

  return NextResponse.json(data);
});
