import { NextResponse } from "next/server";
import { z } from "zod";
import { catatAudit, withAuth } from "@/lib/api-helpers";
import { isiStokSparepart, sesuaikanStokSparepart } from "@/lib/sparepart";
import { tanggalInputKeDate } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

const skemaIsi = z.object({
  aksi: z.literal("ISI"),
  qty: z.number().int().positive("Jumlah harus lebih dari 0"),
  hargaSatuan: z.number().positive("Harga satuan harus lebih dari Rp 0"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional().nullable(),
});

const skemaOpname = z.object({
  aksi: z.literal("OPNAME"),
  stokBaru: z.number().int().min(0, "Stok tidak boleh negatif"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().min(1, "Alasan penyesuaian wajib diisi"),
});

const skema = z.discriminatedUnion("aksi", [skemaIsi, skemaOpname]);

/** Pengisian stok (uang keluar) atau stok opname (koreksi jumlah). */
export const POST = withAuth<Ctx>(async (req, user, ctx) => {
  const { id } = await ctx.params;
  const body = skema.parse(await req.json());

  if (body.aksi === "ISI") {
    const mutasi = await isiStokSparepart(id, {
      qty: body.qty,
      hargaSatuan: body.hargaSatuan,
      tanggal: tanggalInputKeDate(body.tanggal),
      keterangan: body.keterangan,
    });
    await catatAudit(user.id, "CREATE", "MutasiSparepart", mutasi.id, {
      aksi: "ISI_STOK",
      sparepartId: id,
      qty: body.qty,
      total: mutasi.total.toString(),
    });
    return NextResponse.json({ ok: true, stokSesudah: mutasi.stokSesudah }, { status: 201 });
  }

  const mutasi = await sesuaikanStokSparepart(
    id,
    body.stokBaru,
    tanggalInputKeDate(body.tanggal),
    body.keterangan
  );
  await catatAudit(user.id, "UPDATE", "MutasiSparepart", mutasi.id, {
    aksi: "OPNAME",
    sparepartId: id,
    stokBaru: body.stokBaru,
  });
  return NextResponse.json({ ok: true, stokSesudah: mutasi.stokSesudah });
});
