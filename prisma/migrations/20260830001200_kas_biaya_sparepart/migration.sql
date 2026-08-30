-- CreateEnum
CREATE TYPE "ArahKas" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "JenisKas" AS ENUM ('MODAL_MASUK', 'PRIVE', 'LAINNYA_MASUK', 'LAINNYA_KELUAR', 'PENYESUAIAN_MASUK', 'PENYESUAIAN_KELUAR', 'BELI_UNIT', 'BIAYA_SERVICE', 'BELI_SPAREPART', 'PENJUALAN', 'PELUNASAN_PIUTANG', 'ONGKIR_TOKO', 'BIAYA_OPERASIONAL');

-- CreateEnum
CREATE TYPE "KategoriBiaya" AS ENUM ('SEWA', 'GAJI', 'LISTRIK', 'AIR', 'INTERNET', 'TRANSPORT', 'PERLENGKAPAN', 'PEMASARAN', 'PAJAK_RETRIBUSI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "JenisMutasiSparepart" AS ENUM ('MASUK_BELI', 'KELUAR_PAKAI', 'PENYESUAIAN_TAMBAH', 'PENYESUAIAN_KURANG');

-- AlterTable
ALTER TABLE "service_items" ADD COLUMN     "qty" INTEGER,
ADD COLUMN     "sparepartId" TEXT;

-- CreateTable
CREATE TABLE "kas_entries" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jenis" "JenisKas" NOT NULL,
    "arah" "ArahKas" NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "keterangan" TEXT,
    "referensiTipe" TEXT,
    "referensiId" TEXT,
    "otomatis" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kas_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biaya_operasional" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "kategori" "KategoriBiaya" NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biaya_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spareparts" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" "JenisKomponen" NOT NULL,
    "satuan" TEXT NOT NULL DEFAULT 'pcs',
    "stok" INTEGER NOT NULL DEFAULT 0,
    "hargaRata" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minStok" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spareparts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_sparepart" (
    "id" TEXT NOT NULL,
    "sparepartId" TEXT NOT NULL,
    "jenis" "JenisMutasiSparepart" NOT NULL,
    "qty" INTEGER NOT NULL,
    "hargaSatuan" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "stokSesudah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "referensiId" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutasi_sparepart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kas_entries_tanggal_idx" ON "kas_entries"("tanggal");

-- CreateIndex
CREATE INDEX "kas_entries_jenis_idx" ON "kas_entries"("jenis");

-- CreateIndex
CREATE INDEX "kas_entries_referensiTipe_referensiId_idx" ON "kas_entries"("referensiTipe", "referensiId");

-- CreateIndex
CREATE INDEX "biaya_operasional_tanggal_idx" ON "biaya_operasional"("tanggal");

-- CreateIndex
CREATE INDEX "biaya_operasional_kategori_idx" ON "biaya_operasional"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "spareparts_kode_key" ON "spareparts"("kode");

-- CreateIndex
CREATE INDEX "spareparts_jenis_idx" ON "spareparts"("jenis");

-- CreateIndex
CREATE INDEX "spareparts_nama_idx" ON "spareparts"("nama");

-- CreateIndex
CREATE INDEX "mutasi_sparepart_sparepartId_idx" ON "mutasi_sparepart"("sparepartId");

-- CreateIndex
CREATE INDEX "mutasi_sparepart_tanggal_idx" ON "mutasi_sparepart"("tanggal");

-- CreateIndex
CREATE INDEX "mutasi_sparepart_jenis_idx" ON "mutasi_sparepart"("jenis");

-- CreateIndex
CREATE INDEX "service_items_sparepartId_idx" ON "service_items"("sparepartId");

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "spareparts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_sparepart" ADD CONSTRAINT "mutasi_sparepart_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "spareparts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
