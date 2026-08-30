#!/bin/sh
set -e

# Migrasi dijalankan sebelum server naik.
#
# `migrate deploy`, BUKAN `db push`: deploy hanya menerapkan file di
# prisma/migrations dan tidak pernah menghapus kolom/tabel. `db push
# --accept-data-loss` menyamakan schema secara paksa — begitu ada data asli,
# kolom yang tidak cocok ikut dibuang tanpa bertanya. Lihat AGENTS.md.
echo "▶ Menjalankan prisma migrate deploy …"

percobaan=0
until node node_modules/prisma/build/index.js migrate deploy; do
  percobaan=$((percobaan + 1))
  if [ "$percobaan" -ge 5 ]; then
    echo "✗ Migrasi gagal 5x berturut-turut. Periksa DATABASE_URL dan status service database."
    exit 1
  fi
  # Postgres kadang belum menerima koneksi saat container app sudah naik.
  echo "… database belum siap, coba lagi ($percobaan/5) dalam 3 detik"
  sleep 3
done

echo "▶ Starting Next.js server …"
exec node server.js
