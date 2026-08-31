import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { withAuth } from "@/lib/api-helpers";

export const GET = withAuth(async () => {
  const wb = XLSX.utils.book_new();

  // Sheet Data Contoh
  const contohData = [
    {
      Nama: "Batre Seiko 371 (SR920SW)",
      Jenis: "BATRE",
      Satuan: "pcs",
      "Min Stok": 5,
      "Stok Awal": 20,
      "Harga Beli Satuan": 15000,
      Catatan: "Supplier Glodok",
    },
    {
      Nama: "Strap Kulit Coklat 20mm",
      Jenis: "STRAP",
      Satuan: "pcs",
      "Min Stok": 3,
      "Stok Awal": 10,
      "Harga Beli Satuan": 45000,
      Catatan: "Model vintage stitching putih",
    },
    {
      Nama: "Kaca Mineral Flat 30mm",
      Jenis: "KACA",
      Satuan: "pcs",
      "Min Stok": 2,
      "Stok Awal": 5,
      "Harga Beli Satuan": 30000,
      Catatan: "Tebal 1.5mm",
    },
    {
      Nama: "Mesin Miyota 2035",
      Jenis: "MESIN",
      Satuan: "pcs",
      "Min Stok": 2,
      "Stok Awal": 0,
      "Harga Beli Satuan": 0,
      Catatan: "Quartz 3 jarum standar",
    },
  ];

  const wsData = XLSX.utils.json_to_sheet(contohData);
  wsData["!cols"] = [
    { wch: 32 }, // Nama
    { wch: 12 }, // Jenis
    { wch: 10 }, // Satuan
    { wch: 12 }, // Min Stok
    { wch: 12 }, // Stok Awal
    { wch: 18 }, // Harga Beli Satuan
    { wch: 30 }, // Catatan
  ];
  XLSX.utils.book_append_sheet(wb, wsData, "Template Sparepart");

  // Sheet Petunjuk Pengisian
  const petunjuk = [
    { Kolom: "Nama", Wajib: "Ya", Keterangan: "Nama lengkap komponen/sparepart (Contoh: Batre Sony 377)" },
    {
      Kolom: "Jenis",
      Wajib: "Ya",
      Keterangan: "Pilih salah satu dari: BATRE, STRAP, KACA, MESIN, LAINNYA (huruf besar/kecil didukung)",
    },
    { Kolom: "Satuan", Wajib: "Tidak", Keterangan: "Satuan unit barang (default: pcs)" },
    { Kolom: "Min Stok", Wajib: "Tidak", Keterangan: "Batas minimum untuk peringatan stok menipis (default: 0)" },
    {
      Kolom: "Stok Awal",
      Wajib: "Tidak",
      Keterangan: "Jumlah stok yang sudah ada di toko saat ini (default: 0)",
    },
    {
      Kolom: "Harga Beli Satuan",
      Wajib: "Jika ada Stok Awal",
      Keterangan: "Harga modal per satuan (dalam Rupiah angka polos). Wajib jika Stok Awal > 0.",
    },
    { Kolom: "Catatan", Wajib: "Tidak", Keterangan: "Catatan tambahan, supplier, atau nomor seri" },
  ];
  const wsPetunjuk = XLSX.utils.json_to_sheet(petunjuk);
  wsPetunjuk["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk Pengisian");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template-Import-Sparepart.xlsx"',
    },
  });
});
