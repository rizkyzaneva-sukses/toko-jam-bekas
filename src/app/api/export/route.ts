// Export Excel: Laporan L/R, Daftar Stok, Stok Ledger, dan Piutang.
// Dipanggil dari browser sebagai link biasa: /api/export?jenis=lr&bulan=2026-08

import * as XLSX from "xlsx";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, KesalahanBisnis, withAuth } from "@/lib/api-helpers";
import { laporanLabaRugi, ringkasanDashboard } from "@/lib/laporan";
import { ringkasanKas } from "@/lib/kas";
import { namaUnitDariItems } from "@/lib/nama-unit";
import {
  bulanIniWIB,
  formatTanggal,
  labelBulan,
  rentangBulanWIB,
  selisihHari,
  toNumber,
} from "@/lib/utils";
import { LABEL_LEDGER, LABEL_STATUS_BAYAR } from "@/lib/tipe";

export const runtime = "nodejs";

function balasWorkbook(wb: XLSX.WorkBook, namaFile: string) {
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}"`,
    },
  });
}

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis") ?? "lr";
  const bulan = searchParams.get("bulan") || bulanIniWIB();

  if (!/^\d{4}-\d{2}$/.test(bulan)) {
    throw new KesalahanBisnis("Format bulan harus YYYY-MM");
  }

  const wb = XLSX.utils.book_new();
  await catatAudit(user.id, "EXPORT", "Laporan", undefined, { jenis, bulan });

  if (jenis === "lr") {
    const lap = await laporanLabaRugi(bulan);

    const ringkasan = [
      { Keterangan: "Omzet", Nilai: lap.omzet },
      { Keterangan: "Modal (harga beli unit terjual)", Nilai: -lap.modal },
      { Keterangan: "Biaya Service (unit terjual)", Nilai: -lap.biayaService },
      { Keterangan: "Kerugian Barang Rusak", Nilai: -lap.kerugianRusak },
      { Keterangan: "Kerugian Sparepart", Nilai: -lap.kerugianSparepart },
      { Keterangan: "Ongkir ditanggung toko", Nilai: -lap.ongkirToko },
      { Keterangan: "LABA KOTOR BARANG", Nilai: lap.labaKotorBarang },
      { Keterangan: "Biaya Operasional", Nilai: -lap.biayaOperasional },
      { Keterangan: "LABA BERSIH USAHA", Nilai: lap.labaBersihUsaha },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ringkasan), "Ringkasan");

    const biayaRinci = lap.biayaPerKategori.map((k) => ({
      Kategori: k.label,
      Jumlah: k.jumlah,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        biayaRinci.length ? biayaRinci : [{ Info: "Tidak ada biaya operasional" }]
      ),
      "Biaya Operasional"
    );

    const rinci = lap.baris.map((b) => ({
      "No Nota": b.noNota,
      Tanggal: formatTanggal(b.tanggal),
      "Kode Unit": b.kodeUnit,
      Nama: b.namaLengkap,
      Brand: b.brand,
      Model: b.model,
      Pembeli: b.pembeli,
      Tipe: b.tipePembeli,
      "Harga Jual": b.hargaJual,
      "Harga Beli": b.hargaBeli,
      "Biaya Service": b.biayaService,
      HPP: b.hpp,
      Laba: b.laba,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rinci.length ? rinci : [{ Info: "Tidak ada penjualan" }]),
      "Unit Terjual"
    );

    const rusak = lap.rusak.map((r) => ({
      "Kode Unit": r.kodeUnit,
      Brand: r.brand,
      Model: r.model,
      "Kerugian (HPP)": r.hpp,
      Alasan: r.alasan,
      Tanggal: formatTanggal(r.tanggal),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rusak.length ? rusak : [{ Info: "Tidak ada barang rusak" }]),
      "Barang Rusak"
    );

    const dash = await ringkasanDashboard(bulan);
    const produk = dash.rankingProduk.map((p) => ({
      Produk: p.namaDasar,
      Brand: p.brand,
      Model: p.model,
      Terjual: p.unitTerjual,
      Omzet: p.omzet,
      Laba: p.laba,
      "Margin %": Math.round(p.margin * 1000) / 10,
      "Rata-rata Hari Laku": p.rataHariTerjual ?? "",
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        produk.length ? produk : [{ Info: "Tidak ada penjualan" }]
      ),
      "Ranking Produk"
    );

    return balasWorkbook(wb, `Laporan-LR-${bulan}.xlsx`);
  }

  if (jenis === "stok") {
    const units = await getPrisma().unit.findMany({
      where: { status: { in: ["MASUK_QC", "SERVICE", "READY"] } },
      orderBy: [{ status: "asc" }, { kodeUnit: "asc" }],
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
    });

    const rows = units.map((u) => ({
      "Kode Unit": u.kodeUnit,
      Nama: namaUnitDariItems(
        u.brand,
        u.model,
        u.services.flatMap((sv) => sv.items)
      ).namaLengkap,
      Brand: u.brand,
      Model: u.model,
      Status: u.status,
      Grade: u.grade ?? "-",
      "Harga Beli": toNumber(u.hargaBeli),
      "Biaya Service": toNumber(u.totalBiayaService),
      HPP: toNumber(u.hpp),
      "Harga Jual": toNumber(u.hargaJual),
      Margin: toNumber(u.hargaJual) > 0 ? toNumber(u.hargaJual) - toNumber(u.hpp) : 0,
      "Tgl Beli": formatTanggal(u.tglBeli),
      "Tgl Masuk Inventory": u.tglMasukInventory ? formatTanggal(u.tglMasukInventory) : "-",
      "Umur Stok (hari)":
        u.status === "READY" && u.tglMasukInventory ? selisihHari(u.tglMasukInventory) : "",
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "Stok kosong" }]),
      "Stok"
    );
    return balasWorkbook(wb, `Stok-${bulanIniWIB()}.xlsx`);
  }

  if (jenis === "ledger") {
    const { dari, sampai } = rentangBulanWIB(bulan);
    const rows = await getPrisma().stokLedger.findMany({
      where: { tanggal: { gte: dari, lt: sampai } },
      orderBy: { tanggal: "asc" },
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

    const data = rows.map((r) => ({
      Tanggal: formatTanggal(r.tanggal),
      "Kode Unit": r.unit.kodeUnit,
      Nama: namaUnitDariItems(
        r.unit.brand,
        r.unit.model,
        r.unit.services.flatMap((sv) => sv.items)
      ).namaLengkap,
      Brand: r.unit.brand,
      Model: r.unit.model,
      Jenis: LABEL_LEDGER[r.jenis] ?? r.jenis,
      Qty: r.qty,
      Keterangan: r.keterangan ?? "",
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.length ? data : [{ Info: "Tidak ada pergerakan" }]),
      "Stok Ledger"
    );
    return balasWorkbook(wb, `Stok-Ledger-${bulan}.xlsx`);
  }

  if (jenis === "piutang") {
    const notas = await getPrisma().penjualan.findMany({
      where: { statusBayar: { not: "LUNAS" } },
      orderBy: { jatuhTempo: "asc" },
      include: { mitra: { select: { nama: true } } },
    });

    const data = notas.map((n) => {
      const sisa = toNumber(n.totalTagihan) - toNumber(n.totalDibayar);
      return {
        "No Nota": n.noNota,
        Tanggal: formatTanggal(n.tanggal),
        Pembeli: n.mitra?.nama ?? n.namaPembeli ?? "Umum",
        Tipe: n.tipePembeli,
        "Total Tagihan": toNumber(n.totalTagihan),
        "Sudah Dibayar": toNumber(n.totalDibayar),
        "Sisa Piutang": sisa,
        Status: LABEL_STATUS_BAYAR[n.statusBayar],
        "Jatuh Tempo": n.jatuhTempo ? formatTanggal(n.jatuhTempo) : "-",
        "Umur Piutang (hari)": selisihHari(n.tanggal),
      };
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.length ? data : [{ Info: "Tidak ada piutang berjalan" }]),
      "Piutang"
    );
    return balasWorkbook(wb, `Piutang-${bulanIniWIB()}.xlsx`);
  }

  if (jenis === "kas") {
    const ringkasan = await ringkasanKas(bulan);
    const rows = [...ringkasan.baris].reverse().map((b) => ({
      Tanggal: formatTanggal(b.tanggal),
      Jenis: b.label,
      Arah: b.arah === "MASUK" ? "Masuk" : "Keluar",
      Masuk: b.arah === "MASUK" ? b.jumlah : 0,
      Keluar: b.arah === "KELUAR" ? b.jumlah : 0,
      "Saldo Berjalan": b.saldoBerjalan,
      Keterangan: b.keterangan ?? "",
      Sumber: b.otomatis ? "Otomatis" : "Manual",
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Keterangan: "Saldo awal", Nilai: ringkasan.saldoAwal },
        { Keterangan: "Total masuk", Nilai: ringkasan.totalMasuk },
        { Keterangan: "Total keluar", Nilai: -ringkasan.totalKeluar },
        { Keterangan: "Saldo akhir", Nilai: ringkasan.saldoAkhir },
      ]),
      "Ringkasan"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "Tidak ada mutasi kas" }]),
      "Mutasi Kas"
    );
    return balasWorkbook(wb, `Kas-${bulan}.xlsx`);
  }

  if (jenis === "sparepart") {
    const rows = await getPrisma().sparepart.findMany({
      orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    });
    const data = rows.map((s) => ({
      Kode: s.kode,
      Nama: s.nama,
      Jenis: s.jenis,
      Stok: s.stok,
      Satuan: s.satuan,
      "Harga Rata-rata": toNumber(s.hargaRata),
      "Nilai Persediaan": s.stok * toNumber(s.hargaRata),
      "Min Stok": s.minStok,
      Status: s.aktif ? "Aktif" : "Nonaktif",
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.length ? data : [{ Info: "Belum ada sparepart" }]),
      "Sparepart"
    );
    return balasWorkbook(wb, `Sparepart-${bulanIniWIB()}.xlsx`);
  }

  throw new KesalahanBisnis(
    `Jenis export "${jenis}" tidak dikenal. Pilihan: lr, stok, ledger, piutang, kas, sparepart. (${labelBulan(bulan)})`
  );
});
