// Mengisi buku kas dari transaksi yang sudah ada sebelum modul Kas dipasang.
// Jalankan SEKALI SAJA setelah migrasi: npm run db:backfill-kas
//
// Script menolak berjalan kalau buku kas sudah terisi, supaya tidak membuat
// baris ganda. Untuk database baru, script ini tidak perlu dijalankan.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const rp = (n: unknown) => "Rp " + Number(n).toLocaleString("id-ID");

async function main() {
  const sudahAda = await prisma.kasEntry.count();
  if (sudahAda > 0 && !process.argv.includes("--force")) {
    console.log(
      `Buku kas sudah berisi ${sudahAda} baris. Script dihentikan supaya tidak ada baris ganda.`
    );
    console.log("Kalau memang ingin mengulang, kosongkan dulu tabel kas_entries.");
    return;
  }

  let dibuat = 0;

  // 1. Pembelian unit
  const units = await prisma.unit.findMany({
    select: { id: true, kodeUnit: true, brand: true, model: true, hargaBeli: true, tglBeli: true },
  });
  for (const u of units) {
    await prisma.kasEntry.create({
      data: {
        tanggal: u.tglBeli,
        jenis: "BELI_UNIT",
        arah: "KELUAR",
        jumlah: u.hargaBeli,
        keterangan: `${u.kodeUnit} — ${u.brand} ${u.model}`,
        referensiTipe: "Unit",
        referensiId: u.id,
        otomatis: true,
      },
    });
    dibuat++;
  }
  console.log(`✓ ${units.length} pembelian unit`);

  // 2. Biaya service yang dibeli langsung (bukan dari stok sparepart)
  const items = await prisma.serviceItem.findMany({
    where: { sparepartId: null },
    include: { service: { select: { unit: { select: { kodeUnit: true } } } } },
  });
  for (const i of items) {
    await prisma.kasEntry.create({
      data: {
        tanggal: i.createdAt,
        jenis: "BIAYA_SERVICE",
        arah: "KELUAR",
        jumlah: i.biaya,
        keterangan: `${i.service.unit.kodeUnit} (${i.jenis})${
          i.deskripsi ? ` — ${i.deskripsi}` : ""
        }`,
        referensiTipe: "ServiceItem",
        referensiId: i.id,
        otomatis: true,
      },
    });
    dibuat++;
  }
  console.log(`✓ ${items.length} biaya service`);

  // 3. Penerimaan penjualan & pelunasan piutang
  const notas = await prisma.penjualan.findMany({
    include: { pembayaran: { orderBy: { createdAt: "asc" } } },
  });
  let bayarAwal = 0;
  let pelunasan = 0;
  for (const n of notas) {
    for (const [idx, p] of n.pembayaran.entries()) {
      const pertama = idx === 0;
      await prisma.kasEntry.create({
        data: {
          tanggal: p.tanggal,
          jenis: pertama ? "PENJUALAN" : "PELUNASAN_PIUTANG",
          arah: "MASUK",
          jumlah: p.jumlah,
          keterangan: `${n.noNota}${p.catatan ? ` — ${p.catatan}` : ""}`,
          referensiTipe: "Penjualan",
          referensiId: n.id,
          otomatis: true,
        },
      });
      dibuat++;
      if (pertama) bayarAwal++;
      else pelunasan++;
    }

    if (n.penanggungOngkir === "TOKO" && Number(n.ongkir) > 0) {
      await prisma.kasEntry.create({
        data: {
          tanggal: n.tanggal,
          jenis: "ONGKIR_TOKO",
          arah: "KELUAR",
          jumlah: n.ongkir,
          keterangan: `Ongkir nota ${n.noNota}`,
          referensiTipe: "Penjualan",
          referensiId: n.id,
          otomatis: true,
        },
      });
      dibuat++;
    }
  }
  console.log(`✓ ${bayarAwal} penerimaan penjualan, ${pelunasan} pelunasan piutang`);

  // 4. Biaya operasional
  const biaya = await prisma.biayaOperasional.findMany();
  for (const b of biaya) {
    await prisma.kasEntry.create({
      data: {
        tanggal: b.tanggal,
        jenis: "BIAYA_OPERASIONAL",
        arah: "KELUAR",
        jumlah: b.jumlah,
        keterangan: b.deskripsi,
        referensiTipe: "BiayaOperasional",
        referensiId: b.id,
        otomatis: true,
      },
    });
    dibuat++;
  }
  console.log(`✓ ${biaya.length} biaya operasional`);

  // 5. Pembelian sparepart
  const mutasi = await prisma.mutasiSparepart.findMany({
    where: { jenis: "MASUK_BELI" },
    include: { sparepart: { select: { nama: true, satuan: true } } },
  });
  for (const m of mutasi) {
    await prisma.kasEntry.create({
      data: {
        tanggal: m.tanggal,
        jenis: "BELI_SPAREPART",
        arah: "KELUAR",
        jumlah: m.total,
        keterangan: `${m.sparepart.nama} — ${m.qty} ${m.sparepart.satuan}`,
        referensiTipe: "MutasiSparepart",
        referensiId: m.id,
        otomatis: true,
      },
    });
    dibuat++;
  }
  console.log(`✓ ${mutasi.length} pembelian sparepart`);

  const agregat = await prisma.kasEntry.groupBy({ by: ["arah"], _sum: { jumlah: true } });
  const masuk = Number(agregat.find((a) => a.arah === "MASUK")?._sum.jumlah ?? 0);
  const keluar = Number(agregat.find((a) => a.arah === "KELUAR")?._sum.jumlah ?? 0);

  console.log(`\n${dibuat} baris kas dibuat.`);
  console.log(`Uang masuk  : ${rp(masuk)}`);
  console.log(`Uang keluar : ${rp(keluar)}`);
  console.log(`Saldo kas   : ${rp(masuk - keluar)}`);
  console.log(
    "\nSaldo di atas BELUM termasuk setoran modal. Catat setoran modal Anda di halaman Kas,"
  );
  console.log("lalu periksa panel Posisi Keuangan di Dashboard sampai bertanda cocok.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
