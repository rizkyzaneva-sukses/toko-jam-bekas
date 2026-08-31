import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { buatUnit } from "@/lib/unit";
import { namaUnitDariItems } from "@/lib/nama-unit";
import { selisihHari, toNumber } from "@/lib/utils";
import type { UnitRingkas } from "@/lib/tipe";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const brand = searchParams.get("brand");
  const grade = searchParams.get("grade");
  const q = searchParams.get("q")?.trim();
  const minUmur = Number(searchParams.get("minUmur") ?? 0);

  const where: Prisma.UnitWhereInput = {};
  if (status && status !== "SEMUA") where.status = status as Prisma.UnitWhereInput["status"];
  if (brand && brand !== "SEMUA") where.brand = brand;
  if (grade && grade !== "SEMUA") where.grade = grade as Prisma.UnitWhereInput["grade"];
  if (q) {
    where.OR = [
      { kodeUnit: { contains: q } },
      { brand: { contains: q } },
      { model: { contains: q } },
    ];
  }

  const [units, brands] = await Promise.all([
    getPrisma().unit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
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
    }),
    getPrisma().unit.findMany({ distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);

  const sekarang = new Date();
  let data: UnitRingkas[] = units.map((u) => {
    const hpp = toNumber(u.hpp);
    const hargaJual = toNumber(u.hargaJual);
    const nama = namaUnitDariItems(
      u.brand,
      u.model,
      u.services.flatMap((sv) => sv.items)
    );
    return {
      id: u.id,
      kodeUnit: u.kodeUnit,
      brand: u.brand,
      model: u.model,
      ...nama,
      status: u.status,
      grade: u.grade,
      hargaBeli: toNumber(u.hargaBeli),
      totalBiayaService: toNumber(u.totalBiayaService),
      hpp,
      hargaJual,
      margin: hargaJual > 0 ? hargaJual - hpp : 0,
      tglBeli: u.tglBeli.toISOString(),
      tglMasukInventory: u.tglMasukInventory?.toISOString() ?? null,
      tglKeluar: u.tglKeluar?.toISOString() ?? null,
      umurHari:
        u.status === "READY" && u.tglMasukInventory
          ? selisihHari(u.tglMasukInventory, sekarang)
          : null,
      alasanRusak: u.alasanRusak,
      catatan: u.catatan,
      catatanKondisi: u.catatanKondisi,
      adaBox: u.adaBox,
      adaSurat: u.adaSurat,
      adaBuku: u.adaBuku,
      adaExtraLink: u.adaExtraLink,
      adaSertifikat: u.adaSertifikat,
    };
  });

  if (minUmur > 0) data = data.filter((u) => (u.umurHari ?? 0) >= minUmur);

  return NextResponse.json({
    data,
    brands: brands.map((b) => b.brand),
  });
});

const skemaBeli = z.object({
  brand: z.string().min(1, "Brand wajib diisi"),
  model: z.string().min(1, "Model wajib diisi"),
  hargaBeli: z.number().positive("Harga beli harus lebih dari Rp 0"),
  tglBeli: z.string().min(1, "Tanggal beli wajib diisi"),
  catatan: z.string().optional().nullable(),
});

export const POST = withAuth(async (req, user) => {
  const body = skemaBeli.parse(await req.json());

  const unit = await buatUnit({
    brand: body.brand,
    model: body.model,
    hargaBeli: body.hargaBeli,
    tglBeli: new Date(body.tglBeli),
    catatan: body.catatan,
  });

  await catatAudit(user.id, "CREATE", "Unit", unit.id, {
    kodeUnit: unit.kodeUnit,
    hargaBeli: body.hargaBeli,
  });

  return NextResponse.json({ id: unit.id, kodeUnit: unit.kodeUnit }, { status: 201 });
});
