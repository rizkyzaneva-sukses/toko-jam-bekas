"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeAlert,
  Boxes,
  Calculator,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Package,
  Receipt,
  Rocket,
  ScrollText,
  ShieldCheck,
  ReceiptText,
  ShoppingCart,
  Store,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  Badge,
  BadgeStatus,
  Button,
  Card,
  PageHeader,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";
import {
  Isi,
  JudulBagian,
  Kotak,
  Langkah,
  Tabs,
  Tekan,
} from "@/components/panduan/ui-panduan";

const TABS = [
  { id: "mulai", label: "Mulai Cepat", icon: Rocket },
  { id: "workflow", label: "Workflow", icon: ListChecks },
  { id: "halaman", label: "Per Halaman", icon: LayoutDashboard },
  { id: "hitung", label: "Aturan Hitung", icon: Calculator },
  { id: "cakupan", label: "Cakupan & Batasan", icon: ShieldCheck },
];

export default function HalamanPanduan() {
  const [tab, setTab] = React.useState("mulai");

  return (
    <>
      <PageHeader
        judul="Panduan Pemakaian"
        deskripsi="Semua yang perlu diketahui untuk menjalankan app ini sehari-hari."
        aksi={
          <Link href="/study-case">
            <Button varian="secondary">
              <GraduationCap className="h-4 w-4" /> Lihat Study Case
            </Button>
          </Link>
        }
      />

      <Tabs tabs={TABS} aktif={tab} onGanti={setTab} />

      {tab === "mulai" && <TabMulai />}
      {tab === "workflow" && <TabWorkflow />}
      {tab === "halaman" && <TabHalaman />}
      {tab === "hitung" && <TabHitung />}
      {tab === "cakupan" && <TabCakupan />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Mulai Cepat
// ---------------------------------------------------------------------------

function TabMulai() {
  return (
    <div className="space-y-4">
      <Kotak nada="info" judul="Satu kalimat tentang app ini">
        <p>
          Setiap jam dicatat sebagai <strong>satu unit sendiri</strong> dengan kode unik
          (contoh <code>SEIKO-001</code>). Semua biaya yang menempel pada jam itu — harga
          beli dan biaya service — diikuti sampai jam tersebut terjual, supaya laba per unit
          dan laba bulanan ketahuan persis.
        </p>
      </Kotak>

      <Card>
        <JudulBagian sub="Kalau baru pertama kali membuka app, kerjakan berurutan.">
          Langkah-langkah pertama
        </JudulBagian>

        <Langkah>
          <>
            <Isi>Catat modal awal Anda.</Isi> Buka <Tekan>Kas</Tekan> →{" "}
            <Tekan>Catat kas</Tekan> → jenis <Isi>Setor Modal</Isi>. Isi uang yang Anda
            siapkan untuk bisnis ini. Tanpa langkah ini, saldo kas akan tampak minus begitu
            Anda mulai belanja.
          </>
          <>
            <Isi>Isi data mitra.</Isi> Buka <Tekan>Mitra</Tekan> →{" "}
            <Tekan>Tambah mitra</Tekan>. Mitra adalah toko/reseller yang membeli dari Anda
            (B2B). Tanpa mitra, transaksi B2B tidak bisa disimpan. Pembeli perorangan (B2C)
            tidak perlu didaftarkan.
          </>
          <>
            <Isi>Masukkan jam yang sudah Anda punya.</Isi> Buka <Tekan>Beli Produk</Tekan>,
            input satu per satu beserta harga belinya. Kode unit dibuat otomatis.
          </>
          <>
            <Isi>Periksa satu per satu di halaman QC.</Isi> Yang kondisinya sudah bagus →{" "}
            <Tekan>Lolos</Tekan>. Yang perlu diperbaiki → <Tekan>Gagal</Tekan>.
          </>
          <>
            <Isi>Catat biaya service.</Isi> Untuk jam yang masuk bengkel, catat setiap
            komponen yang diganti di halaman <Tekan>Service</Tekan>. Ini yang membuat modal
            aslinya ketahuan.
          </>
          <>
            <Isi>Mulai jualan.</Isi> <Tekan>Penjualan</Tekan> →{" "}
            <Tekan>Transaksi baru</Tekan>. Setelah itu Dashboard mulai terisi sendiri.
          </>
          <>
            <Isi>Catat biaya toko tiap kali keluar uang.</Isi> Sewa, gaji, listrik dicatat di{" "}
            <Tekan>Biaya Operasional</Tekan>. Ini yang membedakan laba kotor barang dengan
            laba bersih usaha yang sebenarnya.
          </>
        </Langkah>
      </Card>

      <Card>
        <JudulBagian sub="Yang paling sering ditanyakan di hari-hari pertama.">
          Yang sering bikin bingung di awal
        </JudulBagian>

        <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              &ldquo;Kenapa jam yang baru saya beli tidak muncul di Inventory?&rdquo;
            </p>
            <p className="mt-1">
              Karena belum lolos QC. Jam yang baru dibeli statusnya{" "}
              <BadgeStatus status="MASUK_QC" /> — sudah tercatat sebagai aset, tapi belum
              boleh dijual. Selesaikan QC-nya dulu.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              &ldquo;Kenapa laba bulan ini tidak berubah padahal saya baru bayar service
              Rp 500.000?&rdquo;
            </p>
            <p className="mt-1">
              Biaya service menempel di jamnya, dan baru dihitung sebagai beban{" "}
              <strong>saat jam itu terjual</strong>. Selama masih di stok, biaya itu adalah
              nilai barang, bukan kerugian. Lihat tab <Tekan>Aturan Hitung</Tekan>.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              &ldquo;Kenapa saldo kas saya minus?&rdquo;
            </p>
            <p className="mt-1">
              Kemungkinan besar setoran modal belum dicatat. App menghitung uang keluar
              (belanja jam, service) tanpa tahu dari mana uang itu berasal. Catat setoran
              modal di <Tekan>Kas</Tekan> supaya saldonya benar.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              &ldquo;Saya salah pencet Rusak, gimana?&rdquo;
            </p>
            <p className="mt-1">
              Buka <Tekan>Barang Rusak</Tekan> → <Tekan>Batalkan</Tekan>. Unit kembali ke
              status sebelumnya dan kerugiannya hilang dari laporan.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <JudulBagian>Rutinitas yang disarankan</JudulBagian>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Kapan</Th>
                <Th>Yang dikerjakan</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              <tr>
                <Td className="font-medium">Setiap kali beli jam</Td>
                <Td className="whitespace-normal">
                  Langsung input di <Tekan>Beli Produk</Tekan>, jangan ditunda. Kalau
                  menumpuk, harga belinya mudah tertukar.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Setiap kali keluar uang service</Td>
                <Td className="whitespace-normal">
                  Catat di <Tekan>Service</Tekan> pada hari yang sama. Ini bagian yang
                  paling sering lupa dan paling merusak angka laba.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Setiap penjualan</Td>
                <Td className="whitespace-normal">
                  Buat nota di <Tekan>Penjualan</Tekan>. Kalau dibayar tempo, pilih metode
                  Piutang dan isi jatuh temponya.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Setiap bayar sewa / gaji / listrik</Td>
                <Td className="whitespace-normal">
                  Catat di <Tekan>Biaya Operasional</Tekan>. Uangnya otomatis keluar dari kas
                  dan langsung memotong laba bulan ini.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Setiap belanja sparepart</Td>
                <Td className="whitespace-normal">
                  <Tekan>Stok Sparepart</Tekan> → <Tekan>Isi</Tekan>. Kalau tidak dicatat,
                  saldo kas jadi lebih besar dari kenyataan.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Seminggu sekali</Td>
                <Td className="whitespace-normal">
                  Cek <Tekan>Dashboard</Tekan> bagian <Isi>Barang Mengendap</Isi>,{" "}
                  <Tekan>Piutang</Tekan> yang lewat jatuh tempo, dan peringatan{" "}
                  <Isi>Sparepart menipis</Isi>.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Akhir bulan</Td>
                <Td className="whitespace-normal">
                  Buka <Tekan>Laporan L/R</Tekan>, hitung uang fisik di laci dan cocokkan
                  dengan panel <Isi>Posisi Keuangan</Isi> di Dashboard, lalu{" "}
                  <Tekan>Export Excel</Tekan> untuk arsip.
                </Td>
              </tr>
            </tbody>
          </Tabel>
        </TabelWrap>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Workflow
// ---------------------------------------------------------------------------

function KotakAlur({
  judul,
  sub,
  warna,
}: {
  judul: string;
  sub: string;
  warna: string;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-center ${warna}`}>
      <p className="text-sm font-semibold">{judul}</p>
      <p className="mt-0.5 text-xs opacity-90">{sub}</p>
    </div>
  );
}

function Panah({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
      <ArrowRight className="h-4 w-4 shrink-0 rotate-90 sm:rotate-0" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

function TabWorkflow() {
  return (
    <div className="space-y-4">
      <Card>
        <JudulBagian sub="Setiap jam pasti melewati jalur ini. Tidak ada jalan pintas.">
          Alur utama
        </JudulBagian>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <KotakAlur
              judul="Beli Produk"
              sub="status: Antrian QC"
              warna="border-gray-300 bg-gray-100 text-gray-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-50"
            />
          </div>
          <Panah />
          <div className="flex-1">
            <KotakAlur
              judul="QC"
              sub="lolos atau gagal"
              warna="border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100"
            />
          </div>
          <Panah label="lolos" />
          <div className="flex-1">
            <KotakAlur
              judul="Inventory"
              sub="status: Ready — siap dijual"
              warna="border-green-300 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-100"
            />
          </div>
          <Panah />
          <div className="flex-1">
            <KotakAlur
              judul="Penjualan"
              sub="status: Terjual"
              warna="border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100"
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            Kalau QC gagal — jalurnya memutar
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <KotakAlur
                judul="QC Gagal"
                sub="isi keterangan masalah"
                warna="border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-100"
              />
            </div>
            <Panah />
            <div className="flex-1">
              <KotakAlur
                judul="Service"
                sub="catat biaya komponen"
                warna="border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-100"
              />
            </div>
            <Panah label="selesai" />
            <div className="flex-1">
              <KotakAlur
                judul="Kembali ke QC"
                sub="diperiksa ulang"
                warna="border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-100"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
            Putaran ini boleh berulang berapa kali pun. Setiap putaran, biaya service
            bertambah ke HPP jam tersebut.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">
            Jalur keluar darurat — Barang Rusak
          </p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-300">
            Dari status <BadgeStatus status="MASUK_QC" />, <BadgeStatus status="SERVICE" />,
            atau <BadgeStatus status="READY" />, jam yang tidak bisa diselamatkan bisa
            dipindahkan ke <BadgeStatus status="RUSAK" />. Seluruh HPP-nya langsung menjadi
            kerugian. Jam yang sudah <BadgeStatus status="TERJUAL" /> tidak bisa lagi
            dipindahkan ke Rusak.
          </p>
        </div>
      </Card>

      <Card>
        <JudulBagian sub="Arti setiap status dan apa yang boleh dilakukan padanya.">
          Status unit
        </JudulBagian>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Status</Th>
                <Th>Artinya</Th>
                <Th>Bisa diapakan</Th>
                <Th>Masuk hitungan</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              <tr>
                <Td>
                  <BadgeStatus status="MASUK_QC" />
                </Td>
                <Td className="whitespace-normal">
                  Baru dibeli, atau baru selesai service. Menunggu diperiksa.
                </Td>
                <Td className="whitespace-normal">QC Lolos / QC Gagal / Rusak</Td>
                <Td className="whitespace-normal">
                  Belum masuk Nilai Stok, belum dihitung umur stoknya
                </Td>
              </tr>
              <tr>
                <Td>
                  <BadgeStatus status="SERVICE" />
                </Td>
                <Td className="whitespace-normal">Sedang di bengkel.</Td>
                <Td className="whitespace-normal">
                  Tambah/hapus biaya komponen · Selesai · Rusak
                </Td>
                <Td className="whitespace-normal">Belum masuk Nilai Stok</Td>
              </tr>
              <tr>
                <Td>
                  <BadgeStatus status="READY" />
                </Td>
                <Td className="whitespace-normal">
                  Lolos QC, sudah punya grade dan harga jual. Siap dijual.
                </Td>
                <Td className="whitespace-normal">Dijual · Rusak</Td>
                <Td className="whitespace-normal">
                  Masuk Nilai Stok · umur stok mulai dihitung
                </Td>
              </tr>
              <tr>
                <Td>
                  <BadgeStatus status="TERJUAL" />
                </Td>
                <Td className="whitespace-normal">
                  Sudah keluar lewat nota penjualan. Laba dikunci.
                </Td>
                <Td className="whitespace-normal">
                  Tidak bisa diubah lagi (hanya bisa dilihat)
                </Td>
                <Td className="whitespace-normal">Masuk Omzet &amp; L/R periode</Td>
              </tr>
              <tr>
                <Td>
                  <BadgeStatus status="RUSAK" />
                </Td>
                <Td className="whitespace-normal">Ditulis-hapus sebagai kerugian.</Td>
                <Td className="whitespace-normal">Batalkan (undo)</Td>
                <Td className="whitespace-normal">
                  Masuk Kerugian Barang Rusak pada tanggal write-off
                </Td>
              </tr>
            </tbody>
          </Tabel>
        </TabelWrap>
      </Card>

      <Card>
        <JudulBagian sub="Yang dicatat sistem sendiri di Stok Ledger — Anda tidak perlu, dan tidak bisa, mengisinya manual.">
          Pergerakan stok yang tercatat otomatis
        </JudulBagian>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Pergerakan</Th>
                <Th>Dipicu ketika</Th>
                <Th className="text-right">Qty</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {[
                ["Masuk — Pembelian", "Simpan form Beli Produk", "+1"],
                ["QC Lolos — Masuk Inventory", "QC dinyatakan lolos", "—"],
                ["Keluar — Masuk Service", "QC dinyatakan gagal", "—"],
                ["Masuk — Service Selesai", "Tombol Service selesai ditekan", "—"],
                ["Keluar — Penjualan", "Nota penjualan disimpan", "−1"],
                ["Keluar — Barang Rusak", "Unit dipindahkan ke Rusak", "−1"],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <Td className="font-medium">{a}</Td>
                  <Td className="whitespace-normal">{b}</Td>
                  <Td className="text-right tabular-nums">{c}</Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        </TabelWrap>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Qty <strong>—</strong> berarti perpindahan internal: jamnya tetap milik toko, hanya
          berpindah tempat (bengkel ↔ etalase), jadi jumlah stok tidak berubah.
        </p>
      </Card>

      <Card>
        <JudulBagian sub="Setiap transaksi di app menggerakkan uang. Semuanya tercatat sendiri di halaman Kas.">
          Alur uang
        </JudulBagian>

        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Ketika Anda...</Th>
                <Th>Kas</Th>
                <Th>Laba</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              <tr>
                <Td className="whitespace-normal">Membeli jam</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">
                  Keluar sebesar harga beli
                </Td>
                <Td className="whitespace-normal">Belum berubah — jadi persediaan</Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Membayar komponen service (beli langsung)</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">
                  Keluar sebesar biayanya
                </Td>
                <Td className="whitespace-normal">Belum berubah — menempel ke HPP jam</Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Mengambil sparepart dari stok</Td>
                <Td className="whitespace-normal">
                  <strong>Tidak berubah</strong> — uangnya sudah keluar saat sparepart dibeli
                </Td>
                <Td className="whitespace-normal">Belum berubah — pindah ke HPP jam</Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Mengisi stok sparepart</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">
                  Keluar sebesar qty × harga
                </Td>
                <Td className="whitespace-normal">Belum berubah — jadi persediaan</Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Menjual jam (cash)</Td>
                <Td className="whitespace-normal text-green-700 dark:text-green-400">
                  Masuk sebesar yang dibayar
                </Td>
                <Td className="whitespace-normal">
                  Naik — omzet dan HPP diakui sekaligus
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Menjual jam (tempo)</Td>
                <Td className="whitespace-normal">Masuk hanya sebesar DP</Td>
                <Td className="whitespace-normal">
                  Naik penuh — sisanya jadi piutang, bukan laba tertunda
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Menerima pelunasan piutang</Td>
                <Td className="whitespace-normal text-green-700 dark:text-green-400">
                  Masuk
                </Td>
                <Td className="whitespace-normal">
                  <strong>Tidak berubah</strong> — labanya sudah diakui saat nota dibuat
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Membayar sewa / gaji / listrik</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">Keluar</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">
                  Turun seketika — beban periode
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Menyetor modal</Td>
                <Td className="whitespace-normal text-green-700 dark:text-green-400">
                  Masuk
                </Td>
                <Td className="whitespace-normal">
                  Tidak berubah — modal bukan penghasilan
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Mengambil uang untuk pribadi (prive)</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">Keluar</Td>
                <Td className="whitespace-normal">
                  Tidak berubah — prive bukan biaya usaha
                </Td>
              </tr>
              <tr>
                <Td className="whitespace-normal">Memindahkan jam ke Rusak</Td>
                <Td className="whitespace-normal">Tidak berubah — uangnya sudah lama keluar</Td>
                <Td className="whitespace-normal text-red-700 dark:text-red-400">
                  Turun sebesar HPP
                </Td>
              </tr>
            </tbody>
          </Tabel>
        </TabelWrap>

        <Kotak nada="info" className="mt-4" judul="Tiga baris yang paling sering bikin bingung">
          <p>
            <strong>Ambil sparepart dari stok tidak memotong kas.</strong> Kalau ikut memotong,
            biaya batre terhitung dua kali: sekali saat dibeli, sekali saat dipakai.
          </p>
          <p>
            <strong>Pelunasan piutang tidak menambah laba.</strong> Yang berubah cuma posisi
            uang. Labanya sudah dihitung waktu nota dibuat.
          </p>
          <p>
            <strong>Modal dan prive tidak menyentuh laba sama sekali.</strong> Keduanya urusan
            pemilik dengan bisnis, bukan hasil usaha.
          </p>
        </Kotak>
      </Card>

      <Card>
        <JudulBagian sub="Urutan menekan tombol untuk pekerjaan yang paling sering.">
          Alur mengerjakan — langkah demi langkah
        </JudulBagian>

        <div className="space-y-5">
          <AlurKerja
            ikon={ShoppingCart}
            judul="Mencatat pembelian jam"
            langkah={[
              <>
                Buka <Tekan>Beli Produk</Tekan>.
              </>,
              <>
                Pilih <Isi>Brand</Isi> dari daftar. Kalau brandnya belum ada, pilih{" "}
                <Tekan>+ Brand baru...</Tekan> lalu ketik namanya.
              </>,
              <>
                Isi <Isi>Model</Isi>, <Isi>Harga Beli</Isi>, dan <Isi>Tanggal Beli</Isi>.
              </>,
              <>
                Tekan <Tekan>Simpan &amp; masukkan ke antrian QC</Tekan>. Kode unit muncul
                otomatis di notifikasi.
              </>,
            ]}
          />

          <AlurKerja
            ikon={ClipboardCheck}
            judul="Memeriksa jam (QC)"
            langkah={[
              <>
                Buka <Tekan>QC</Tekan>. Semua jam yang menunggu ada di sini.
              </>,
              <>
                <Isi>Kalau kondisinya bagus:</Isi> tekan <Tekan>Lolos</Tekan> → pilih{" "}
                <Isi>Grade</Isi> (A/B/C), isi <Isi>Harga Jual</Isi>, centang{" "}
                <Isi>Kelengkapan</Isi> yang ada, lalu{" "}
                <Tekan>Masukkan ke inventory</Tekan>.
              </>,
              <>
                <Isi>Kalau perlu diperbaiki:</Isi> tekan <Tekan>Gagal</Tekan> → tulis
                masalahnya (wajib) → <Tekan>Kirim ke service</Tekan>.
              </>,
              <>
                <Isi>Kalau sudah tidak bisa diselamatkan:</Isi> tekan <Tekan>Rusak</Tekan>.
              </>,
            ]}
          />

          <AlurKerja
            ikon={Wrench}
            judul="Mencatat biaya service"
            langkah={[
              <>
                Buka <Tekan>Service</Tekan>. Setiap jam di bengkel punya satu kartu sendiri.
              </>,
              <>
                Pilih <Isi>Komponen</Isi> (Batre / Strap / Kaca / Mesin / Lainnya), isi{" "}
                <Isi>Deskripsi</Isi> bila perlu dan <Isi>Biaya</Isi>, lalu{" "}
                <Tekan>Tambah</Tekan>.
              </>,
              <>
                Ulangi untuk setiap komponen. Angka <Isi>HPP sekarang</Isi> di kanan atas
                kartu langsung ikut naik.
              </>,
              <>
                Kalau salah input, tekan ikon tempat sampah di baris komponennya — HPP ikut
                turun kembali.
              </>,
              <>
                Setelah semua beres, tekan{" "}
                <Tekan>Service selesai — kembali ke QC</Tekan>. Setelah ini biaya di tiket
                tersebut terkunci.
              </>,
            ]}
          />

          <AlurKerja
            ikon={Receipt}
            judul="Membuat nota penjualan"
            langkah={[
              <>
                Buka <Tekan>Penjualan</Tekan> → <Tekan>Transaksi baru</Tekan>.
              </>,
              <>
                Isi <Isi>Tanggal</Isi>, pilih <Isi>Tipe Pembeli</Isi> (B2B pilih mitra, B2C
                boleh ketik nama pembeli) dan <Isi>Channel</Isi>.
              </>,
              <>
                Di bagian <Isi>Unit yang Dijual</Isi>, cari unitnya lalu tekan{" "}
                <Tekan>Tambah</Tekan>. Bisa beberapa unit dalam satu nota. Harga jual sudah
                terisi dari harga list — ubah kalau ada nego.
              </>,
              <>
                Isi <Isi>Ongkir</Isi> bila ada, dan tentukan{" "}
                <Isi>ditanggung Pembeli atau Toko</Isi>.
              </>,
              <>
                Pilih <Isi>Metode Bayar</Isi>. Kalau <Isi>Piutang</Isi>, isi DP dan jatuh
                temponya.
              </>,
              <>
                Periksa kotak <Isi>Ringkasan</Isi> di kanan — total tagihan dan laba
                estimasi tampil di sana — lalu <Tekan>Simpan transaksi</Tekan>.
              </>,
            ]}
          />

          <AlurKerja
            ikon={Boxes}
            judul="Memakai sparepart dari stok saat service"
            langkah={[
              <>
                Pastikan barangnya sudah ada di <Tekan>Stok Sparepart</Tekan> dan stoknya
                terisi.
              </>,
              <>
                Di kartu service, pindah ke tab <Tekan>Ambil dari stok</Tekan>.
              </>,
              <>
                Pilih sparepartnya — daftar sudah menampilkan sisa stok dan harga rata-ratanya
                — lalu isi jumlah yang dipakai.
              </>,
              <>
                Tekan <Tekan>Ambil</Tekan>. Stok berkurang, HPP jam bertambah, dan{" "}
                <strong>kas tidak berubah</strong>.
              </>,
            ]}
          />

          <AlurKerja
            ikon={Wallet}
            judul="Menerima pembayaran piutang"
            langkah={[
              <>
                Buka <Tekan>Piutang</Tekan>. Tagihan yang lewat jatuh tempo ditandai merah.
              </>,
              <>
                Tekan <Tekan>Catat bayar</Tekan> pada barisnya.
              </>,
              <>
                Jumlahnya sudah terisi penuh sesuai sisa tagihan. Kalau bayarnya sebagian,
                ubah angkanya.
              </>,
              <>
                Tekan <Tekan>Simpan pembayaran</Tekan>. Status berubah sendiri ke{" "}
                <Badge warna="hijau">Lunas</Badge> begitu sisanya nol.
              </>,
            ]}
          />

          <AlurKerja
            ikon={ReceiptText}
            judul="Mencatat biaya toko"
            langkah={[
              <>
                Buka <Tekan>Biaya Operasional</Tekan> → <Tekan>Catat biaya</Tekan>.
              </>,
              <>
                Pilih kategorinya (Sewa, Gaji, Listrik, dan seterusnya), tulis deskripsi
                singkat, isi jumlah dan tanggalnya.
              </>,
              <>
                Tekan <Tekan>Simpan</Tekan>. Uang otomatis keluar dari kas, dan laba bulan ini
                langsung berkurang.
              </>,
            ]}
          />

          <AlurKerja
            ikon={Wallet}
            judul="Menyetor modal atau mengambil untuk pribadi"
            langkah={[
              <>
                Buka <Tekan>Kas</Tekan> → <Tekan>Catat kas</Tekan>.
              </>,
              <>
                Pilih <Isi>Setor Modal</Isi> kalau memasukkan uang, atau <Isi>Prive</Isi> kalau
                mengambil untuk keperluan pribadi.
              </>,
              <>
                Isi jumlah, tanggal, dan keterangan singkat, lalu <Tekan>Simpan</Tekan>.
              </>,
              <>
                Keduanya <strong>tidak mempengaruhi laba</strong> — hanya menggeser saldo kas.
              </>,
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

function AlurKerja({
  ikon: Ikon,
  judul,
  langkah,
}: {
  ikon: React.ElementType;
  judul: string;
  langkah: React.ReactNode[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          <Ikon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{judul}</h3>
      </div>
      <Langkah>{langkah}</Langkah>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Per Halaman
// ---------------------------------------------------------------------------

const HALAMAN = [
  {
    ikon: LayoutDashboard,
    nama: "Dashboard",
    href: "/",
    untuk: "Melihat posisi bisnis dalam satu layar.",
    isi: [
      "Saldo Kas, Omzet, Laba Kotor Barang, dan Laba Bersih Usaha ada di baris pertama — empat angka yang paling sering Anda butuhkan.",
      "Modal Terpakai, Biaya Service, Biaya Operasional, dan Kerugian mengikuti bulan yang dipilih di kanan atas.",
      "Saldo Kas, Nilai Stok, Nilai Sparepart, dan Piutang Berjalan adalah posisi saat ini, bukan angka bulanan — tidak berubah walau bulannya diganti.",
      "Panel Posisi Keuangan mencocokkan saldo kas dengan modal, laba, persediaan, dan piutang. Kalau bertanda hijau, seluruh transaksi sudah tercatat lengkap.",
      "Barang Mengendap menampilkan unit Ready yang sudah lebih dari 30 hari belum laku, diurutkan dari yang paling lama.",
      "Ranking Produk menunjukkan model mana yang paling laku, paling untung, dan paling cepat laku — dikelompokkan per model, bukan per unit.",
      "Ranking Mitra dan Tren 6 Bulan untuk melihat siapa pembeli terbaik dan arah bisnisnya.",
    ],
  },
  {
    ikon: ShoppingCart,
    nama: "Beli Produk",
    href: "/beli",
    untuk: "Memasukkan jam baru ke sistem.",
    isi: [
      "Satu form = satu jam. App ini mencatat pembelian satuan, bukan borongan.",
      "Kode unit dibuat otomatis dengan pola BRAND-001, bernomor urut sendiri per brand.",
      "Di sebelah kanan ada daftar jam yang baru dibeli dan masih menunggu QC.",
    ],
  },
  {
    ikon: ClipboardCheck,
    nama: "QC",
    href: "/qc",
    untuk: "Gerbang masuk inventory.",
    isi: [
      "Selama belum lolos QC, jam tidak akan muncul sebagai stok siap jual dan tidak bisa dimasukkan ke nota penjualan.",
      "Harga jual dan grade wajib diisi saat meluluskan — inilah yang jadi harga list di halaman penjualan nanti.",
      "Jam yang datang dari bengkel diberi tanda Pasca service, supaya Anda tahu itu pemeriksaan ulang.",
    ],
  },
  {
    ikon: Wrench,
    nama: "Service",
    href: "/service",
    untuk: "Mencatat semua uang yang keluar untuk memperbaiki jam.",
    isi: [
      "Setiap jam di bengkel tampil sebagai kartu, lengkap dengan HPP terkini dan sudah berapa hari di bengkel.",
      "Komponen bisa datang dari dua sumber: Beli langsung (uang keluar dari kas saat itu) atau Ambil dari stok sparepart (kas tidak berkurang, karena uangnya sudah keluar saat sparepart dibeli).",
      "Jenis komponen: Batre, Strap, Kaca, Mesin, dan Lainnya. Pilihan Lainnya wajib diisi deskripsinya.",
      "Selama tiket masih berjalan, biaya boleh ditambah dan dihapus. Setelah ditandai selesai, terkunci.",
    ],
  },
  {
    ikon: Package,
    nama: "Inventory",
    href: "/unit",
    untuk: "Daftar lengkap semua unit, termasuk yang sudah terjual dan rusak.",
    isi: [
      "Filter berdasarkan status, brand, grade, dan umur stok. Pencarian menerima kode unit, brand, maupun model.",
      "Umur stok diberi warna: hijau sampai 30 hari, kuning 31–60 hari, merah di atas 60 hari.",
      "Nama jam otomatis mendapat imbuhan dari service yang pernah dikerjakan, misalnya Seiko 1002 (Ganti Strap). Imbuhan ini hanya untuk tampilan — pengelompokan di Ranking Produk tetap memakai Seiko 1002.",
      "Kolom Margin memakai warna merah bila harga jual berada di bawah HPP.",
      "Klik kode unit untuk membuka riwayat lengkapnya: pembelian, semua QC, semua service beserta rinciannya, penjualan, dan pergerakan stok.",
    ],
  },
  {
    ikon: Receipt,
    nama: "Penjualan",
    href: "/penjualan",
    untuk: "Semua nota keluar, B2B maupun B2C.",
    isi: [
      "Satu nota bisa memuat banyak unit — cocok untuk mitra yang borong.",
      "Klik nomor nota untuk melihat rincian per unit beserta laba masing-masing dan riwayat pembayarannya.",
      "Tombol Bayar muncul pada nota yang masih punya sisa tagihan.",
    ],
  },
  {
    ikon: Wallet,
    nama: "Piutang",
    href: "/piutang",
    untuk: "Menagih. Menampilkan seluruh tagihan belum lunas dari semua periode.",
    isi: [
      "Kolom Umur menunjukkan sudah berapa hari sejak transaksi dibuat.",
      "Baris yang lewat jatuh tempo diberi latar merah dan penanda Terlewat.",
      "Pembayaran boleh dicicil berkali-kali sampai lunas.",
    ],
  },
  {
    ikon: Store,
    nama: "Mitra",
    href: "/mitra",
    untuk: "Data pembeli B2B sekaligus rapor mereka.",
    isi: [
      "Ranking bisa diurutkan berdasarkan omzet, laba, atau jumlah unit, dengan filter periode.",
      "Kolom Piutang selalu sepanjang waktu, bukan per periode — karena ia posisi utang, bukan kinerja bulanan.",
      "Mitra yang sudah pernah bertransaksi tidak bisa dihapus. Nonaktifkan saja lewat tombol edit supaya riwayatnya tetap utuh.",
    ],
  },
  {
    ikon: Boxes,
    nama: "Stok Sparepart",
    href: "/sparepart",
    untuk: "Persediaan batre, strap, kaca, dan mesin yang Anda stok sendiri.",
    isi: [
      "Membeli sparepart mengeluarkan uang dari kas dan menambah nilai persediaan. Memakainya saat service tidak mengeluarkan uang lagi — nilainya pindah ke HPP jam.",
      "Harga pokok memakai rata-rata bergerak: beli 10 pcs @15.000 lalu 10 pcs @25.000 membuat harga rata-rata jadi 20.000, dan itulah yang dibebankan saat dipakai.",
      "Isi kolom Min. stok untuk mendapat peringatan di Dashboard saat barang menipis.",
      "Tombol stok opname untuk menyesuaikan dengan hitungan fisik. Selisih kurang dicatat sebagai kerugian di Laporan L/R.",
    ],
  },
  {
    ikon: Wallet,
    nama: "Kas",
    href: "/kas",
    untuk: "Buku kas tunggal — semua uang masuk dan keluar.",
    isi: [
      "Sebagian besar barisnya dibuat otomatis: beli jam, biaya service, beli sparepart, penerimaan penjualan, pelunasan piutang, ongkir toko, dan biaya operasional.",
      "Yang perlu Anda input sendiri hanya empat: setor modal, prive, pemasukan/pengeluaran lain, dan penyesuaian saat hitung fisik berbeda.",
      "Baris bergambar gembok tidak bisa dihapus dari sini — batalkan transaksi asalnya kalau memang salah.",
      "Kolom Saldo menampilkan saldo berjalan setelah setiap baris, jadi mudah ditelusuri kapan kas mulai menipis.",
    ],
  },
  {
    ikon: ReceiptText,
    nama: "Biaya Operasional",
    href: "/biaya",
    untuk: "Sewa, gaji, listrik, dan biaya menjalankan toko lainnya.",
    isi: [
      "Berbeda dari biaya service: biaya operasional langsung memotong laba bulan berjalan, tidak menunggu barang terjual.",
      "Uangnya otomatis keluar dari kas pada tanggal yang Anda isi.",
      "Rekap per kategori membantu melihat pengeluaran terbesar tiap bulan.",
      "Inilah yang membuat Laporan L/R bisa menampilkan laba bersih usaha, bukan sekadar laba kotor barang.",
    ],
  },
  {
    ikon: BadgeAlert,
    nama: "Barang Rusak",
    href: "/rusak",
    untuk: "Daftar jam yang ditulis-hapus beserta total kerugiannya.",
    isi: [
      "Kerugian yang dicatat adalah HPP penuh: harga beli ditambah biaya service yang terlanjur dikeluarkan.",
      "Tombol Batalkan mengembalikan unit ke status sebelumnya dan menghapus kerugiannya dari laporan.",
    ],
  },
  {
    ikon: ScrollText,
    nama: "Stok Ledger",
    href: "/ledger",
    untuk: "Bukti audit. Semua perpindahan barang, urut waktu.",
    isi: [
      "Isinya dibuat sistem sendiri. Tidak ada tombol tambah — memang disengaja, supaya catatan stok tidak pernah berbeda dengan kenyataan.",
      "Dipakai kalau ada angka yang mencurigakan dan Anda perlu menelusuri sebuah unit dari awal.",
    ],
  },
  {
    ikon: TrendingUp,
    nama: "Laporan L/R",
    href: "/laporan",
    untuk: "Tutup bulan.",
    isi: [
      "Perhitungannya dua tingkat: Laba Kotor Barang (hasil jual-beli jam), lalu Laba Bersih Usaha setelah dikurangi biaya menjalankan toko.",
      "Di bawahnya ada rincian per unit terjual — baris yang rugi diberi latar merah.",
      "Export Excel menghasilkan empat sheet: Ringkasan, Biaya Operasional, Unit Terjual, dan Barang Rusak.",
    ],
  },
];

function TabHalaman() {
  return (
    <div className="space-y-3">
      {HALAMAN.map((h) => {
        const Ikon = h.ikon;
        return (
          <Card key={h.nama}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <Ikon className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {h.nama}
                </h2>
              </div>
              <Link
                href={h.href}
                className="text-sm text-blue-700 hover:underline dark:text-blue-400"
              >
                Buka halaman →
              </Link>
            </div>

            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {h.untuk}
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {h.isi.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Aturan Hitung
// ---------------------------------------------------------------------------

function Rumus({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-sm text-gray-900 dark:bg-zinc-900 dark:text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

function TabHitung() {
  return (
    <div className="space-y-4">
      <Kotak nada="penting" judul="Bagian ini menentukan semua angka di app">
        <p>
          Kalau Anda pernah merasa &ldquo;kok labanya beda dengan hitungan saya&rdquo;,
          jawabannya hampir pasti ada di halaman ini. Bacanya sekali saja, tapi pelan-pelan.
        </p>
      </Kotak>

      <Card>
        <JudulBagian sub="Modal sebenarnya dari sebuah jam.">HPP per unit</JudulBagian>
        <Rumus>{`HPP = Harga Beli + seluruh Biaya Service pada unit itu`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Contoh: jam dibeli <strong>Rp 1.200.000</strong>, ganti batre{" "}
          <strong>Rp 50.000</strong>, ganti mesin <strong>Rp 350.000</strong> →{" "}
          HPP-nya <strong>Rp 1.600.000</strong>. Angka inilah pembanding harga jual, bukan
          harga belinya.
        </p>
      </Card>

      <Card>
        <JudulBagian sub="Dihitung dan dikunci saat nota disimpan.">Laba per unit</JudulBagian>
        <Rumus>{`Laba unit = Harga Jual − HPP saat dijual`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Melanjutkan contoh di atas: dijual <strong>Rp 2.300.000</strong> → laba{" "}
          <strong>Rp 700.000</strong>.
        </p>
        <Kotak nada="info" className="mt-3">
          <p>
            <strong>Kenapa dikunci?</strong> Supaya laporan bulan lalu tidak berubah sendiri
            kalau ada data yang disentuh belakangan. Nota yang sudah jadi adalah catatan
            sejarah — angkanya tetap seperti saat kejadian.
          </p>
        </Kotak>
      </Card>

      <Card>
        <JudulBagian sub="Angka besar di Dashboard dan Laporan — dihitung dua tingkat.">
          Laba/Rugi periode
        </JudulBagian>
        <Rumus>{`Laba Kotor Barang = Omzet
    − Modal            (harga beli unit yang terjual)
    − Biaya Service    (yang menempel pada unit terjual)
    − Kerugian Barang Rusak
    − Kerugian Sparepart
    − Ongkir yang ditanggung toko

Laba Bersih Usaha = Laba Kotor Barang
    − Biaya Operasional (sewa, gaji, listrik, dll)`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          <strong>Omzet</strong> adalah jumlah harga jual unit-unit yang terjual. Ongkir yang
          ditagihkan ke pembeli <strong>bukan</strong> omzet — itu uang titipan untuk kurir,
          bukan hasil jualan jam.
        </p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Dipisah dua tingkat supaya Anda bisa membedakan dua hal yang berbeda:{" "}
          <strong>apakah cara Anda membeli dan menjual jam sudah menguntungkan</strong> (laba
          kotor barang), dan <strong>apakah usahanya secara keseluruhan menghasilkan</strong>{" "}
          setelah semua biaya toko dibayar (laba bersih usaha).
        </p>
      </Card>

      <Card>
        <JudulBagian sub="Kenapa nama jam berubah setelah diservice, tapi rankingnya tidak terpecah.">
          Penamaan unit
        </JudulBagian>
        <Rumus>{`Nama dasar   = Brand + Model              -> "Seiko 1002"
Nama lengkap = Nama dasar + (service)     -> "Seiko 1002 (Ganti Strap)"`}</Rumus>

        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Isi kurung diambil dari komponen yang pernah diganti pada jam itu. Kalau
          servicenya lebih dari satu, semuanya ikut tampil urut waktu:{" "}
          <code>Seiko 1002 (Ganti Batre, Ganti Mesin)</code>. Komponen yang sama diganti dua
          kali tetap tampil sekali — yang penting jenis pekerjaannya, bukan berapa kali.
        </p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Untuk komponen berjenis <Isi>Lainnya</Isi>, yang dipakai adalah deskripsi yang Anda
          tulis — <code>Orient Bambino (Poles Case)</code> — karena
          &ldquo;Ganti Lainnya&rdquo; tidak memberi tahu apa pun.
        </p>

        <Kotak nada="penting" className="mt-3" judul="Ranking selalu memakai nama dasar">
          <p>
            Tiga unit <code>Seiko 1002</code> dengan service berbeda tetap dihitung sebagai{" "}
            <strong>satu produk</strong> di Ranking Produk. Kalau imbuhan service ikut
            mengelompokkan, satu model bisa terpecah jadi belasan baris dan rankingnya jadi
            tidak berguna.
          </p>
        </Kotak>

        <Kotak nada="info" className="mt-3" judul="Nota ke pembeli tetap polos">
          <p>
            Rincian nota penjualan menampilkan <code>Seiko 1002</code> saja, tanpa imbuhan
            service. Riwayat perbaikan adalah catatan internal Anda — pembeli tidak perlu
            melihatnya di dokumen transaksi.
          </p>
        </Kotak>
      </Card>

      <Card>
        <JudulBagian sub="Uang yang benar-benar ada, terpisah dari laba.">Kas</JudulBagian>
        <Rumus>{`Saldo Kas = seluruh uang masuk − seluruh uang keluar`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Hampir semua barisnya ditulis sistem sendiri. Yang Anda input manual hanya setor
          modal, prive, pemasukan/pengeluaran lain, dan penyesuaian.
        </p>

        <Kotak nada="penting" className="mt-3" judul="Laba dan kas adalah dua hal berbeda">
          <p>
            Laba tinggi tidak berarti kas tebal — uangnya bisa sedang tertahan di barang yang
            belum laku atau di piutang yang belum tertagih. Sebaliknya, kas tebal tidak
            berarti untung — bisa saja itu uang setoran modal yang belum terpakai.
          </p>
        </Kotak>

        <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-50">
          Pemeriksaan silang yang selalu berlaku
        </p>
        <Rumus>{`Saldo Kas = Modal Disetor − Prive + Laba Kumulatif
            − Nilai Persediaan − Piutang`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Inilah yang dihitung panel <Isi>Posisi Keuangan</Isi> di Dashboard. Kalau hasilnya
          sama dengan saldo kas sesungguhnya, berarti tidak ada transaksi yang terlewat. Kalau
          berbeda, biasanya ada biaya yang lupa dicatat.
        </p>
      </Card>

      <Card>
        <JudulBagian sub="Kenapa memakai sparepart tidak mengurangi kas.">
          Sparepart
        </JudulBagian>
        <Rumus>{`Harga rata-rata baru =
    (stok lama × harga lama) + (qty masuk × harga masuk)
    ────────────────────────────────────────────────────
                  stok lama + qty masuk

Biaya saat dipakai = qty dipakai × harga rata-rata`}</Rumus>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Contoh: beli 10 batre @<strong>Rp 15.000</strong>, lalu 10 lagi @
          <strong>Rp 25.000</strong>. Stok jadi 20 dengan harga rata-rata{" "}
          <strong>Rp 20.000</strong>. Memakai 2 batre membebankan{" "}
          <strong>Rp 40.000</strong> ke HPP jam.
        </p>
        <Kotak nada="penting" className="mt-3" judul="Uangnya hanya keluar sekali">
          <p>
            Kas berkurang <strong>saat sparepart dibeli</strong>, bukan saat dipakai. Waktu
            dipakai, nilainya cuma <em>berpindah</em> dari persediaan sparepart ke HPP jam.
            Kalau keduanya memotong kas, biaya batre terhitung dua kali dan laba jadi terlihat
            lebih kecil dari kenyataan.
          </p>
        </Kotak>
      </Card>

      <Card>
        <JudulBagian sub="Bagian yang paling sering disalahpahami.">
          Kapan sebuah biaya dianggap beban
        </JudulBagian>

        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Biaya service → beban saat unitnya TERJUAL
            </p>
            <p className="mt-1">
              Bulan ini Anda keluar Rp 2.000.000 untuk service 5 jam, tapi belum satu pun
              laku. Laba bulan ini <strong>tidak berkurang</strong>. Uang itu berubah wujud
              jadi barang yang nilainya naik — tercatat di <Isi>Nilai Stok</Isi>. Bebannya
              muncul nanti, di bulan jamnya laku.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Kerugian barang rusak → beban saat itu juga
            </p>
            <p className="mt-1">
              Berbeda dengan service, jam yang dipindahkan ke Rusak langsung memotong laba
              pada tanggal write-off. Karena barangnya memang sudah tidak akan menghasilkan
              apa-apa.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Biaya operasional → beban saat itu juga
            </p>
            <p className="mt-1">
              Sewa, gaji, dan listrik tidak menempel pada barang mana pun, jadi tidak ada yang
              perlu ditunggu. Bayar sewa Rp 3.000.000 hari ini, laba bulan ini langsung
              berkurang Rp 3.000.000.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Modal dan prive → tidak pernah menyentuh laba
            </p>
            <p className="mt-1">
              Menyetor modal bukan penghasilan, dan mengambil uang untuk keperluan pribadi
              bukan biaya usaha. Keduanya hanya menggeser saldo kas. Kalau prive dianggap
              biaya, laba usaha Anda akan terlihat lebih buruk dari kenyataan.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              Omzet → diakui saat transaksi, bukan saat uang diterima
            </p>
            <p className="mt-1">
              Jual tempo Rp 6.500.000 hari ini, dibayar bulan depan? Omzet bulan ini tetap
              Rp 6.500.000. Uang yang belum masuk dilaporkan terpisah di{" "}
              <Isi>Piutang Berjalan</Isi>. Jadi <strong>laba tinggi tidak berarti kas
              tebal</strong> — selalu baca dua angka itu berpasangan.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <JudulBagian>Angka lain</JudulBagian>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Angka</Th>
                <Th>Cara hitung</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              <tr>
                <Td className="font-medium">Nilai Stok</Td>
                <Td className="whitespace-normal">
                  Jumlah HPP semua unit berstatus Ready. Unit yang masih di antrian QC atau
                  di bengkel belum dihitung.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Umur Stok</Td>
                <Td className="whitespace-normal">
                  Dihitung dari <strong>tanggal QC lolos</strong>, bukan tanggal beli.
                  Alasannya: selama masih di bengkel, jam itu memang belum bisa dijual, jadi
                  tidak adil dihitung mengendap.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Margin Kotor</Td>
                <Td className="whitespace-normal">
                  (Omzet − Modal − Biaya Service) ÷ Omzet. Tidak memperhitungkan kerugian
                  barang rusak.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Piutang Berjalan</Td>
                <Td className="whitespace-normal">
                  Total sisa tagihan seluruh nota yang belum lunas, dari semua periode.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Nilai Sparepart</Td>
                <Td className="whitespace-normal">
                  Jumlah (stok × harga rata-rata) seluruh sparepart.
                </Td>
              </tr>
              <tr>
                <Td className="font-medium">Nilai Persediaan</Td>
                <Td className="whitespace-normal">
                  Nilai Sparepart ditambah HPP <strong>semua</strong> unit yang belum keluar —
                  termasuk yang masih di antrian QC dan di bengkel. Dipakai untuk pemeriksaan
                  silang saldo kas.
                </Td>
              </tr>
            </tbody>
          </Tabel>
        </TabelWrap>
      </Card>

      <Kotak nada="bisa" judul="Laba bersih usaha sudah lengkap">
        <p>
          Sewa, gaji, listrik, dan biaya toko lainnya sudah ikut dihitung selama Anda
          mencatatnya di halaman <Tekan>Biaya Operasional</Tekan>. Angka{" "}
          <Isi>Laba Bersih Usaha</Isi> adalah hasil akhir yang sesungguhnya.
        </p>
        <p>
          Yang belum termasuk hanyalah penyusutan aset tetap (etalase, komputer) dan pajak
          penghasilan — keduanya di luar cakupan app ini.
        </p>
      </Kotak>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Cakupan & Batasan
// ---------------------------------------------------------------------------

const BISA = [
  ["Beli jam satuan", "Beli Produk"],
  ["Pemeriksaan QC, berulang kali per unit", "QC"],
  ["Biaya service per komponen: batre, strap, kaca, mesin, lainnya", "Service"],
  ["Service berkali-kali pada unit yang sama", "Service"],
  ["Write-off jam rusak sebagai kerugian, beserta pembatalannya", "Barang Rusak"],
  ["Jual ke mitra/reseller (B2B), banyak unit dalam satu nota", "Penjualan"],
  ["Jual ke konsumen akhir (B2C), offline/COD maupun WA/sosmed", "Penjualan"],
  ["Nego harga — harga jual final boleh beda dari harga list", "Penjualan"],
  ["Jual rugi (harga jual di bawah HPP), dengan peringatan", "Penjualan"],
  ["Ongkir, ditanggung pembeli atau ditanggung toko", "Penjualan"],
  ["Pembayaran cash lunas di tempat", "Penjualan"],
  ["Pembayaran tempo: DP + jatuh tempo", "Penjualan"],
  ["Cicilan piutang berkali-kali sampai lunas", "Piutang"],
  ["Master mitra + ranking + posisi piutang per mitra", "Mitra"],
  ["Setor modal awal dan tambahan modal", "Kas"],
  ["Prive — ambil uang bisnis untuk keperluan pribadi", "Kas"],
  ["Saldo kas berjalan, otomatis dari semua transaksi", "Kas"],
  ["Penyesuaian kas saat hitung fisik berbeda dengan catatan", "Kas"],
  ["Biaya operasional: sewa, gaji, listrik, air, internet, transport, perlengkapan, pemasaran, pajak", "Biaya Operasional"],
  ["Stok sparepart dengan harga pokok rata-rata bergerak", "Stok Sparepart"],
  ["Pakai sparepart dari stok saat service, tanpa uang keluar dua kali", "Service"],
  ["Stok opname sparepart, susutnya jadi kerugian", "Stok Sparepart"],
  ["Peringatan sparepart menipis", "Dashboard"],
  ["Nama jam otomatis diberi imbuhan service, mis. Seiko 1002 (Ganti Strap)", "semua layar operasional"],
  ["Ranking produk per model — unit dengan service berbeda tetap satu kelompok", "Dashboard"],
  ["Laporan L/R dua tingkat: laba kotor barang dan laba bersih usaha", "Laporan L/R"],
  ["Pemeriksaan silang saldo kas terhadap modal, laba, persediaan, dan piutang", "Dashboard"],
  ["Daftar barang mengendap lebih dari 30 hari", "Dashboard"],
  ["Perbandingan omzet B2B vs B2C", "Dashboard"],
  ["Riwayat lengkap per unit dari beli sampai keluar", "Inventory → detail unit"],
  ["Export Excel: L/R, stok, ledger, piutang, kas, sparepart", "beberapa halaman"],
];

const BELUM = [
  {
    judul: "Retur — ke penjual asal maupun dari pembeli",
    kenapa:
      "Belum ada alur pengembalian barang. Nota yang sudah disimpan tidak bisa dibatalkan.",
    sementara:
      "Untuk retur dari pembeli, hubungi pembuat app — pembatalan nota perlu dikerjakan langsung di database.",
  },
  {
    judul: "Pembelian borongan (satu lot berisi banyak jam)",
    kenapa: "Form pembelian hanya menerima satu jam per transaksi.",
    sementara:
      "Bagi sendiri harga lot ke tiap unit, lalu input satu per satu dengan harga hasil pembagian itu.",
  },
  {
    judul: "Marketplace (Shopee, Tokopedia, TikTok) beserta biaya adminnya",
    kenapa: "Channel yang tersedia hanya Offline/COD dan WhatsApp/Sosmed.",
    sementara:
      "Catat sebagai WA/Sosmed, lalu masukkan biaya adminnya di Biaya Operasional kategori Lainnya supaya laba bersih usaha tetap mendekati kenyataan.",
  },
  {
    judul: "Foto unit dan spesifikasi teknis lengkap",
    kenapa: "Belum ada penyimpanan gambar.",
    sementara: "Pakai kolom Catatan Kondisi untuk menggambarkan kondisinya.",
  },
  {
    judul: "Banyak pengguna dengan hak akses berbeda",
    kenapa: "App ini dirancang untuk satu pemilik.",
    sementara: "—",
  },
  {
    judul: "Ganti password dari dalam app",
    kenapa: "Belum ada halaman pengaturan akun.",
    sementara: "—",
  },
  {
    judul: "Banyak rekening kas (laci toko, bank, e-wallet terpisah)",
    kenapa: "Buku kas hanya satu. Semua uang dianggap berada di satu tempat.",
    sementara:
      "Kalau perlu memisahkan, gunakan keterangan pada setiap baris kas untuk menandai sumbernya.",
  },
  {
    judul: "Penyusutan aset tetap dan pajak penghasilan",
    kenapa: "Di luar cakupan pembukuan sederhana ini.",
    sementara: "Hitung terpisah bila diperlukan untuk pelaporan pajak.",
  },
  {
    judul: "Mengedit biaya operasional atau baris kas yang sudah disimpan",
    kenapa: "Hanya tersedia hapus, bukan edit — supaya jejaknya jelas.",
    sementara: "Hapus lalu catat ulang dengan angka yang benar.",
  },
];

function TabCakupan() {
  return (
    <div className="space-y-4">
      <Kotak nada="bisa" judul="Yang sudah tercakup">
        <p>
          Seluruh transaksi di bawah ini bisa dicatat penuh dan otomatis masuk ke laporan.
        </p>
      </Kotak>

      <Card>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Transaksi</Th>
                <Th>Dikerjakan di</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {BISA.map(([apa, di]) => (
                <tr key={apa}>
                  <Td className="whitespace-normal">{apa}</Td>
                  <Td className="whitespace-normal text-gray-600 dark:text-gray-400">
                    {di}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        </TabelWrap>
      </Card>

      <Kotak nada="bahaya" judul="Yang belum bisa dicatat di app ini">
        <p>
          Ditulis terbuka supaya tidak ada salah paham di kemudian hari. Semuanya bisa
          ditambahkan nanti bila dibutuhkan.
        </p>
        <p>
          Kas &amp; modal, biaya operasional, dan stok sparepart{" "}
          <strong>sudah tidak ada di daftar ini</strong> — ketiganya sekarang tersedia penuh.
        </p>
      </Kotak>

      <div className="space-y-3">
        {BELUM.map((b) => (
          <Card key={b.judul}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {b.judul}
            </h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-gray-600 dark:text-gray-400">Kenapa</dt>
                <dd className="text-gray-800 dark:text-gray-200">{b.kenapa}</dd>
              </div>
              {b.sementara !== "—" && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-gray-600 dark:text-gray-400">
                    Sementara
                  </dt>
                  <dd className="text-gray-800 dark:text-gray-200">{b.sementara}</dd>
                </div>
              )}
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
