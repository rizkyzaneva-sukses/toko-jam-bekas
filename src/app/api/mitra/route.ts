import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { rentangBulanWIB, toNumber } from "@/lib/utils";
import type { MitraRingkas } from "@/lib/tipe";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan"); // filter untuk angka ranking; null = sepanjang waktu

  const rentang = bulan && bulan !== "SEMUA" ? rentangBulanWIB(bulan) : null;

  const mitra = await getPrisma().mitra.findMany({
    orderBy: { nama: "asc" },
    include: {
      penjualan: {
        include: { items: { select: { hargaJual: true, laba: true } } },
      },
    },
  });

  const data: MitraRingkas[] = mitra.map((m) => {
    let totalOmzet = 0;
    let totalLaba = 0;
    let totalUnit = 0;
    let totalTransaksi = 0;
    let sisaPiutang = 0;

    for (const n of m.penjualan) {
      // Piutang selalu dihitung sepanjang waktu — ia posisi, bukan periode.
      const sisa = toNumber(n.totalTagihan) - toNumber(n.totalDibayar);
      if (sisa > 0) sisaPiutang += sisa;

      if (rentang && (n.tanggal < rentang.dari || n.tanggal >= rentang.sampai)) continue;

      totalTransaksi += 1;
      totalUnit += n.items.length;
      for (const i of n.items) {
        totalOmzet += toNumber(i.hargaJual);
        totalLaba += toNumber(i.laba);
      }
      if (n.penanggungOngkir === "TOKO") totalLaba -= toNumber(n.ongkir);
    }

    return {
      id: m.id,
      nama: m.nama,
      kontak: m.kontak,
      kota: m.kota,
      catatan: m.catatan,
      aktif: m.aktif,
      totalTransaksi,
      totalOmzet,
      totalLaba,
      totalUnit,
      sisaPiutang,
    };
  });

  return NextResponse.json(data);
});

const skema = z.object({
  nama: z.string().min(1, "Nama mitra wajib diisi"),
  kontak: z.string().optional().nullable(),
  kota: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());

  const mitra = await getPrisma().mitra.create({
    data: {
      nama: body.nama.trim(),
      kontak: body.kontak?.trim() || null,
      kota: body.kota?.trim() || null,
      catatan: body.catatan?.trim() || null,
    },
  });

  await catatAudit(user.id, "CREATE", "Mitra", mitra.id, { nama: mitra.nama });
  return NextResponse.json({ id: mitra.id }, { status: 201 });
});
