// Prisma 7 memisahkan konfigurasi CLI dari schema.
// `datasource.url` di sini dipakai oleh perintah migrate/db/studio.
// Aplikasi sendiri tetap terhubung lewat driver adapter di src/lib/prisma.ts.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
