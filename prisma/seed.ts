// Jalankan: npm run db:seed
// Harus idempoten — aman dijalankan berkali-kali (pakai upsert).

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nama: "Owner Toko",
      username: "admin",
      passwordHash,
      email: process.env.SEED_ADMIN_EMAIL || null,
      role: "OWNER",
    },
  });

  console.log(`✓ Admin siap: ${admin.username}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("  Password default: admin123 — ganti setelah login pertama.");
  }

  // Satu mitra contoh supaya halaman Penjualan B2B tidak kosong sama sekali.
  const mitra = await prisma.mitra.findFirst({ where: { nama: "Mitra Contoh" } });
  if (!mitra) {
    await prisma.mitra.create({
      data: {
        nama: "Mitra Contoh",
        kontak: "08xxxxxxxxxx",
        kota: "Jakarta",
        catatan: "Data contoh — boleh dihapus setelah mitra asli diisi.",
      },
    });
    console.log("✓ Mitra contoh dibuat");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
