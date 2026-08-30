import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis, withAuth } from "@/lib/api-helpers";
import { toNumber } from "@/lib/utils";
import type { PenjualanDetail } from "@/lib/tipe";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth<Ctx>(async (_req, _user, ctx) => {
  const { id } = await ctx.params;

  const n = await getPrisma().penjualan.findUnique({
    where: { id },
    include: {
      mitra: { select: { nama: true } },
      items: {
        include: { unit: { select: { kodeUnit: true, brand: true, model: true } } },
      },
      pembayaran: { orderBy: { tanggal: "asc" } },
    },
  });

  if (!n) throw new KesalahanBisnis("Transaksi tidak ditemukan", 404);

  const totalTagihan = toNumber(n.totalTagihan);
  const totalDibayar = toNumber(n.totalDibayar);
  const sisa = totalTagihan - totalDibayar;
  const labaUnit = n.items.reduce((t, i) => t + toNumber(i.laba), 0);
  const ongkirToko = n.penanggungOngkir === "TOKO" ? toNumber(n.ongkir) : 0;

  const detail: PenjualanDetail = {
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
    terlewat: !!n.jatuhTempo && n.jatuhTempo < new Date() && n.statusBayar !== "LUNAS",
    catatan: n.catatan,
    items: n.items.map((i) => ({
      id: i.id,
      unitId: i.unitId,
      kodeUnit: i.unit.kodeUnit,
      brand: i.unit.brand,
      model: i.unit.model,
      hargaJual: toNumber(i.hargaJual),
      hppSaatJual: toNumber(i.hppSaatJual),
      laba: toNumber(i.laba),
    })),
    pembayaran: n.pembayaran.map((p) => ({
      id: p.id,
      jumlah: toNumber(p.jumlah),
      tanggal: p.tanggal.toISOString(),
      catatan: p.catatan,
    })),
  };

  return NextResponse.json(detail);
});
