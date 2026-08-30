// Reset semua data transaksi (kecuali users & audit_logs)
// Hanya bisa diakses oleh OWNER

import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-helpers";
import { getPrisma } from "@/lib/prisma";

export const POST = withRole(["OWNER"], async (_req, user) => {
  const prisma = getPrisma();

  // Konfirmasi dari body
  const body = await _req.json();
  if (body.konfirmasi !== "RESET") {
    return NextResponse.json(
      { error: 'Ketik "RESET" untuk konfirmasi' },
      { status: 400 }
    );
  }

  // Hapus dalam urutan yang benar (foreign key constraints)
  // Semua dalam 1 transaksi supaya atomic
  const result = await prisma.$transaction(async (tx) => {
    // 1. Hapus data transaksi (child tables first)
    const penjualanItems = await tx.penjualanItem.deleteMany();
    const pembayaran = await tx.pembayaran.deleteMany();
    const penjualan = await tx.penjualan.deleteMany();

    // 2. Hapus service & QC
    const serviceItems = await tx.serviceItem.deleteMany();
    const services = await tx.service.deleteMany();
    const qcRecords = await tx.qcRecord.deleteMany();

    // 3. Hapus stok ledger & mutasi sparepart
    const stokLedger = await tx.stokLedger.deleteMany();
    const mutasiSparepart = await tx.mutasiSparepart.deleteMany();

    // 4. Hapus kas entries
    const kasEntries = await tx.kasEntry.deleteMany();

    // 5. Hapus biaya operasional
    const biayaOperasional = await tx.biayaOperasional.deleteMany();

    // 6. Hapus units & spareparts
    const units = await tx.unit.deleteMany();
    const spareparts = await tx.sparepart.deleteMany();

    // 7. Hapus mitra
    const mitra = await tx.mitra.deleteMany();

    // 8. Reset counters
    const counters = await tx.counter.deleteMany();

    return {
      penjualanItems: penjualanItems.count,
      pembayaran: pembayaran.count,
      penjualan: penjualan.count,
      serviceItems: serviceItems.count,
      services: services.count,
      qcRecords: qcRecords.count,
      stokLedger: stokLedger.count,
      mutasiSparepart: mutasiSparepart.count,
      kasEntries: kasEntries.count,
      biayaOperasional: biayaOperasional.count,
      units: units.count,
      spareparts: spareparts.count,
      mitra: mitra.count,
      counters: counters.count,
    };
  });

  // Catat audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      aksi: "RESET",
      entitas: "SYSTEM",
      detail: {
        message: "Reset semua data transaksi",
        deleted: result,
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: "Semua data transaksi berhasil dihapus",
    deleted: result,
  });
});
