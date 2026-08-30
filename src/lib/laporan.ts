// Agregasi Dashboard & Laporan L/R.
//
// Aturan pengakuan (lihat PRD-toko-jam-bekas.md §7 — jangan diubah tanpa konfirmasi):
//   - Omzet diakui pada TANGGAL TRANSAKSI, bukan saat uang diterima.
//   - Biaya service melekat pada unit dan baru jadi beban SAAT UNIT TERJUAL.
//     Biaya service pada unit yang masih READY = nilai persediaan, bukan beban.
//   - Kerugian write-off diakui PENUH pada tanggal unit dipindah ke RUSAK.
//   - Ongkir yang ditanggung TOKO adalah beban; ongkir pembeli bukan omzet.
//   - Biaya operasional adalah beban PERIODE — diakui pada bulan terjadinya,
//     tidak menunggu barang terjual.

import { getPrisma } from "@/lib/prisma";
import { hitungLabaBersihUsaha, hitungLabaKotorBarang } from "@/lib/hitung";
import { ringkasanBiaya, type RingkasanBiaya } from "@/lib/biaya";
import { modalBersih, saldoKas } from "@/lib/kas";
import { kerugianSparepart, nilaiPersediaanSparepart } from "@/lib/sparepart";
import { namaUnitDariItems } from "@/lib/nama-unit";
import { labelBulan, rentangBulanWIB, selisihHari, toNumber } from "@/lib/utils";

export interface BarisMengendap {
  id: string;
  kodeUnit: string;
  brand: string;
  model: string;
  namaLengkap: string;
  grade: string | null;
  hpp: number;
  hargaJual: number;
  umurHari: number;
}

/**
 * Ranking per model jam. Dikelompokkan memakai NAMA DASAR ("Seiko 1002"),
 * bukan nama lengkap — supaya satu model tidak terpecah hanya karena
 * servicenya berbeda-beda.
 */
export interface BarisRankingProduk {
  namaDasar: string;
  brand: string;
  model: string;
  unitTerjual: number;
  omzet: number;
  laba: number;
  margin: number;
  /** Rata-rata hari dari lolos QC sampai terjual; null kalau tidak terlacak */
  rataHariTerjual: number | null;
}

export interface BarisRankingMitra {
  id: string;
  nama: string;
  kota: string | null;
  omzet: number;
  laba: number;
  unit: number;
  transaksi: number;
}

export interface RingkasanDashboard {
  periode: { bulan: string; label: string };
  omzet: number;
  modal: number;
  biayaService: number;
  kerugianRusak: number;
  kerugianSparepart: number;
  ongkirToko: number;
  /** Laba dari jual-beli barang saja */
  labaKotorBarang: number;
  biayaOperasional: number;
  /** Setelah dikurangi beban menjalankan toko */
  labaBersihUsaha: number;
  unitTerjual: number;
  marginRata: number;
  saldoKas: number;
  nilaiStok: number;
  nilaiPersediaanUnit: number;
  nilaiSparepart: number;
  piutangBerjalan: number;
  piutangTerlewat: number;
  statusUnit: { masukQc: number; service: number; ready: number };
  saluran: {
    b2b: { omzet: number; unit: number; laba: number };
    b2c: { omzet: number; unit: number; laba: number };
  };
  barangMengendap: BarisMengendap[];
  rankingMitra: BarisRankingMitra[];
  rankingProduk: BarisRankingProduk[];
  biayaPerKategori: RingkasanBiaya["perKategori"];
  sparepartMenipis: {
    id: string;
    kode: string;
    nama: string;
    stok: number;
    minStok: number;
    satuan: string;
  }[];
  biayaServiceRinci: {
    id: string;
    kodeUnit: string;
    jenis: string;
    deskripsi: string | null;
    biaya: number;
    dariStok: boolean;
    tanggal: string;
  }[];
  tren: { bulan: string; label: string; omzet: number; laba: number }[];
}

/** Ambil semua angka dashboard untuk satu bulan (format 'YYYY-MM'). */
export async function ringkasanDashboard(bulan: string): Promise<RingkasanDashboard> {
  const prisma = getPrisma();
  const { dari, sampai } = rentangBulanWIB(bulan);

  const [
    penjualan,
    unitRusak,
    unitReady,
    unitBelumTerjual,
    piutang,
    itemService,
    jumlahStatus,
    biaya,
    rugiSparepart,
    kas,
    nilaiSp,
    spMenipis,
  ] = await Promise.all([
    prisma.penjualan.findMany({
      where: { tanggal: { gte: dari, lt: sampai } },
      include: {
        items: {
          include: {
            unit: {
              select: {
                brand: true,
                model: true,
                tglMasukInventory: true,
                tglKeluar: true,
              },
            },
          },
        },
        mitra: { select: { id: true, nama: true, kota: true } },
      },
    }),
    prisma.unit.findMany({
      where: { status: "RUSAK", tglKeluar: { gte: dari, lt: sampai } },
      select: { id: true, kodeUnit: true, hpp: true },
    }),
    prisma.unit.findMany({
      where: { status: "READY" },
      select: {
        id: true,
        kodeUnit: true,
        brand: true,
        model: true,
        grade: true,
        hpp: true,
        hargaJual: true,
        tglMasukInventory: true,
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
      orderBy: { tglMasukInventory: "asc" },
    }),
    prisma.unit.aggregate({
      where: { status: { in: ["MASUK_QC", "SERVICE", "READY"] } },
      _sum: { hpp: true },
    }),
    prisma.penjualan.findMany({
      where: { statusBayar: { not: "LUNAS" } },
      select: { totalTagihan: true, totalDibayar: true, jatuhTempo: true },
    }),
    prisma.serviceItem.findMany({
      where: { createdAt: { gte: dari, lt: sampai } },
      select: {
        id: true,
        jenis: true,
        deskripsi: true,
        biaya: true,
        sparepartId: true,
        createdAt: true,
        service: { select: { unit: { select: { kodeUnit: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.unit.groupBy({ by: ["status"], _count: { _all: true } }),
    ringkasanBiaya(bulan),
    kerugianSparepart(bulan),
    saldoKas(),
    nilaiPersediaanSparepart(),
    prisma.sparepart.findMany({
      where: { aktif: true, minStok: { gt: 0 } },
      select: { id: true, kode: true, nama: true, stok: true, minStok: true, satuan: true },
      orderBy: { stok: "asc" },
    }),
  ]);

  // --- Omzet, modal, dan beban dari unit yang terjual di periode ini ---
  let omzet = 0;
  let modal = 0;
  let biayaService = 0;
  let ongkirToko = 0;
  let unitTerjual = 0;

  const saluran = {
    b2b: { omzet: 0, unit: 0, laba: 0 },
    b2c: { omzet: 0, unit: 0, laba: 0 },
  };
  const perMitra = new Map<string, BarisRankingMitra>();
  const perProduk = new Map<
    string,
    BarisRankingProduk & { totalHari: number; jumlahBerhari: number }
  >();

  for (const nota of penjualan) {
    let omzetNota = 0;
    let labaNota = 0;

    for (const item of nota.items) {
      const hargaJual = toNumber(item.hargaJual);
      const labaItem = toNumber(item.laba);
      omzetNota += hargaJual;
      labaNota += labaItem;
      modal += toNumber(item.hargaBeliSaatJual);
      biayaService += toNumber(item.biayaServiceSaatJual);
      unitTerjual += 1;

      // Ranking produk — kunci pengelompokan memakai nama dasar
      const kunci = `${item.unit.brand}|${item.unit.model}`;
      const baris = perProduk.get(kunci) ?? {
        namaDasar: [item.unit.brand, item.unit.model].filter(Boolean).join(" ").trim(),
        brand: item.unit.brand,
        model: item.unit.model,
        unitTerjual: 0,
        omzet: 0,
        laba: 0,
        margin: 0,
        rataHariTerjual: null,
        totalHari: 0,
        jumlahBerhari: 0,
      };
      baris.unitTerjual += 1;
      baris.omzet += hargaJual;
      baris.laba += labaItem;
      if (item.unit.tglMasukInventory && item.unit.tglKeluar) {
        baris.totalHari += selisihHari(item.unit.tglMasukInventory, item.unit.tglKeluar);
        baris.jumlahBerhari += 1;
      }
      perProduk.set(kunci, baris);
    }

    omzet += omzetNota;

    // Ongkir yang ditanggung toko adalah beban transaksi ini — ikut mengurangi
    // laba salurannya, supaya angka panel B2B/B2C sama dengan laba di nota.
    const ongkirNota = nota.penanggungOngkir === "TOKO" ? toNumber(nota.ongkir) : 0;
    ongkirToko += ongkirNota;
    labaNota -= ongkirNota;

    const ember = nota.tipePembeli === "B2B" ? saluran.b2b : saluran.b2c;
    ember.omzet += omzetNota;
    ember.unit += nota.items.length;
    ember.laba += labaNota;

    if (nota.mitra) {
      const baris = perMitra.get(nota.mitra.id) ?? {
        id: nota.mitra.id,
        nama: nota.mitra.nama,
        kota: nota.mitra.kota,
        omzet: 0,
        laba: 0,
        unit: 0,
        transaksi: 0,
      };
      baris.omzet += omzetNota;
      baris.laba += labaNota;
      baris.unit += nota.items.length;
      baris.transaksi += 1;
      perMitra.set(nota.mitra.id, baris);
    }
  }

  const kerugianRusak = unitRusak.reduce((t, u) => t + toNumber(u.hpp), 0);
  const labaKotorBarang = hitungLabaKotorBarang({
    omzet,
    modal,
    biayaService,
    kerugianRusak,
    kerugianSparepart: rugiSparepart,
    ongkirToko,
  });
  const labaBersihUsaha = hitungLabaBersihUsaha(labaKotorBarang, biaya.total);

  // --- Posisi saat ini (bukan periode) ---
  const nilaiStok = unitReady.reduce((t, u) => t + toNumber(u.hpp), 0);

  const sekarang = new Date();
  let piutangBerjalan = 0;
  let piutangTerlewat = 0;
  for (const p of piutang) {
    const sisa = toNumber(p.totalTagihan) - toNumber(p.totalDibayar);
    if (sisa <= 0) continue;
    piutangBerjalan += sisa;
    if (p.jatuhTempo && p.jatuhTempo < sekarang) piutangTerlewat += sisa;
  }

  const hitungStatus = (status: string) =>
    jumlahStatus.find((s) => s.status === status)?._count._all ?? 0;

  const barangMengendap: BarisMengendap[] = unitReady
    .map((u) => ({
      id: u.id,
      kodeUnit: u.kodeUnit,
      brand: u.brand,
      model: u.model,
      namaLengkap: namaUnitDariItems(
        u.brand,
        u.model,
        u.services.flatMap((sv) => sv.items)
      ).namaLengkap,
      grade: u.grade,
      hpp: toNumber(u.hpp),
      hargaJual: toNumber(u.hargaJual),
      umurHari: selisihHari(u.tglMasukInventory, sekarang),
    }))
    .filter((u) => u.umurHari > 30)
    .sort((a, b) => b.umurHari - a.umurHari);

  const rankingMitra = [...perMitra.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 10);

  const rankingProduk: BarisRankingProduk[] = [...perProduk.values()]
    .map(({ totalHari, jumlahBerhari, ...b }) => ({
      ...b,
      margin: b.omzet > 0 ? b.laba / b.omzet : 0,
      rataHariTerjual: jumlahBerhari > 0 ? Math.round(totalHari / jumlahBerhari) : null,
    }))
    .sort((a, b) => b.omzet - a.omzet);

  // --- Tren 6 bulan terakhir ---
  const bulanTren: string[] = [];
  const [th, bl] = bulan.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(th, bl - 1 - i, 1));
    bulanTren.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const awalTren = rentangBulanWIB(bulanTren[0]).dari;

  const [notaTren, rusakTren, biayaTren, rugiSpTren] = await Promise.all([
    prisma.penjualan.findMany({
      where: { tanggal: { gte: awalTren, lt: sampai } },
      select: {
        tanggal: true,
        ongkir: true,
        penanggungOngkir: true,
        items: { select: { hargaJual: true, laba: true } },
      },
    }),
    prisma.unit.findMany({
      where: { status: "RUSAK", tglKeluar: { gte: awalTren, lt: sampai } },
      select: { tglKeluar: true, hpp: true },
    }),
    prisma.biayaOperasional.findMany({
      where: { tanggal: { gte: awalTren, lt: sampai } },
      select: { tanggal: true, jumlah: true },
    }),
    prisma.mutasiSparepart.findMany({
      where: { jenis: "PENYESUAIAN_KURANG", tanggal: { gte: awalTren, lt: sampai } },
      select: { tanggal: true, total: true },
    }),
  ]);

  const emberTren = new Map(bulanTren.map((b) => [b, { omzet: 0, laba: 0 }]));
  const kunciBulan = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      timeZone: "Asia/Jakarta",
    })
      .format(d)
      .slice(0, 7);

  for (const nota of notaTren) {
    const e = emberTren.get(kunciBulan(nota.tanggal));
    if (!e) continue;
    for (const item of nota.items) {
      e.omzet += toNumber(item.hargaJual);
      e.laba += toNumber(item.laba);
    }
    if (nota.penanggungOngkir === "TOKO") e.laba -= toNumber(nota.ongkir);
  }
  for (const u of rusakTren) {
    if (!u.tglKeluar) continue;
    const e = emberTren.get(kunciBulan(u.tglKeluar));
    if (e) e.laba -= toNumber(u.hpp);
  }
  for (const b of biayaTren) {
    const e = emberTren.get(kunciBulan(b.tanggal));
    if (e) e.laba -= toNumber(b.jumlah);
  }
  for (const sp of rugiSpTren) {
    const e = emberTren.get(kunciBulan(sp.tanggal));
    if (e) e.laba -= toNumber(sp.total);
  }

  return {
    periode: { bulan, label: labelBulan(bulan) },
    omzet,
    modal,
    biayaService,
    kerugianRusak,
    kerugianSparepart: rugiSparepart,
    ongkirToko,
    labaKotorBarang,
    biayaOperasional: biaya.total,
    labaBersihUsaha,
    unitTerjual,
    marginRata: omzet > 0 ? (omzet - modal - biayaService) / omzet : 0,
    saldoKas: kas,
    nilaiStok,
    nilaiPersediaanUnit: toNumber(unitBelumTerjual._sum.hpp),
    nilaiSparepart: nilaiSp,
    piutangBerjalan,
    piutangTerlewat,
    statusUnit: {
      masukQc: hitungStatus("MASUK_QC"),
      service: hitungStatus("SERVICE"),
      ready: hitungStatus("READY"),
    },
    saluran,
    barangMengendap,
    rankingMitra,
    rankingProduk,
    biayaPerKategori: biaya.perKategori,
    sparepartMenipis: spMenipis.filter((s) => s.stok <= s.minStok),
    biayaServiceRinci: itemService.map((i) => ({
      id: i.id,
      kodeUnit: i.service.unit.kodeUnit,
      jenis: i.jenis,
      deskripsi: i.deskripsi,
      biaya: toNumber(i.biaya),
      dariStok: !!i.sparepartId,
      tanggal: i.createdAt.toISOString(),
    })),
    tren: bulanTren.map((b) => ({
      bulan: b,
      label: labelBulan(b),
      omzet: emberTren.get(b)?.omzet ?? 0,
      laba: emberTren.get(b)?.laba ?? 0,
    })),
  };
}

export interface BarisLaporanUnit {
  noNota: string;
  tanggal: string;
  kodeUnit: string;
  brand: string;
  model: string;
  namaLengkap: string;
  pembeli: string;
  tipePembeli: string;
  hargaJual: number;
  hargaBeli: number;
  biayaService: number;
  hpp: number;
  laba: number;
}

export interface LaporanLabaRugi {
  periode: { bulan: string; label: string };
  omzet: number;
  modal: number;
  biayaService: number;
  kerugianRusak: number;
  kerugianSparepart: number;
  ongkirToko: number;
  labaKotorBarang: number;
  biayaOperasional: number;
  labaBersihUsaha: number;
  biayaPerKategori: RingkasanBiaya["perKategori"];
  baris: BarisLaporanUnit[];
  rusak: {
    kodeUnit: string;
    brand: string;
    model: string;
    hpp: number;
    alasan: string;
    tanggal: string;
  }[];
}

/** Laporan L/R rinci per unit terjual dalam satu bulan. */
export async function laporanLabaRugi(bulan: string): Promise<LaporanLabaRugi> {
  const prisma = getPrisma();
  const { dari, sampai } = rentangBulanWIB(bulan);

  const [penjualan, rusak, biaya, rugiSparepart] = await Promise.all([
    prisma.penjualan.findMany({
      where: { tanggal: { gte: dari, lt: sampai } },
      include: {
        mitra: { select: { nama: true } },
        items: {
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
        },
      },
      orderBy: { tanggal: "asc" },
    }),
    prisma.unit.findMany({
      where: { status: "RUSAK", tglKeluar: { gte: dari, lt: sampai } },
      select: {
        kodeUnit: true,
        brand: true,
        model: true,
        hpp: true,
        alasanRusak: true,
        tglKeluar: true,
      },
      orderBy: { tglKeluar: "asc" },
    }),
    ringkasanBiaya(bulan),
    kerugianSparepart(bulan),
  ]);

  const baris: BarisLaporanUnit[] = [];
  let omzet = 0;
  let modal = 0;
  let biayaService = 0;
  let ongkirToko = 0;

  for (const nota of penjualan) {
    if (nota.penanggungOngkir === "TOKO") ongkirToko += toNumber(nota.ongkir);
    for (const item of nota.items) {
      omzet += toNumber(item.hargaJual);
      modal += toNumber(item.hargaBeliSaatJual);
      biayaService += toNumber(item.biayaServiceSaatJual);
      baris.push({
        noNota: nota.noNota,
        tanggal: nota.tanggal.toISOString(),
        kodeUnit: item.unit.kodeUnit,
        brand: item.unit.brand,
        model: item.unit.model,
        namaLengkap: namaUnitDariItems(
          item.unit.brand,
          item.unit.model,
          item.unit.services.flatMap((sv) => sv.items)
        ).namaLengkap,
        pembeli: nota.mitra?.nama ?? nota.namaPembeli ?? "Umum",
        tipePembeli: nota.tipePembeli,
        hargaJual: toNumber(item.hargaJual),
        hargaBeli: toNumber(item.hargaBeliSaatJual),
        biayaService: toNumber(item.biayaServiceSaatJual),
        hpp: toNumber(item.hppSaatJual),
        laba: toNumber(item.laba),
      });
    }
  }

  const kerugianRusak = rusak.reduce((t, u) => t + toNumber(u.hpp), 0);
  const labaKotorBarang = hitungLabaKotorBarang({
    omzet,
    modal,
    biayaService,
    kerugianRusak,
    kerugianSparepart: rugiSparepart,
    ongkirToko,
  });

  return {
    periode: { bulan, label: labelBulan(bulan) },
    omzet,
    modal,
    biayaService,
    kerugianRusak,
    kerugianSparepart: rugiSparepart,
    ongkirToko,
    labaKotorBarang,
    biayaOperasional: biaya.total,
    labaBersihUsaha: hitungLabaBersihUsaha(labaKotorBarang, biaya.total),
    biayaPerKategori: biaya.perKategori,
    baris,
    rusak: rusak.map((u) => ({
      kodeUnit: u.kodeUnit,
      brand: u.brand,
      model: u.model,
      hpp: toNumber(u.hpp),
      alasan: u.alasanRusak ?? "-",
      tanggal: u.tglKeluar?.toISOString() ?? "",
    })),
  };
}

export interface PosisiKeuangan {
  saldoKas: number;
  nilaiPersediaanUnit: number;
  nilaiPersediaanSparepart: number;
  piutang: number;
  totalAset: number;
  modalDisetor: number;
  prive: number;
  labaKumulatif: number;
  saldoKasSeharusnya: number;
  selisih: number;
}

/**
 * Posisi keuangan sejak app mulai dipakai, beserta pemeriksaan silang:
 * saldo kas sesungguhnya harus sama dengan saldo yang dihitung dari
 * modal, laba, persediaan, dan piutang.
 */
export async function posisiKeuangan(): Promise<PosisiKeuangan> {
  const prisma = getPrisma();

  const [kas, persediaanUnit, persediaanSp, notaBelumLunas, modal, agregat, biayaTotal, rugiSp] =
    await Promise.all([
      saldoKas(),
      prisma.unit.aggregate({
        where: { status: { in: ["MASUK_QC", "SERVICE", "READY"] } },
        _sum: { hpp: true },
      }),
      nilaiPersediaanSparepart(),
      prisma.penjualan.findMany({
        where: { statusBayar: { not: "LUNAS" } },
        select: { totalTagihan: true, totalDibayar: true },
      }),
      modalBersih(),
      prisma.penjualanItem.aggregate({
        _sum: { hargaJual: true, hargaBeliSaatJual: true, biayaServiceSaatJual: true },
      }),
      prisma.biayaOperasional.aggregate({ _sum: { jumlah: true } }),
      prisma.mutasiSparepart.aggregate({
        where: { jenis: "PENYESUAIAN_KURANG" },
        _sum: { total: true },
      }),
    ]);

  const [rusakTotal, ongkirTotal] = await Promise.all([
    prisma.unit.aggregate({ where: { status: "RUSAK" }, _sum: { hpp: true } }),
    prisma.penjualan.aggregate({
      where: { penanggungOngkir: "TOKO" },
      _sum: { ongkir: true },
    }),
  ]);

  const piutang = notaBelumLunas.reduce((t, n) => {
    const sisa = toNumber(n.totalTagihan) - toNumber(n.totalDibayar);
    return t + (sisa > 0 ? sisa : 0);
  }, 0);

  const labaKotor = hitungLabaKotorBarang({
    omzet: toNumber(agregat._sum.hargaJual),
    modal: toNumber(agregat._sum.hargaBeliSaatJual),
    biayaService: toNumber(agregat._sum.biayaServiceSaatJual),
    kerugianRusak: toNumber(rusakTotal._sum.hpp),
    kerugianSparepart: toNumber(rugiSp._sum.total),
    ongkirToko: toNumber(ongkirTotal._sum.ongkir),
  });
  const labaKumulatif = hitungLabaBersihUsaha(labaKotor, toNumber(biayaTotal._sum.jumlah));

  const nilaiUnit = toNumber(persediaanUnit._sum.hpp);
  const seharusnya =
    modal.disetor - modal.prive + labaKumulatif - (nilaiUnit + persediaanSp) - piutang;

  return {
    saldoKas: kas,
    nilaiPersediaanUnit: nilaiUnit,
    nilaiPersediaanSparepart: persediaanSp,
    piutang,
    totalAset: kas + nilaiUnit + persediaanSp + piutang,
    modalDisetor: modal.disetor,
    prive: modal.prive,
    labaKumulatif,
    saldoKasSeharusnya: seharusnya,
    selisih: kas - seharusnya,
  };
}
