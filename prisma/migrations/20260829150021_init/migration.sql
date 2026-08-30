-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "StatusUnit" AS ENUM ('MASUK_QC', 'SERVICE', 'READY', 'TERJUAL', 'RUSAK');

-- CreateEnum
CREATE TYPE "GradeUnit" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "HasilQc" AS ENUM ('LOLOS', 'GAGAL');

-- CreateEnum
CREATE TYPE "StatusService" AS ENUM ('PROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "JenisKomponen" AS ENUM ('BATRE', 'STRAP', 'KACA', 'MESIN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "TipePembeli" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "ChannelJual" AS ENUM ('OFFLINE', 'WA_SOSMED');

-- CreateEnum
CREATE TYPE "PenanggungOngkir" AS ENUM ('PEMBELI', 'TOKO');

-- CreateEnum
CREATE TYPE "MetodeBayar" AS ENUM ('CASH', 'PIUTANG');

-- CreateEnum
CREATE TYPE "StatusBayar" AS ENUM ('LUNAS', 'SEBAGIAN', 'BELUM_LUNAS');

-- CreateEnum
CREATE TYPE "JenisLedger" AS ENUM ('MASUK_BELI', 'MASUK_QC_LOLOS', 'KELUAR_SERVICE', 'MASUK_SERVICE_SELESAI', 'KELUAR_JUAL', 'KELUAR_RUSAK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT,
    "email" TEXT,
    "googleSub" TEXT,
    "fotoUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "kunci" TEXT NOT NULL,
    "nilai" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("kunci")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "kodeUnit" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "hargaBeli" DECIMAL(15,2) NOT NULL,
    "totalBiayaService" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hpp" DECIMAL(15,2) NOT NULL,
    "hargaJual" DECIMAL(15,2),
    "status" "StatusUnit" NOT NULL DEFAULT 'MASUK_QC',
    "grade" "GradeUnit",
    "adaBox" BOOLEAN NOT NULL DEFAULT false,
    "adaSurat" BOOLEAN NOT NULL DEFAULT false,
    "adaBuku" BOOLEAN NOT NULL DEFAULT false,
    "adaExtraLink" BOOLEAN NOT NULL DEFAULT false,
    "adaSertifikat" BOOLEAN NOT NULL DEFAULT false,
    "catatanKondisi" TEXT,
    "catatan" TEXT,
    "tglBeli" TIMESTAMP(3) NOT NULL,
    "tglMasukInventory" TIMESTAMP(3),
    "tglKeluar" TIMESTAMP(3),
    "alasanRusak" TEXT,
    "statusSebelumRusak" "StatusUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_records" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "hasil" "HasilQc" NOT NULL,
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "totalBiaya" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "StatusService" NOT NULL DEFAULT 'PROSES',
    "catatan" TEXT,
    "tglMasuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tglSelesai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "jenis" "JenisKomponen" NOT NULL,
    "deskripsi" TEXT,
    "biaya" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT,
    "kota" TEXT,
    "catatan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mitra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penjualan" (
    "id" TEXT NOT NULL,
    "noNota" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "tipePembeli" "TipePembeli" NOT NULL,
    "mitraId" TEXT,
    "namaPembeli" TEXT,
    "channel" "ChannelJual" NOT NULL DEFAULT 'OFFLINE',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "ongkir" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penanggungOngkir" "PenanggungOngkir" NOT NULL DEFAULT 'PEMBELI',
    "totalTagihan" DECIMAL(15,2) NOT NULL,
    "totalDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "metodeBayar" "MetodeBayar" NOT NULL DEFAULT 'CASH',
    "statusBayar" "StatusBayar" NOT NULL DEFAULT 'LUNAS',
    "jatuhTempo" TIMESTAMP(3),
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penjualan_items" (
    "id" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "hargaJual" DECIMAL(15,2) NOT NULL,
    "hppSaatJual" DECIMAL(15,2) NOT NULL,
    "hargaBeliSaatJual" DECIMAL(15,2) NOT NULL,
    "biayaServiceSaatJual" DECIMAL(15,2) NOT NULL,
    "laba" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penjualan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_ledger" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "jenis" "JenisLedger" NOT NULL,
    "qty" INTEGER NOT NULL,
    "referensiId" TEXT,
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stok_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entitas_entitasId_idx" ON "audit_logs"("entitas", "entitasId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "units_kodeUnit_key" ON "units"("kodeUnit");

-- CreateIndex
CREATE INDEX "units_status_idx" ON "units"("status");

-- CreateIndex
CREATE INDEX "units_brand_idx" ON "units"("brand");

-- CreateIndex
CREATE INDEX "units_tglMasukInventory_idx" ON "units"("tglMasukInventory");

-- CreateIndex
CREATE INDEX "units_tglKeluar_idx" ON "units"("tglKeluar");

-- CreateIndex
CREATE INDEX "qc_records_unitId_idx" ON "qc_records"("unitId");

-- CreateIndex
CREATE INDEX "services_unitId_idx" ON "services"("unitId");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "services"("status");

-- CreateIndex
CREATE INDEX "service_items_serviceId_idx" ON "service_items"("serviceId");

-- CreateIndex
CREATE INDEX "mitra_nama_idx" ON "mitra"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "penjualan_noNota_key" ON "penjualan"("noNota");

-- CreateIndex
CREATE INDEX "penjualan_tanggal_idx" ON "penjualan"("tanggal");

-- CreateIndex
CREATE INDEX "penjualan_statusBayar_idx" ON "penjualan"("statusBayar");

-- CreateIndex
CREATE INDEX "penjualan_tipePembeli_idx" ON "penjualan"("tipePembeli");

-- CreateIndex
CREATE INDEX "penjualan_mitraId_idx" ON "penjualan"("mitraId");

-- CreateIndex
CREATE UNIQUE INDEX "penjualan_items_unitId_key" ON "penjualan_items"("unitId");

-- CreateIndex
CREATE INDEX "penjualan_items_penjualanId_idx" ON "penjualan_items"("penjualanId");

-- CreateIndex
CREATE INDEX "pembayaran_penjualanId_idx" ON "pembayaran"("penjualanId");

-- CreateIndex
CREATE INDEX "pembayaran_tanggal_idx" ON "pembayaran"("tanggal");

-- CreateIndex
CREATE INDEX "stok_ledger_unitId_idx" ON "stok_ledger"("unitId");

-- CreateIndex
CREATE INDEX "stok_ledger_tanggal_idx" ON "stok_ledger"("tanggal");

-- CreateIndex
CREATE INDEX "stok_ledger_jenis_idx" ON "stok_ledger"("jenis");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_records" ADD CONSTRAINT "qc_records_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjualan" ADD CONSTRAINT "penjualan_mitraId_fkey" FOREIGN KEY ("mitraId") REFERENCES "mitra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjualan_items" ADD CONSTRAINT "penjualan_items_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "penjualan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penjualan_items" ADD CONSTRAINT "penjualan_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "penjualan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_ledger" ADD CONSTRAINT "stok_ledger_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
