import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { inputStokLama } from "@/lib/unit";

const skemaStokLama = z.object({
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

export const POST = withAuth(async (req, user) => {
  const body = skemaStokLama.parse(await req.json());

  const unit = await inputStokLama({
    brand: body.brand,
    model: body.model,
    hargaBeli: body.hargaBeli,
    tglBeli: new Date(body.tglBeli),
    status: body.status,
    grade: body.grade,
    hargaJual: body.hargaJual,
    tglMasukInventory: body.tglMasukInventory ? new Date(body.tglMasukInventory) : null,
    adaBox: body.adaBox,
    adaSurat: body.adaSurat,
    adaBuku: body.adaBuku,
    adaExtraLink: body.adaExtraLink,
    adaSertifikat: body.adaSertifikat,
    catatanKondisi: body.catatanKondisi,
    catatan: body.catatan,
  });

  await catatAudit(user.id, "CREATE", "Unit", unit.id, {
    aksi: "STOK_LAMA",
    kodeUnit: unit.kodeUnit,
    brand: unit.brand,
    model: unit.model,
    status: unit.status,
    hargaBeli: body.hargaBeli,
    hargaJual: body.hargaJual,
  });

  return NextResponse.json({ ok: true, id: unit.id, kodeUnit: unit.kodeUnit }, { status: 201 });
});
