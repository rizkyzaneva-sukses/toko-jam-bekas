import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { prosesQc } from "@/lib/unit";
import { namaUnitDariItems } from "@/lib/nama-unit";
import { toNumber } from "@/lib/utils";

/** Antrian QC: semua unit berstatus MASUK_QC. */
export const GET = withAuth(async () => {
  const units = await getPrisma().unit.findMany({
    where: { status: "MASUK_QC" },
    orderBy: { createdAt: "asc" },
    include: {
      services: {
        orderBy: { tglMasuk: "asc" },
        include: { items: { orderBy: { createdAt: "asc" } } },
      },
      qcRecords: { orderBy: { tanggal: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(
    units.map((u) => ({
      id: u.id,
      kodeUnit: u.kodeUnit,
      brand: u.brand,
      model: u.model,
      ...namaUnitDariItems(
        u.brand,
        u.model,
        u.services.flatMap((sv) => sv.items)
      ),
      hargaBeli: toNumber(u.hargaBeli),
      totalBiayaService: toNumber(u.totalBiayaService),
      hpp: toNumber(u.hpp),
      tglBeli: u.tglBeli.toISOString(),
      catatan: u.catatan,
      pernahService: u.services.length > 0,
      qcTerakhir: u.qcRecords[0]
        ? { hasil: u.qcRecords[0].hasil, keterangan: u.qcRecords[0].keterangan }
        : null,
    }))
  );
});

const skema = z
  .object({
    unitId: z.string().min(1),
    hasil: z.enum(["LOLOS", "GAGAL"]),
    keterangan: z.string().optional().nullable(),
    grade: z.enum(["A", "B", "C"]).optional().nullable(),
    hargaJual: z.number().optional().nullable(),
    catatanKondisi: z.string().optional().nullable(),
    adaBox: z.boolean().optional(),
    adaSurat: z.boolean().optional(),
    adaBuku: z.boolean().optional(),
    adaExtraLink: z.boolean().optional(),
    adaSertifikat: z.boolean().optional(),
  })
  .refine((d) => d.hasil !== "LOLOS" || !!d.grade, {
    message: "Grade wajib diisi saat QC lolos",
    path: ["grade"],
  })
  .refine((d) => d.hasil !== "LOLOS" || (d.hargaJual ?? 0) > 0, {
    message: "Harga jual wajib diisi saat QC lolos",
    path: ["hargaJual"],
  })
  .refine((d) => d.hasil !== "GAGAL" || !!d.keterangan?.trim(), {
    message: "Keterangan masalah wajib diisi saat QC gagal",
    path: ["keterangan"],
  });

export const POST = withAuth(async (req, user) => {
  const body = skema.parse(await req.json());
  const unit = await prosesQc(body);

  await catatAudit(user.id, "UPDATE", "Unit", unit.id, {
    aksi: `QC_${body.hasil}`,
    kodeUnit: unit.kodeUnit,
    grade: body.grade,
    hargaJual: body.hargaJual,
  });

  return NextResponse.json({ ok: true, kodeUnit: unit.kodeUnit, status: unit.status });
});
