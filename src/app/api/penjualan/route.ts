import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { buatPenjualan } from "@/lib/penjualan";
import { rentangBulanWIB, tanggalInputKeDate, toNumber } from "@/lib/utils";
import type { PenjualanRingkas } from "@/lib/tipe";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan");
  const tipe = searchParams.get("tipe");
  const statusBayar = searchParams.get("statusBayar");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.PenjualanWhereInput = {};
  if (bulan && bulan !== "SEMUA") {
    const { dari, sampai } = rentangBulanWIB(bulan);
    where.tanggal = { gte: dari, lt: sampai };
  }
  if (tipe && tipe !== "SEMUA") where.tipePembeli = tipe as Prisma.PenjualanWhereInput["tipePembeli"];
  if (statusBayar === "BELUM_LUNAS") where.statusBayar = { not: "LUNAS" };
  else if (statusBayar && statusBayar !== "SEMUA") {
    where.statusBayar = statusBayar as Prisma.PenjualanWhereInput["statusBayar"];
  }
  if (q) {
    where.OR = [
      { noNota: { contains: q, mode: "insensitive" } },
      { namaPembeli: { contains: q, mode: "insensitive" } },
      { mitra: { nama: { contains: q, mode: "insensitive" } } },
    ];
  }

  const notas = await getPrisma().penjualan.findMany({
    where,
    orderBy: { tanggal: "desc" },
    take: 500,
    include: { items: true, mitra: { select: { nama: true } } },
  });

  const sekarang = new Date();
  const data: PenjualanRingkas[] = notas.map((n) => {
    const totalTagihan = toNumber(n.totalTagihan);
    const totalDibayar = toNumber(n.totalDibayar);
    const sisa = totalTagihan - totalDibayar;
    const labaUnit = n.items.reduce((t, i) => t + toNumber(i.laba), 0);
    const ongkirToko = n.penanggungOngkir === "TOKO" ? toNumber(n.ongkir) : 0;

    return {
      id: n.id,
      noNota: n.noNota,
      tanggal: n.tanggal.toISOString(),
      tipePembeli: n.tipePembeli,
      pembeli: n.mitra?.nama ?? n.namaPembeli ?? "Umum",
      channel: n.channel,
      jumlahUnit: n.items.length,
      subtotal: toNumber(n.subtotal),
      ongkir: toNumber(n.ongkir),
      penanggungOngkir: n.penanggungOngkir,
      totalTagihan,
      totalDibayar,
      sisaPiutang: sisa > 0 ? sisa : 0,
      metodeBayar: n.metodeBayar,
      statusBayar: n.statusBayar,
      jatuhTempo: n.jatuhTempo?.toISOString() ?? null,
      laba: labaUnit - ongkirToko,
      terlewat: !!n.jatuhTempo && n.jatuhTempo < sekarang && n.statusBayar !== "LUNAS",
      catatan: n.catatan,
    };
  });

  return NextResponse.json(data);
});

const skema = z
  .object({
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    tipePembeli: z.enum(["B2B", "B2C"]),
    mitraId: z.string().optional().nullable(),
    namaPembeli: z.string().optional().nullable(),
    channel: z.enum(["OFFLINE", "WA_SOSMED"]),
    items: z
      .array(z.object({ unitId: z.string().min(1), hargaJual: z.number().positive() }))
      .min(1, "Minimal satu unit harus dipilih"),
    ongkir: z.number().min(0).default(0),
    penanggungOngkir: z.enum(["PEMBELI", "TOKO"]),
    metodeBayar: z.enum(["CASH", "PIUTANG"]),
    dibayar: z.number().min(0).optional(),
    jatuhTempo: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
  })
  .refine((d) => d.tipePembeli !== "B2B" || !!d.mitraId, {
    message: "Mitra wajib dipilih untuk penjualan B2B",
    path: ["mitraId"],
  })
  .refine((d) => d.metodeBayar !== "PIUTANG" || !!d.jatuhTempo, {
    message: "Jatuh tempo wajib diisi untuk pembayaran piutang",
    path: ["jatuhTempo"],
  });

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());

  const penjualan = await buatPenjualan({
    tanggal: tanggalInputKeDate(body.tanggal),
    tipePembeli: body.tipePembeli,
    mitraId: body.mitraId,
    namaPembeli: body.namaPembeli,
    channel: body.channel,
    items: body.items,
    ongkir: body.ongkir,
    penanggungOngkir: body.penanggungOngkir,
    metodeBayar: body.metodeBayar,
    dibayar: body.dibayar,
    jatuhTempo: body.jatuhTempo ? tanggalInputKeDate(body.jatuhTempo) : null,
    catatan: body.catatan,
  });

  await catatAudit(user.id, "CREATE", "Penjualan", penjualan.id, {
    noNota: penjualan.noNota,
    totalTagihan: penjualan.totalTagihan.toString(),
    jumlahUnit: body.items.length,
  });

  return NextResponse.json({ id: penjualan.id, noNota: penjualan.noNota }, { status: 201 });
});
