import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { importStokLamaBatch } from "@/lib/unit";

const skemaItem = z.object({
  brand: z.string().min(1, "Brand wajib diisi"),
  model: z.string().min(1, "Model wajib diisi"),
  hargaBeli: z.number().positive("Harga beli harus lebih dari Rp 0"),
  tglBeli: z.string().min(1, "Tanggal beli wajib diisi"),
  status: z.enum(["READY", "MASUK_QC"]).optional().default("READY"),
  grade: z.enum(["A", "B", "C"]).optional().nullable(),
  hargaJual: z.number().min(0).optional().nullable(),
  tglMasukInventory: z.string().optional().nullable(),
  adaBox: z.boolean().optional().default(false),
  adaSurat: z.boolean().optional().default(false),
  adaBuku: z.boolean().optional().default(false),
  adaExtraLink: z.boolean().optional().default(false),
  adaSertifikat: z.boolean().optional().default(false),
  catatanKondisi: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

const skemaImport = z.object({
  items: z.array(skemaItem).min(1, "Minimal 1 unit untuk diimport"),
});

export const POST = withAuth(async (req, user) => {
  const body = skemaImport.parse(await req.json());

  const items = body.items.map((item) => ({
    brand: item.brand,
    model: item.model,
    hargaBeli: item.hargaBeli,
    tglBeli: new Date(item.tglBeli),
    status: item.status,
    grade: item.grade,
    hargaJual: item.hargaJual,
    tglMasukInventory: item.tglMasukInventory ? new Date(item.tglMasukInventory) : null,
    adaBox: item.adaBox,
    adaSurat: item.adaSurat,
    adaBuku: item.adaBuku,
    adaExtraLink: item.adaExtraLink,
    adaSertifikat: item.adaSertifikat,
    catatanKondisi: item.catatanKondisi,
    catatan: item.catatan,
  }));

  const hasil = await importStokLamaBatch(items);

  await catatAudit(user.id, "IMPORT", "Unit", undefined, {
    total: hasil.length,
    daftar: hasil.map((u) => ({
      kode: u.kodeUnit,
      brand: u.brand,
      model: u.model,
      status: u.status,
      hargaBeli: Number(u.hargaBeli),
    })),
  });

  return NextResponse.json(
    {
      ok: true,
      count: hasil.length,
      data: hasil.map((u) => ({
        id: u.id,
        kodeUnit: u.kodeUnit,
        brand: u.brand,
        model: u.model,
        status: u.status,
      })),
    },
    { status: 201 }
  );
});
