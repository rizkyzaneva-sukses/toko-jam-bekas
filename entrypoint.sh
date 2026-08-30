#!/bin/sh
set -e

echo "▶ Menjalankan prisma db push …"
npx prisma db push --accept-data-loss --skip-generate

echo "▶ Menjalankan seed …"
npx tsx prisma/seed.ts || echo "⚠ Seed dilewati (mungkin sudah ada data)"

echo "▶ Starting Next.js server …"
exec node server.js
