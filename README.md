# Jam Bekas Ops

Sistem operasional & keuangan toko jam bekas. Melacak setiap jam sebagai **unit unik**
dari dibeli → QC → service → inventory → terjual (atau ditulis-hapus sebagai kerugian),
sekaligus menghitung modal per unit, omzet, laba bersih, piutang mitra, dan umur stok.

Spesifikasi lengkap ada di [PRD-toko-jam-bekas.md](./PRD-toko-jam-bekas.md).

---

## Menjalankan di komputer lokal

Butuh Node.js 22+ dan PostgreSQL.

```bash
npm install
```

Buat file `.env` (contoh isinya ada di `.env.example`):

```
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/toko_jam_bekas_dev
SESSION_SECRET=minimal_32_karakter_acak_untuk_dev
NEXT_PUBLIC_APP_NAME=Jam Bekas Ops
```

Siapkan database, lalu jalankan:

```bash
npm run db:deploy && npm run db:seed && npm run dev
```

Buka `http://localhost:3000` → login `admin` / `admin123`.

> Kalau database masih kosong (belum di-seed), halaman login otomatis berubah jadi
> form **"Buat akun owner"**. Ini jalur yang dipakai saat deploy ke EasyPanel, di mana
> `npm run db:seed` tidak bisa dijalankan di dalam container.

> **Belum ada halaman ganti password di dalam app.** Kredensial `admin` / `admin123`
> hanya dibuat oleh seed untuk pemakaian lokal. Di produksi jangan jalankan seed —
> pakai form "Buat akun owner" supaya password ditentukan sendiri sejak awal.

---

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build produksi (termasuk `prisma generate` + type check) |
| `npm test` | Jalankan unit test rumus bisnis |
| `npm run db:migrate` | Buat & terapkan migrasi baru (dev) |
| `npm run db:deploy` | Terapkan migrasi (produksi) |
| `npm run db:seed` | Buat admin awal + mitra contoh |
| `npm run db:backfill-kas` | Isi buku kas dari transaksi lama (sekali saja, untuk database yang sudah berisi data sebelum modul Kas dipasang) |
| `npm run db:studio` | Buka Prisma Studio |

---

## Alur kerja harian

```
Beli Produk ──▶ QC ──┬── LOLOS ──▶ Inventory ──▶ Penjualan ──▶ (Piutang)
                     │
                     └── GAGAL ──▶ Service ──▶ (selesai) ──▶ kembali ke QC

Dari MASUK_QC / SERVICE / READY, unit bisa dipindahkan ke RUSAK (write-off).
```

| Halaman | Isi |
|---|---|
| **Dashboard** | Saldo kas, omzet, laba dua tingkat, posisi keuangan, barang mengendap >30 hari, ranking produk, ranking mitra, tren 6 bulan |
| **Beli Produk** | Input jam baru; kode unit dibuat otomatis (`SEIKO-001`) |
| **QC** | Antrian pemeriksaan; lolos → inventory, gagal → bengkel |
| **Service** | Tiket bengkel; tiap komponen (batre/strap/kaca/mesin/lainnya) menambah HPP unit |
| **Inventory** | Semua unit + filter status/brand/grade/umur stok, export Excel |
| **Stok Sparepart** | Persediaan batre/strap/kaca/mesin dengan harga pokok rata-rata bergerak, stok opname, peringatan menipis |
| **Penjualan** | Nota B2B/B2C, multi-unit, ongkir, cash atau piutang |
| **Piutang** | Tagihan belum lunas, pencatatan cicilan, penanda jatuh tempo |
| **Mitra** | Master mitra B2B + ranking + posisi piutang |
| **Kas** | Buku kas tunggal — sebagian besar terisi otomatis dari transaksi, sisanya setor modal / prive / penyesuaian |
| **Biaya Operasional** | Sewa, gaji, listrik, dan beban toko lainnya; langsung memotong laba bulan berjalan |
| **Barang Rusak** | Daftar write-off + pembatalan |
| **Stok Ledger** | Buku besar pergerakan barang (otomatis, tidak bisa diinput manual) |
| **Laporan L/R** | Dua tingkat — laba kotor barang lalu laba bersih usaha — rincian per unit, export Excel |
| **Panduan** | Panduan pemakaian di dalam app: Mulai Cepat, Workflow, Per Halaman, Aturan Hitung, Cakupan & Batasan |
| **Study Case** | 21 skenario nyata dari setor modal sampai tutup bulan, lengkap dengan angkanya |

---

## Rumus bisnis

Semua rumus di bawah dikunci di `src/lib/hitung.ts` dan diuji di `src/lib/hitung.test.ts`.
**Jangan diubah tanpa konfirmasi.**

```
HPP unit          = harga beli + Σ(biaya service pada unit itu)
Laba unit         = harga jual − HPP saat jual   (dikunci saat nota disimpan)

Laba Kotor Barang = omzet − modal − biaya service
                    − kerugian rusak − kerugian sparepart − ongkir toko
Laba Bersih Usaha = Laba Kotor Barang − biaya operasional

Saldo Kas         = seluruh uang masuk − seluruh uang keluar
Nilai stok        = Σ HPP semua unit berstatus READY
Harga rata-rata sparepart (moving average) =
    (stok lama × harga lama + qty masuk × harga masuk) ÷ (stok lama + qty masuk)
```

Pemeriksaan silang yang selalu berlaku — ditampilkan di panel Posisi Keuangan:

```
Saldo Kas = Modal Disetor − Prive + Laba Kumulatif − Nilai Persediaan − Piutang
```

Aturan pengakuan:

- **Omzet** diakui pada tanggal transaksi, bukan saat uang diterima. Piutang dilaporkan terpisah.
- **Biaya service** melekat pada unit dan baru jadi beban **saat unit terjual**. Biaya service
  pada unit yang masih READY adalah nilai persediaan, bukan beban.
- **Kerugian write-off** diakui penuh pada tanggal unit dipindah ke RUSAK.
- **Ongkir** yang ditanggung toko adalah beban; ongkir yang ditanggung pembeli bukan omzet.
- **Umur stok** dihitung dari tanggal QC lolos (`tglMasukInventory`), bukan tanggal beli —
  karena barang yang masih di bengkel belum bisa dijual.
- **Biaya operasional** adalah beban periode: diakui penuh pada bulan terjadinya, tidak
  menunggu barang terjual.
- **Membeli sparepart** mengeluarkan uang dari kas. **Memakainya saat service tidak** —
  nilainya hanya berpindah dari persediaan ke HPP jam. Kalau keduanya memotong kas,
  biayanya terhitung dua kali.
- **Modal dan prive tidak menyentuh laba** — keduanya hanya menggeser saldo kas.

Yang belum termasuk dalam Laba Bersih Usaha: penyusutan aset tetap dan pajak penghasilan.

### Penamaan unit

```
Nama dasar   = Brand + Model            -> "Seiko 1002"
Nama lengkap = Nama dasar + (service)   -> "Seiko 1002 (Ganti Batre, Ganti Mesin)"
```

Nama lengkap dipakai untuk **menampilkan** di seluruh layar operasional. Nama dasar
dipakai untuk **mengelompokkan** — Ranking Produk dan agregasi apa pun wajib memakainya,
supaya satu model tidak terpecah hanya karena servicenya berbeda. Rincian nota ke pembeli
memakai nama polos tanpa imbuhan. Aturannya ada di `src/lib/nama-unit.ts`.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 + `@prisma/adapter-pg` ·
PostgreSQL · iron-session · Radix UI + cmdk · TanStack Query · Recharts · SheetJS · Vitest

Struktur:

```
src/
├── app/
│   ├── (app)/        halaman dalam layout bersidebar
│   ├── api/          route handlers
│   ├── login/
│   └── layout.tsx
├── components/       layout, ui, modal bersama
├── lib/              prisma, session, api-helpers, utils, dan logika bisnis
└── middleware.ts
```

Logika bisnis ada di `src/lib/<domain>.ts` (`unit.ts`, `service.ts`, `penjualan.ts`,
`kas.ts`, `biaya.ts`, `sparepart.ts`, `laporan.ts`, `hitung.ts`) — bukan di dalam route
handler.

**Aturan yang tidak boleh dilanggar:** setiap transaksi yang menggerakkan uang wajib
menulis satu baris kas lewat `catatKasOtomatis()` di dalam transaksi database yang sama.
Kalau tidak, saldo kas akan berbeda dengan kenyataan dan panel Posisi Keuangan akan
menunjukkan selisih.

---

## Deploy

Lihat [DEPLOY_EASYPANEL.md](./DEPLOY_EASYPANEL.md).
