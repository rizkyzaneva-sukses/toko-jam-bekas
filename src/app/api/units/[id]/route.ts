import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, KesalahanBisnis, withAuth } from "@/lib/api-helpers";
import { hapusUnit } from "@/lib/unit";
import { namaUnitDariItems } from "@/lib/nama-unit";
import { selisihHari, toNumber } from "@/lib/utils";
import type { UnitDetail } from "@/lib/tipe";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth<Ctx>(async (_req, _user, ctx) => {
  const { id } = await ctx.params;

  const u = await getPrisma().unit.findUnique({
    where: { id },
    include: {
      qcRecords: { orderBy: { tanggal: "desc" } },
      services: {
        orderBy: { tglMasuk: "desc" },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: { sparepart: { select: { nama: true } } },
          },
        },
      },
      ledger: { orderBy: { tanggal: "desc" } },
      penjualanItem: {
        include: {
          penjualan: { include: { mitra: { select: { nama: true } } } },
        },
      },
    },
  });

  if (!u) throw new KesalahanBisnis("Unit tidak ditemukan", 404);

  const hpp = toNumber(u.hpp);
  const hargaJual = toNumber(u.hargaJual);

  // Riwayat service urut waktu — sumber imbuhan nama unit
  const itemUrut = [...u.services]
    .sort((a, b) => a.tglMasuk.getTime() - b.tglMasuk.getTime())
    .flatMap((sv) => sv.items);

  const detail: UnitDetail = {
    id: u.id,
    kodeUnit: u.kodeUnit,
    brand: u.brand,
    model: u.model,
    ...namaUnitDariItems(u.brand, u.model, itemUrut),
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
      u.status === "READY" && u.tglMasukInventory ? selisihHari(u.tglMasukInventory) : null,
    alasanRusak: u.alasanRusak,
    catatan: u.catatan,
    catatanKondisi: u.catatanKondisi,
    adaBox: u.adaBox,
    adaSurat: u.adaSurat,
    adaBuku: u.adaBuku,
    adaExtraLink: u.adaExtraLink,
    adaSertifikat: u.adaSertifikat,
    qcRecords: u.qcRecords.map((q) => ({
      id: q.id,
      hasil: q.hasil,
      keterangan: q.keterangan,
      tanggal: q.tanggal.toISOString(),
    })),
    services: u.services.map((s) => ({
      id: s.id,
      status: s.status,
      totalBiaya: toNumber(s.totalBiaya),
      catatan: s.catatan,
      tglMasuk: s.tglMasuk.toISOString(),
      tglSelesai: s.tglSelesai?.toISOString() ?? null,
      items: s.items.map((i) => ({
        id: i.id,
        jenis: i.jenis,
        deskripsi: i.deskripsi,
        biaya: toNumber(i.biaya),
        dariStok: !!i.sparepartId,
        qty: i.qty,
        namaSparepart: i.sparepart?.nama ?? null,
      })),
    })),
    ledger: u.ledger.map((l) => ({
      id: l.id,
      jenis: l.jenis,
      qty: l.qty,
      keterangan: l.keterangan,
      tanggal: l.tanggal.toISOString(),
    })),
    penjualan: u.penjualanItem
      ? {
          noNota: u.penjualanItem.penjualan.noNota,
          tanggal: u.penjualanItem.penjualan.tanggal.toISOString(),
          pembeli:
            u.penjualanItem.penjualan.mitra?.nama ??
            u.penjualanItem.penjualan.namaPembeli ??
            "Umum",
          tipePembeli: u.penjualanItem.penjualan.tipePembeli,
          hargaJual: toNumber(u.penjualanItem.hargaJual),
          hppSaatJual: toNumber(u.penjualanItem.hppSaatJual),
          laba: toNumber(u.penjualanItem.laba),
        }
      : null,
  };

  return NextResponse.json(detail);
});

export const DELETE = withAuth<Ctx>(async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const unit = await hapusUnit(id);
  await catatAudit(user.id, "DELETE", "Unit", id, { kodeUnit: unit.kodeUnit });
  return NextResponse.json({ ok: true });
});
