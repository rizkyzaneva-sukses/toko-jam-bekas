# AGENTS.md — Aturan Project

Salin file ini ke **root project**. Dibaca otomatis oleh Antigravity, Kilo Code,
Roo Code, dan Claude Code. Isinya ringkasan `App-Builder` — kalau bertentangan
dengan tebakanmu, file ini yang menang.

---

## Aturan nol

**Jangan menebak. Kalau ada yang tidak jelas, tanya dulu.**
Rumus bisnis, nama field, hak akses, sumber data — tidak boleh dikarang.
Lebih baik berhenti dan bertanya daripada membangun yang salah.

Jangan menandai pekerjaan "selesai" kalau ada bagian yang belum jalan.
Tulis terus terang apa yang belum beres.

## Setup awal (Antigravity)

**STEP 1 selalu:** Folder sudah di-extract manual oleh user. **JANGAN extract ZIP.**
Langsung `cd` ke folder, lalu `npm install`.

## Stack — jangan diganti tanpa izin

Next.js 16 (App Router) · React 19 · **TypeScript** · Tailwind v4 ·
Prisma 7 + `@prisma/adapter-pg` · PostgreSQL · iron-session 8 ·
Radix UI + cmdk + lucide-react + sonner

Tidak dipakai: JavaScript polos, Pages Router, Express, NextAuth, next-themes,
Server Actions (pakai Route Handlers), `tailwind.config.js` (Tailwind v4 pakai CSS).

## UI — wajib

1. **Tema light + dark**, default ikut OS, ada toggle 3 state (light/dark/system).
   Inline script anti-FOUC di `<head>` tidak boleh dihapus.
2. **Kontras WCAG AA 4.5:1.** Setiap kelas teks wajib punya pasangan `dark:`.
   Dilarang: `text-gray-400` untuk teks isi, teks putih di atas warna muda.
3. **Semua dropdown pakai `<SearchableSelect>`** — berapa pun jumlah opsinya.
   `<select>` polos dan Radix Select telanjang tidak dipakai.
4. Setiap halaman data punya: loading skeleton, empty state, error state, toast.
5. Dites di lebar 375px. Tabel dibungkus `overflow-x-auto`.
6. Konfirmasi sebelum menghapus. Tidak pernah `alert()` — pakai `sonner`.

## Bahasa & format

Label Bahasa Indonesia. Istilah bisnis baku **tetap Inggris**:
Dashboard, Omzet, Profit, Cash Flow, Stock Opname, SKU, ROAS, ROI, GMV, Payout,
Voucher, Checkout, Campaign, Report, Export, Import, Sync, Barcode, Refund.

`Rp 1.250.000` (tanpa desimal) · `20 Agu 2026` · timezone tampilan **WIB**,
penyimpanan DB **UTC**. Semua formatter di `src/lib/utils.ts`, jangan inline.

## Database

- `id String @id @default(cuid())` + `createdAt` + `updatedAt` di setiap model
- Uang: `Decimal @db.Decimal(15,2)` — **jangan `Float`**
- Status: `enum`, bukan String bebas
- Index untuk kolom yang sering difilter
- Produksi pakai `prisma migrate deploy`, **jangan** `db push`
- Seed harus idempoten (`upsert`)

## Auth

- Session di cookie httpOnly terenkripsi (iron-session), bukan localStorage
- **Role dibaca fresh dari DB tiap request**, tidak pernah dari isi cookie
- Setiap route handler dibungkus `withAuth` / `withRole` — middleware saja tidak cukup
- Otorisasi diperiksa **sebelum** cookie dibuat
- Rate limit di endpoint login; pesan gagal login generik

## Keamanan

- Kredensial tidak pernah masuk repo. Hanya `.env.example` berisi nama key.
- Token pihak ketiga disimpan di DB (bukan env), sebaiknya terenkripsi
- Jangan `console.log` isi token, password, atau data pribadi

## Struktur folder

```
src/
├── app/{api,(modul),login,layout.tsx,globals.css}
├── components/{layout,ui}
├── lib/{prisma,session,api-helpers,utils,<domain>}.ts
├── generated/prisma/     (gitignored)
└── middleware.ts
```

**Logika bisnis di `src/lib/<domain>.ts`, bukan di dalam route handler.**

## Sebelum bilang selesai

- [ ] `npm run build` lulus tanpa error TypeScript
- [ ] Toggle tema dicoba: tidak ada teks yang hilang di salah satu mode
- [ ] Semua dropdown pakai `SearchableSelect`
- [ ] Dicoba di lebar 375px
- [ ] `.env.example` lengkap
- [ ] Yang belum selesai ditulis terbuka

---

# Khusus project ini — Toko Jam Bekas

Spesifikasi lengkap: `PRD-toko-jam-bekas.md`. Kalau ada pertentangan, PRD yang menang.

## Rumus yang dikunci (jangan diubah tanpa konfirmasi Rizky)

Semuanya ada di `src/lib/hitung.ts` dan diuji di `src/lib/hitung.test.ts`.
Kalau menyentuh salah satu, test wajib ikut diperbarui dan dijalankan.

```
HPP unit          = harga beli + Σ(biaya service pada unit itu)
Laba unit         = harga jual − HPP saat jual  (snapshot, dikunci saat nota disimpan)

Laba Kotor Barang = omzet − modal − biaya service
                    − kerugian rusak − kerugian sparepart − ongkir toko
Laba Bersih Usaha = Laba Kotor Barang − biaya operasional

Saldo Kas         = seluruh uang masuk − seluruh uang keluar
Nilai stok        = Σ HPP semua unit berstatus READY
Harga rata-rata sparepart = moving average
```

- Omzet diakui pada **tanggal transaksi**, bukan saat uang diterima.
- Biaya service jadi beban **saat unit terjual**, bukan saat uang keluar.
- Kerugian write-off diakui penuh pada tanggal unit dipindah ke RUSAK.
- Ongkir ditanggung TOKO = beban; ongkir ditanggung PEMBELI bukan omzet.
- Umur stok dihitung dari `tglMasukInventory` (tanggal QC lolos), bukan `tglBeli`.
- Biaya operasional = beban periode, diakui pada bulan terjadinya.
- Beli sparepart memotong kas; memakainya saat service TIDAK. Nilainya hanya berpindah
  dari persediaan ke HPP unit. Jangan pernah membuat keduanya memotong kas.
- Modal dan prive tidak pernah menyentuh laba.
- Penamaan unit: nama lengkap ("Seiko 1002 (Ganti Strap)") hanya untuk DITAMPILKAN.
  Semua pengelompokan/agregasi WAJIB memakai nama dasar ("Seiko 1002") dari
  `src/lib/nama-unit.ts`. Rincian nota ke pembeli memakai nama polos.

## Aturan alur

- Status unit: `MASUK_QC → SERVICE → MASUK_QC → READY → TERJUAL`.
  `RUSAK` bisa dituju dari `MASUK_QC`, `SERVICE`, atau `READY`, dan bisa dibatalkan.
- Unit **hanya boleh dijual dari status `READY`**. Tidak ada jalur lain.
- `StokLedger` **tidak pernah diinput manual** — hanya dibuat service layer sebagai
  efek samping aksi bisnis, di dalam `prisma.$transaction` yang sama.
- **Setiap transaksi yang menggerakkan uang wajib menulis satu baris kas** lewat
  `catatKasOtomatis()`, di dalam transaksi database yang sama. Baris kas `otomatis: true`
  tidak boleh bisa dihapus dari layar — ia ikut hidup-mati bersama transaksi asalnya
  (`hapusKasReferensi()`).
- Pemeriksaan silang di `posisiKeuangan()` harus selalu menghasilkan selisih nol:
  `Saldo Kas = Modal − Prive + Laba Kumulatif − Nilai Persediaan − Piutang`.
  Kalau menambah jenis transaksi baru yang menyentuh uang, pastikan identitas ini tetap
  berlaku dan tambahkan ujinya.
- Penomoran (`kodeUnit`, `noNota`) lewat tabel `Counter` supaya aman dari balapan.

## Catatan teknis

- Uang disimpan `Decimal(15,2)`, dikonversi ke `number` di batas API lewat `toNumber()`.
- Rentang periode selalu WIB — pakai `rentangBulanWIB()`, jangan hitung manual.
- Seed tidak bisa dijalankan di container produksi (standalone build tanpa `tsx`).
  Akun owner pertama dibuat lewat `/api/auth/bootstrap`, yang hanya bekerja
  selama tabel user masih kosong. Jangan longgarkan gerbang itu.
