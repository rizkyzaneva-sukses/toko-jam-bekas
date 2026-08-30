// Logika penjualan: pembuatan nota, penguncian laba per unit, dan piutang.

import {
  Prisma,
  type ChannelJual,
  type MetodeBayar,
  type PenanggungOngkir,
  type TipePembeli,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { KesalahanBisnis } from "@/lib/api-helpers";
import { catatKasOtomatis } from "@/lib/kas";
import { hitungStatusBayar, hitungTotalTagihan } from "@/lib/hitung";
import { nomorBerikutnya } from "@/lib/unit";
import { tanggalWIB } from "@/lib/utils";

export interface ItemPenjualanInput {
  unitId: string;
  hargaJual: number;
}

export interface DataPenjualan {
  tanggal: Date;
  tipePembeli: TipePembeli;
  mitraId?: string | null;
  namaPembeli?: string | null;
  channel: ChannelJual;
  items: ItemPenjualanInput[];
  ongkir: number;
  penanggungOngkir: PenanggungOngkir;
  metodeBayar: MetodeBayar;
  /// Untuk metode PIUTANG: DP yang dibayar di muka (boleh 0)
  dibayar?: number;
  jatuhTempo?: Date | null;
  catatan?: string | null;
}

export async function buatPenjualan(data: DataPenjualan) {
  if (data.items.length === 0) {
    throw new KesalahanBisnis("Minimal satu unit harus dipilih");
  }
  if (data.tipePembeli === "B2B" && !data.mitraId) {
    throw new KesalahanBisnis("Mitra wajib dipilih untuk penjualan B2B");
  }
  if (data.ongkir < 0) throw new KesalahanBisnis("Ongkir tidak boleh negatif");

  const idUnik = new Set(data.items.map((i) => i.unitId));
  if (idUnik.size !== data.items.length) {
    throw new KesalahanBisnis("Ada unit yang dipilih lebih dari sekali");
  }
  for (const item of data.items) {
    if (item.hargaJual <= 0) throw new KesalahanBisnis("Harga jual harus lebih dari Rp 0");
  }

  return getPrisma().$transaction(async (tx) => {
    const units = await tx.unit.findMany({
      where: { id: { in: data.items.map((i) => i.unitId) } },
      select: {
        id: true,
        kodeUnit: true,
        status: true,
        hpp: true,
        hargaBeli: true,
        totalBiayaService: true,
      },
    });

    if (units.length !== data.items.length) {
      throw new KesalahanBisnis("Ada unit yang tidak ditemukan");
    }
    const belumSiap = units.filter((u) => u.status !== "READY");
    if (belumSiap.length > 0) {
      throw new KesalahanBisnis(
        `Unit berikut tidak siap dijual: ${belumSiap
          .map((u) => `${u.kodeUnit} (${u.status})`)
          .join(", ")}`
      );
    }

    if (data.mitraId) {
      const mitra = await tx.mitra.findUnique({ where: { id: data.mitraId } });
      if (!mitra) throw new KesalahanBisnis("Mitra tidak ditemukan", 404);
    }

    const subtotal = data.items.reduce((t, i) => t + i.hargaJual, 0);
    const totalTagihan = hitungTotalTagihan(subtotal, data.ongkir, data.penanggungOngkir);

    let totalDibayar: number;
    if (data.metodeBayar === "CASH") {
      totalDibayar = totalTagihan;
    } else {
      totalDibayar = data.dibayar ?? 0;
      if (totalDibayar < 0) throw new KesalahanBisnis("Jumlah dibayar tidak boleh negatif");
      if (totalDibayar > totalTagihan) {
        throw new KesalahanBisnis("Jumlah dibayar melebihi total tagihan");
      }
      if (!data.jatuhTempo) {
        throw new KesalahanBisnis("Jatuh tempo wajib diisi untuk pembayaran piutang");
      }
    }

    const periode = tanggalWIB(data.tanggal).slice(0, 7).replace("-", "");
    const urut = await nomorBerikutnya(tx, `NOTA:${periode}`);
    const noNota = `INV-${periode}-${String(urut).padStart(3, "0")}`;

    const penjualan = await tx.penjualan.create({
      data: {
        noNota,
        tanggal: data.tanggal,
        tipePembeli: data.tipePembeli,
        mitraId: data.tipePembeli === "B2B" ? data.mitraId : null,
        namaPembeli: data.tipePembeli === "B2C" ? data.namaPembeli?.trim() || null : null,
        channel: data.channel,
        subtotal: new Prisma.Decimal(subtotal),
        ongkir: new Prisma.Decimal(data.ongkir),
        penanggungOngkir: data.penanggungOngkir,
        totalTagihan: new Prisma.Decimal(totalTagihan),
        totalDibayar: new Prisma.Decimal(totalDibayar),
        metodeBayar: data.metodeBayar,
        statusBayar: hitungStatusBayar(totalTagihan, totalDibayar),
        jatuhTempo: data.metodeBayar === "PIUTANG" ? data.jatuhTempo : null,
        catatan: data.catatan?.trim() || null,
      },
    });

    for (const item of data.items) {
      const unit = units.find((u) => u.id === item.unitId)!;
      const hpp = Number(unit.hpp);

      await tx.penjualanItem.create({
        data: {
          penjualanId: penjualan.id,
          unitId: unit.id,
          hargaJual: new Prisma.Decimal(item.hargaJual),
          hppSaatJual: unit.hpp,
          hargaBeliSaatJual: unit.hargaBeli,
          biayaServiceSaatJual: unit.totalBiayaService,
          laba: new Prisma.Decimal(item.hargaJual - hpp),
        },
      });

      await tx.unit.update({
        where: { id: unit.id },
        data: {
          status: "TERJUAL",
          tglKeluar: data.tanggal,
          hargaJual: new Prisma.Decimal(item.hargaJual),
        },
      });

      await tx.stokLedger.create({
        data: {
          unitId: unit.id,
          jenis: "KELUAR_JUAL",
          qty: -1,
          tanggal: data.tanggal,
          referensiId: penjualan.id,
          keterangan: `Terjual di nota ${noNota}`,
        },
      });
    }

    if (totalDibayar > 0) {
      await tx.pembayaran.create({
        data: {
          penjualanId: penjualan.id,
          jumlah: new Prisma.Decimal(totalDibayar),
          tanggal: data.tanggal,
          catatan: data.metodeBayar === "CASH" ? "Pelunasan cash" : "DP awal",
        },
      });

      await catatKasOtomatis(tx, {
        tanggal: data.tanggal,
        jenis: "PENJUALAN",
        jumlah: totalDibayar,
        keterangan: `${noNota} — ${data.metodeBayar === "CASH" ? "lunas cash" : "DP"}`,
        referensiTipe: "Penjualan",
        referensiId: penjualan.id,
      });
    }

    // Ongkir yang ditanggung toko adalah uang yang benar-benar keluar.
    if (data.penanggungOngkir === "TOKO" && data.ongkir > 0) {
      await catatKasOtomatis(tx, {
        tanggal: data.tanggal,
        jenis: "ONGKIR_TOKO",
        jumlah: data.ongkir,
        keterangan: `Ongkir nota ${noNota}`,
        referensiTipe: "Penjualan",
        referensiId: penjualan.id,
      });
    }

    return penjualan;
  });
}

/** Catat cicilan / pelunasan piutang. */
export async function catatPembayaran(
  penjualanId: string,
  jumlah: number,
  tanggal: Date,
  catatan?: string | null
) {
  if (jumlah <= 0) throw new KesalahanBisnis("Jumlah pembayaran harus lebih dari Rp 0");

  return getPrisma().$transaction(async (tx) => {
    const penjualan = await tx.penjualan.findUnique({ where: { id: penjualanId } });
    if (!penjualan) throw new KesalahanBisnis("Transaksi tidak ditemukan", 404);

    const totalTagihan = Number(penjualan.totalTagihan);
    const totalDibayar = Number(penjualan.totalDibayar);
    const sisa = totalTagihan - totalDibayar;

    if (sisa <= 0) throw new KesalahanBisnis("Transaksi ini sudah lunas");
    if (jumlah > sisa) {
      throw new KesalahanBisnis(
        `Jumlah melebihi sisa piutang. Sisa tagihan hanya Rp ${sisa.toLocaleString("id-ID")}`
      );
    }

    await tx.pembayaran.create({
      data: {
        penjualanId,
        jumlah: new Prisma.Decimal(jumlah),
        tanggal,
        catatan: catatan?.trim() || null,
      },
    });

    await catatKasOtomatis(tx, {
      tanggal,
      jenis: "PELUNASAN_PIUTANG",
      jumlah,
      keterangan: `${penjualan.noNota}${catatan?.trim() ? ` — ${catatan.trim()}` : ""}`,
      referensiTipe: "Penjualan",
      referensiId: penjualanId,
    });

    const dibayarBaru = totalDibayar + jumlah;
    return tx.penjualan.update({
      where: { id: penjualanId },
      data: {
        totalDibayar: new Prisma.Decimal(dibayarBaru),
        statusBayar: hitungStatusBayar(totalTagihan, dibayarBaru),
      },
    });
  });
}
