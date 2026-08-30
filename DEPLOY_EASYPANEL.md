# Deploy ke EasyPanel

## 1. Buat PostgreSQL
EasyPanel → Services → New Service → **PostgreSQL**.
Catat host, port, user, password, nama database.
Connection string: `postgresql://USER:PASSWORD@HOST:5432/DATABASE`
Pakai **host internal**, bukan alamat publik.

## 2. Push ke GitHub

```bash
git init && git add . && git commit -m "initial commit"
```

Lalu tambahkan remote dan push. Pastikan `.env` **tidak** ikut ter-commit (sudah ada di `.gitignore`).

## 3. Buat App
New Service → **App** → Source: GitHub → pilih repo

- Build Method: **Dockerfile**
- Port: **3000**
- Isi environment variable dari `.env.example`:

| Key | Isi |
|---|---|
| `DATABASE_URL` | connection string PostgreSQL internal |
| `SESSION_SECRET` | 32+ karakter acak (perintah ada di `.env.example`) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `Jam Bekas Ops` |
| `APP_BASE_URL` | URL app setelah domain dipasang |
| `SEED_ADMIN_PASSWORD` | opsional, kosong = `admin123` |

## 4. Migrasi (sekali saja)
Setelah container jalan, buka Terminal service app:

```bash
./node_modules/.bin/prisma migrate deploy
```

Folder `prisma/migrations` sudah ikut di repo, jadi perintah ini langsung membentuk
seluruh tabel.

> **Tidak perlu menjalankan `npm run db:seed` di container.** Image produksi memakai
> Next.js standalone, jadi `tsx` tidak tersedia di dalamnya. Akun owner dibuat lewat
> halaman login (langkah 6).

## 5. Domain
EasyPanel → Domains → arahkan subdomain pilihan Anda ke port 3000.
Setelah itu update `APP_BASE_URL` sesuai domain tersebut.

## 6. Buat akun owner
Buka app di browser. Karena database masih kosong, halaman login otomatis menampilkan
form **"Buat akun owner"** — isi nama, username, dan password pilihan Anda sendiri.

Form ini hanya muncul selama tabel user masih kosong. Begitu akun dibuat, halaman
kembali menjadi form login biasa dan endpoint pembuatannya menolak semua permintaan.

Karena itu: **buat akunnya segera setelah domain aktif**, jangan dibiarkan menganggur.

## Update berikutnya
Push ke GitHub → EasyPanel → Deploy.
Kalau schema berubah, jalankan lagi `./node_modules/.bin/prisma migrate deploy`.

## Kalau bermasalah

| Gejala | Cek |
|---|---|
| Build gagal di `prisma generate` | Blok `generator` di `schema.prisma` |
| Runtime error koneksi DB | `DATABASE_URL` pakai host internal? |
| Login gagal terus | Akun owner sudah dibuat lewat form di halaman login (langkah 6)? |
| Halaman blank | Cek log container, biasanya env kurang |
| `SESSION_SECRET wajib diisi` | Env belum diisi minimal 32 karakter |
