import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { importSparepartBatch } from "@/lib/sparepart";

const skemaItem = z.object({
  nama: z.string().min(1, "Nama sparepart wajib diisi"),
  jenis: z.enum(["BATRE", "STRAP", "KACA", "MESIN", "LAINNYA"]),
  satuan: z.string().optional().nullable(),
  minStok: z.number().int().min(0).optional(),
  stokAwal: z.number().int().min(0).optional(),
  hargaBeliSatuan: z.number().min(0).optional(),
  catatan: z.string().optional().nullable(),
});

const skemaImport = z.object({
  items: z.array(skemaItem).min(1, "Minimal 1 sparepart untuk diimport"),
});

export const POST = withAuth(async (req, user) => {
  const body = skemaImport.parse(await req.json());
  const hasil = await importSparepartBatch(body.items);

  await catatAudit(user.id, "IMPORT", "Sparepart", undefined, {
    total: hasil.length,
    daftar: hasil.map((s) => ({ kode: s.kode, nama: s.nama, stok: s.stok })),
  });

  return NextResponse.json({ ok: true, count: hasil.length, data: hasil }, { status: 201 });
});
