import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { withAuth } from "@/lib/api-helpers";

export const GET = withAuth(async () => {
  const wb = XLSX.utils.book_new();

  // Sheet Data Contoh
  const contohData = [
    {
      Brand: "Seiko",
      Model: "SKX007 Diver Automatic",
      "Harga Beli": 2800000,
      "Harga Jual": 3900000,
      Status: "READY",
      Grade: "A",
      "Tanggal Beli": "2026-08-01",
      Box: "Ya",
      Surat: "Ya",
      Buku: "Ya",
      "Extra Link": "Tidak",
      Sertifikat: "Tidak",
      Kondisi: "Mulus 95%, bezel berputar lancar",
      Catatan: "Koleksi lama toko",
    },
    {
      Brand: "Casio",
      Model: "G-Shock DW-5600E",
      "Harga Beli": 450000,
      "Harga Jual": 750000,
      Status: "READY",
      Grade: "B",
      "Tanggal Beli": "2026-08-10",
      Box: "Ya",
      Surat: "Tidak",
      Buku: "Ya",
      "Extra Link": "Tidak",
      Sertifikat: "Tidak",
      Kondisi: "Baret halus pemakaian wajar pada bezel",
      Catatan: "Stok etalase",
    },
    {
      Brand: "Omega",
      Model: "Speedmaster Reduced 3510.50",
      "Harga Beli": 22000000,
      "Harga Jual": 29000000,
      Status: "READY",
      Grade: "A",
      "Tanggal Beli": "2026-07-15",
      Box: "Ya",
      Surat: "Ya",
      Buku: "Ya",
      "Extra Link": "Ya",
      Sertifikat: "Ya",
      Kondisi: "Kondisi istimewa, rantai panjang original",
      Catatan: "Konsinyasi mitra",
    },
    {
      Brand: "Tissot",
      Model: "PRX Powermatic 80 Blue",
      "Harga Beli": 6500000,
      "Harga Jual": 0,
      Status: "MASUK_QC",
      Grade: "",
      "Tanggal Beli": "2026-08-25",
      Box: "Ya",
      Surat: "Ya",
      Buku: "Tidak",
      "Extra Link": "Ya",
      Sertifikat: "Tidak",
      Kondisi: "Belum diperiksa akurasi & power reserve",
      Catatan: "Masuk antrian QC",
    },
  ];

  const wsData = XLSX.utils.json_to_sheet(contohData);
  wsData["!cols"] = [
    { wch: 14 }, // Brand
    { wch: 28 }, // Model
    { wch: 15 }, // Harga Beli
    { wch: 15 }, // Harga Jual
    { wch: 12 }, // Status
    { wch: 8 },  // Grade
    { wch: 14 }, // Tanggal Beli
    { wch: 8 },  // Box
    { wch: 8 },  // Surat
    { wch: 8 },  // Buku
    { wch: 12 }, // Extra Link
    { wch: 12 }, // Sertifikat
    { wch: 35 }, // Kondisi
    { wch: 25 }, // Catatan
  ];
  XLSX.utils.book_append_sheet(wb, wsData, "Template Stok Jam");

  // Sheet Petunjuk Pengisian
  const petunjuk = [
    { Kolom: "Brand", Wajib: "Ya", Keterangan: "Nama brand/merek jam (Contoh: Seiko, Rolex, Casio, Omega)" },
    { Kolom: "Model", Wajib: "Ya", Keterangan: "Tipe / seri model jam (Contoh: SKX007, Submariner Date, PRX)" },
    { Kolom: "Harga Beli", Wajib: "Ya", Keterangan: "Modal beli unit dalam Rupiah angka polos tanpa titik/koma (Contoh: 2500000)" },
    { Kolom: "Harga Jual", Wajib: "Disarankan", Keterangan: "Target harga jual di toko (angka polos). Boleh 0 atau dikosongkan jika status MASUK_QC" },
    { Kolom: "Status", Wajib: "Tidak", Keterangan: "Pilihan: READY (siap jual di inventory) atau MASUK_QC (antrian pemeriksaan). Default: READY" },
    { Kolom: "Grade", Wajib: "Jika READY", Keterangan: "Pilihan: A (mulus), B (wajar pakai), atau C (banyak minus). Default: B jika kosong" },
    { Kolom: "Tanggal Beli", Wajib: "Tidak", Keterangan: "Format YYYY-MM-DD (Contoh: 2026-08-15). Jika kosong menggunakan hari ini" },
    { Kolom: "Box", Wajib: "Tidak", Keterangan: "Apakah ada box fisik? Isi Ya / Tidak (atau 1 / 0). Default: Tidak" },
    { Kolom: "Surat", Wajib: "Tidak", Keterangan: "Apakah ada kartu garansi / surat? Isi Ya / Tidak. Default: Tidak" },
    { Kolom: "Buku", Wajib: "Tidak", Keterangan: "Apakah ada buku manual? Isi Ya / Tidak. Default: Tidak" },
    { Kolom: "Extra Link", Wajib: "Tidak", Keterangan: "Apakah ada sisa sambungan rantai? Isi Ya / Tidak. Default: Tidak" },
    { Kolom: "Sertifikat", Wajib: "Tidak", Keterangan: "Apakah ada sertifikat keaslian? Isi Ya / Tidak. Default: Tidak" },
    { Kolom: "Kondisi", Wajib: "Tidak", Keterangan: "Catatan kondisi fisik jam (misal: baret dial, bezel lecet)" },
    { Kolom: "Catatan", Wajib: "Tidak", Keterangan: "Catatan internal toko atau asal-usul jam" },
  ];
  const wsPetunjuk = XLSX.utils.json_to_sheet(petunjuk);
  wsPetunjuk["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk Pengisian");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template-Import-Stok-Jam.xlsx"',
    },
  });
});
