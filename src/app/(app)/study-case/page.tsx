"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
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
import { Isi, JudulBagian, Kotak, Langkah, Tekan } from "@/components/panduan/ui-panduan";
import { formatRupiah } from "@/lib/utils";

// ---------------------------------------------------------------------------

function Rp({ n }: { n: number }) {
  return <span className="tabular-nums">{formatRupiah(n)}</span>;
}

function Kasus({
  kode,
  judul,
  situasi,
  status,
  children,
}: {
  kode: string;
  judul: string;
  situasi: React.ReactNode;
  status: "bisa" | "tidak";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white dark:bg-blue-500">
            {kode}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              {judul}
            </h2>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{situasi}</p>
          </div>
        </div>
        {status === "bisa" ? (
          <Badge warna="hijau">Bisa dicatat</Badge>
        ) : (
          <Badge warna="merah">Belum tercakup</Badge>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Blok({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        {judul}
      </p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

const JAM = [
  { k: "A", kode: "SEIKO-001", nama: "Seiko SNK809", beli: 1_200_000 },
  { k: "B", kode: "CASIO-001", nama: "Casio AE1200", beli: 250_000 },
  { k: "C", kode: "ORIENT-001", nama: "Orient Bambino", beli: 900_000 },
  { k: "D", kode: "SEIKO-002", nama: "Seiko SKX007", beli: 3_000_000 },
  { k: "E", kode: "CITIZEN-001", nama: "Citizen NH8350", beli: 1_500_000 },
];

const QC_HASIL = [
  { k: "A", kode: "SEIKO-001", beli: 1_200_000, service: 0, komponen: "—", hpp: 1_200_000, grade: "A", jual: 1_800_000 },
  { k: "B", kode: "CASIO-001", beli: 250_000, service: 150_000, komponen: "Strap", hpp: 400_000, grade: "B", jual: 700_000 },
  { k: "C", kode: "ORIENT-001", beli: 900_000, service: 200_000, komponen: "Kaca", hpp: 1_100_000, grade: "B", jual: 1_600_000 },
  { k: "D", kode: "SEIKO-002", beli: 3_000_000, service: 600_000, komponen: "Mesin", hpp: 3_600_000, grade: "A", jual: 4_800_000 },
  { k: "E", kode: "CITIZEN-001", beli: 1_500_000, service: 700_000, komponen: "Mesin", hpp: 2_200_000, grade: "B", jual: 2_900_000 },
];

export default function HalamanStudyCase() {
  return (
    <>
      <PageHeader
        judul="Study Case"
        deskripsi="Satu cerita utuh dari setor modal sampai tutup bulan, plus kasus-kasus yang sering terjadi."
        aksi={
          <Link href="/panduan">
            <Button varian="secondary">
              <BookOpen className="h-4 w-4" /> Kembali ke Panduan
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <Kotak nada="info" judul="Cara membaca halaman ini">
          <p>
            Kasus <strong>A sampai H</strong> adalah satu cerita berurutan — angkanya
            nyambung dari setor modal sampai laporan akhir bulan. Kasus{" "}
            <strong>I ke bawah</strong> berdiri sendiri, untuk situasi yang sesekali muncul.
          </p>
          <p>
            Semua angka di halaman ini adalah hasil sesungguhnya dari app, bukan ilustrasi.
          </p>
        </Kotak>

        {/* ================= A ================= */}
        <Kasus
          kode="A"
          judul="Setor modal awal Rp 10.000.000"
          situasi="Uang pribadi dimasukkan ke bisnis sebagai modal jalan."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Kas</Tekan> → <Tekan>Catat kas</Tekan>.
              </>
              <>
                Pilih jenis <Isi>Setor Modal</Isi>.
              </>
              <>
                Isi jumlah <strong>Rp 10.000.000</strong>, tanggal, dan keterangan seperti{" "}
                <em>&ldquo;setoran modal awal&rdquo;</em>.
              </>
              <>
                Tekan <Tekan>Simpan</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Yang berubah</Th>
                    <Th>Menjadi</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Saldo Kas</Td>
                    <Td className="font-semibold text-green-700 dark:text-green-400">
                      <Rp n={10_000_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Modal Disetor (Posisi Keuangan)</Td>
                    <Td>
                      <Rp n={10_000_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Laba</Td>
                    <Td className="whitespace-normal">
                      <strong>Tidak berubah.</strong> Modal bukan penghasilan — Anda hanya
                      memindahkan uang dari kantong pribadi ke bisnis.
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Kerjakan ini paling awal">
            <p>
              Kalau modal belum dicatat lalu Anda langsung belanja jam, saldo kas akan tampil{" "}
              <strong>minus</strong> — bukan karena app salah, tapi karena app tidak tahu dari
              mana uang belanjanya berasal.
            </p>
          </Kotak>

          <Kotak nada="info" judul="Kalau nanti menambah modal lagi">
            <p>
              Ulangi langkah yang sama. Tidak ada batasan berapa kali menyetor modal. Untuk
              arah sebaliknya — mengambil uang bisnis untuk keperluan pribadi — pakai jenis{" "}
              <Isi>Prive</Isi>, lihat kasus <Isi>S</Isi>.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= B ================= */}
        <Kasus
          kode="B"
          judul="Beli 5 jam sekaligus: A, B, C, D, E"
          situasi="Belanja dari beberapa penjual dalam satu hari, total Rp 6.850.000."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Beli Produk</Tekan>.
              </>
              <>
                Input <strong>satu jam dulu</strong>: pilih brand, isi model, harga beli,
                tanggal → <Tekan>Simpan &amp; masukkan ke antrian QC</Tekan>.
              </>
              <>
                Form kembali kosong dengan brand masih terpilih. Ulangi untuk jam kedua,
                ketiga, dan seterusnya.
              </>
              <>
                Setiap kali simpan, jam yang baru masuk langsung tampil di daftar kanan
                layar.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jam</Th>
                    <Th>Kode otomatis</Th>
                    <Th>Model</Th>
                    <Th className="text-right">Harga Beli</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {JAM.map((j) => (
                    <tr key={j.k}>
                      <Td className="font-semibold">{j.k}</Td>
                      <Td className="font-medium">{j.kode}</Td>
                      <Td>{j.nama}</Td>
                      <Td className="text-right">
                        <Rp n={j.beli} />
                      </Td>
                      <Td>
                        <BadgeStatus status="MASUK_QC" />
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-zinc-900/60">
                    <Td colSpan={3} className="font-semibold">
                      Total modal keluar
                    </Td>
                    <Td className="text-right font-semibold">
                      <Rp n={6_850_000} />
                    </Td>
                    <Td />
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Perhatikan penomorannya">
            <p>
              Nomor urut jalan <strong>per brand</strong>, bukan global. Dua jam Seiko jadi{" "}
              <code>SEIKO-001</code> dan <code>SEIKO-002</code>, sementara Casio pertama
              tetap <code>CASIO-001</code>.
            </p>
            <p>
              Kelima jam ini <strong>belum muncul sebagai stok siap jual</strong> dan belum
              masuk Nilai Stok. Uangnya sudah keluar, tapi barangnya belum lolos pemeriksaan.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= C ================= */}
        <Kasus
          kode="C"
          judul="QC: A langsung lolos, B/C/D/E harus diservice"
          situasi="B ganti strap, C ganti kaca, D dan E ganti mesin."
          status="bisa"
        >
          <Blok judul="Untuk A — yang langsung bagus">
            <Langkah>
              <>
                <Tekan>QC</Tekan> → cari <code>SEIKO-001</code> → tekan{" "}
                <Tekan>Lolos</Tekan>.
              </>
              <>
                Pilih grade <Isi>A — Mulus</Isi>, isi harga jual{" "}
                <strong>Rp 1.800.000</strong>, centang kelengkapan yang ada.
              </>
              <>
                Tekan <Tekan>Masukkan ke inventory</Tekan>. Statusnya jadi{" "}
                <BadgeStatus status="READY" /> dan umur stoknya mulai dihitung hari ini.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Untuk B, C, D, E — yang perlu diperbaiki">
            <Langkah>
              <>
                <Tekan>QC</Tekan> → tekan <Tekan>Gagal</Tekan> pada unitnya.
              </>
              <>
                Tulis masalahnya, misalnya <em>&ldquo;strap sobek&rdquo;</em> untuk B atau{" "}
                <em>&ldquo;mesin mati total&rdquo;</em> untuk D. Ini wajib diisi.
              </>
              <>
                Tekan <Tekan>Kirim ke service</Tekan>. Unit pindah ke{" "}
                <BadgeStatus status="SERVICE" /> dan tiket bengkelnya dibuat otomatis.
              </>
              <>
                Buka <Tekan>Service</Tekan>. Pada kartu unitnya, pilih komponen yang
                diganti, isi biayanya, tekan <Tekan>Tambah</Tekan>. Angka{" "}
                <Isi>HPP sekarang</Isi> langsung ikut naik.
              </>
              <>
                Setelah perbaikan beres, tekan{" "}
                <Tekan>Service selesai — kembali ke QC</Tekan>.
              </>
              <>
                Unit muncul lagi di <Tekan>QC</Tekan> dengan tanda{" "}
                <Badge warna="kuning">Pasca service</Badge>. Periksa ulang, lalu{" "}
                <Tekan>Lolos</Tekan> seperti langkah A.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya setelah semua lolos QC">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jam</Th>
                    <Th>Kode</Th>
                    <Th className="text-right">Harga Beli</Th>
                    <Th>Komponen</Th>
                    <Th className="text-right">Biaya Service</Th>
                    <Th className="text-right">HPP</Th>
                    <Th>Grade</Th>
                    <Th className="text-right">Harga Jual</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {QC_HASIL.map((u) => (
                    <tr key={u.k}>
                      <Td className="font-semibold">{u.k}</Td>
                      <Td className="font-medium">{u.kode}</Td>
                      <Td className="text-right">
                        <Rp n={u.beli} />
                      </Td>
                      <Td>{u.komponen}</Td>
                      <Td className="text-right">
                        {u.service > 0 ? <Rp n={u.service} /> : "—"}
                      </Td>
                      <Td className="text-right font-semibold">
                        <Rp n={u.hpp} />
                      </Td>
                      <Td>{u.grade}</Td>
                      <Td className="text-right">
                        <Rp n={u.jual} />
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-zinc-900/60">
                    <Td colSpan={4} className="font-semibold">
                      Total
                    </Td>
                    <Td className="text-right font-semibold">
                      <Rp n={1_650_000} />
                    </Td>
                    <Td className="text-right font-semibold">
                      <Rp n={8_500_000} />
                    </Td>
                    <Td colSpan={2} />
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="info" judul="Kalau batrenya diambil dari stok sendiri">
            <p>
              Langkahnya sama, hanya di kartu service pindah ke tab{" "}
              <Tekan>Ambil dari stok</Tekan> lalu pilih sparepartnya. Bedanya:{" "}
              <strong>kas tidak berkurang</strong>, karena uangnya sudah keluar waktu
              sparepart dibeli. Lihat kasus <Isi>Q</Isi>.
            </p>
          </Kotak>

          <Kotak nada="info" judul="Inilah inti app ini">
            <p>
              Casio B dibeli <strong>Rp 250.000</strong>, tapi modal sebenarnya{" "}
              <strong>Rp 400.000</strong> setelah ganti strap. Kalau dijual Rp 350.000, di
              catatan biasa terlihat untung Rp 100.000 — padahal sebenarnya{" "}
              <strong>rugi Rp 50.000</strong>. App ini menutup celah itu.
            </p>
            <p>
              Sampai titik ini kas sudah keluar <strong>Rp 8.500.000</strong> (beli Rp
              6.850.000 + service Rp 1.650.000) — saldo kas turun dari Rp 10.000.000 menjadi{" "}
              <strong>Rp 1.500.000</strong>. Tapi <strong>belum ada satu rupiah pun beban di
              Laporan L/R</strong>. Semuanya masih berupa barang.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= D ================= */}
        <Kasus
          kode="D"
          judul="Jam E mati total seminggu setelah lolos QC"
          situasi="Citizen NH8350 sudah di etalase, tiba-tiba mati dan tidak bisa diperbaiki lagi."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Inventory</Tekan>, cari <code>CITIZEN-001</code>.
              </>
              <>
                Tekan <Tekan>Rusak</Tekan> di ujung barisnya. (Bisa juga dari halaman detail
                unit, tombol <Tekan>Pindahkan ke RUSAK</Tekan>.)
              </>
              <>
                Tulis alasannya, misalnya <em>&ldquo;mesin mati total setelah 1 minggu,
                tidak bisa diperbaiki&rdquo;</em>.
              </>
              <>
                Isi tanggal kejadian — <strong>bukan</strong> tanggal beli. Kerugian dicatat
                pada tanggal ini.
              </>
              <>
                Tekan <Tekan>Pindahkan ke RUSAK</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Yang berubah</Th>
                    <Th>Menjadi</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Status unit</Td>
                    <Td>
                      <BadgeStatus status="READY" /> → <BadgeStatus status="RUSAK" />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Kerugian yang dicatat</Td>
                    <Td className="font-semibold text-red-700 dark:text-red-400">
                      <Rp n={2_200_000} /> — HPP penuh, bukan harga belinya
                    </Td>
                  </tr>
                  <tr>
                    <Td>Nilai Stok</Td>
                    <Td>
                      Berkurang <Rp n={2_200_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Stok Ledger</Td>
                    <Td>Baris baru: Keluar — Barang Rusak, qty −1</Td>
                  </tr>
                  <tr>
                    <Td>Laba bulan ini</Td>
                    <Td>
                      Berkurang <Rp n={2_200_000} /> seketika
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Kerugiannya Rp 2.200.000, bukan Rp 1.500.000">
            <p>
              Yang hilang bukan cuma harga belinya. Uang Rp 700.000 untuk ganti mesin juga
              ikut hangus. App menghitung keduanya sekaligus, karena itulah kerugian yang
              sebenarnya.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= E ================= */}
        <Kasus
          kode="E"
          judul="Jual A dan B ke mitra, dibayar cash"
          situasi="Toko Waktu Jaya ambil dua unit sekaligus, bayar lunas di tempat."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Pastikan mitranya sudah terdaftar di <Tekan>Mitra</Tekan>. Kalau belum,{" "}
                <Tekan>Tambah mitra</Tekan> dulu.
              </>
              <>
                <Tekan>Penjualan</Tekan> → <Tekan>Transaksi baru</Tekan>.
              </>
              <>
                Tipe Pembeli <Isi>B2B — Mitra / Reseller</Isi>, pilih{" "}
                <Isi>Toko Waktu Jaya</Isi>, Channel <Isi>Offline / Toko / COD</Isi>.
              </>
              <>
                Di <Isi>Unit yang Dijual</Isi>: cari <code>SEIKO-001</code> →{" "}
                <Tekan>Tambah</Tekan>. Ulangi untuk <code>CASIO-001</code>. Harga jualnya
                sudah terisi otomatis dari harga list.
              </>
              <>
                Ongkir kosongkan, Metode Bayar <Isi>Cash — lunas di tempat</Isi>.
              </>
              <>
                Cek kotak <Isi>Ringkasan</Isi> di kanan, lalu{" "}
                <Tekan>Simpan transaksi</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya — satu nota, dua unit">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Unit</Th>
                    <Th className="text-right">HPP</Th>
                    <Th className="text-right">Harga Jual</Th>
                    <Th className="text-right">Laba</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td className="font-medium">SEIKO-001</Td>
                    <Td className="text-right">
                      <Rp n={1_200_000} />
                    </Td>
                    <Td className="text-right">
                      <Rp n={1_800_000} />
                    </Td>
                    <Td className="text-right text-green-700 dark:text-green-400">
                      <Rp n={600_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td className="font-medium">CASIO-001</Td>
                    <Td className="text-right">
                      <Rp n={400_000} />
                    </Td>
                    <Td className="text-right">
                      <Rp n={700_000} />
                    </Td>
                    <Td className="text-right text-green-700 dark:text-green-400">
                      <Rp n={300_000} />
                    </Td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-zinc-900/60">
                    <Td className="font-semibold">Total nota</Td>
                    <Td className="text-right font-semibold">
                      <Rp n={1_600_000} />
                    </Td>
                    <Td className="text-right font-semibold">
                      <Rp n={2_500_000} />
                    </Td>
                    <Td className="text-right font-semibold text-green-700 dark:text-green-400">
                      <Rp n={900_000} />
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="bisa">
            <p>
              Status bayar langsung <Badge warna="hijau">Lunas</Badge>, tidak muncul di
              halaman Piutang. Kedua unit jadi <BadgeStatus status="TERJUAL" /> dan laba per
              unit terkunci — angka ini tidak akan berubah lagi walau data lain disentuh
              nanti.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= F ================= */}
        <Kasus
          kode="F"
          judul="Jual D ke konsumen via WhatsApp, ongkir ditanggung toko, bayar tempo"
          situasi="Pembeli perorangan, DP Rp 2.000.000, sisanya dua minggu lagi. Ongkir Rp 50.000 ditanggung toko sebagai bonus."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                <Tekan>Penjualan</Tekan> → <Tekan>Transaksi baru</Tekan>.
              </>
              <>
                Tipe Pembeli <Isi>B2C — Konsumen akhir</Isi>, ketik nama pembelinya, Channel{" "}
                <Isi>WhatsApp / Sosmed</Isi>.
              </>
              <>
                Tambahkan <code>SEIKO-002</code>, harga jual <strong>Rp 4.800.000</strong>.
              </>
              <>
                Ongkir <strong>Rp 50.000</strong>, ditanggung <Isi>Toko</Isi>.
              </>
              <>
                Metode Bayar <Isi>Piutang</Isi>, DP <strong>Rp 2.000.000</strong>, isi jatuh
                temponya.
              </>
              <>
                <Tekan>Simpan transaksi</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Keterangan</Th>
                    <Th className="text-right">Nilai</Th>
                    <Th>Catatan</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Omzet</Td>
                    <Td className="text-right">
                      <Rp n={4_800_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Diakui penuh hari ini, walau uangnya belum masuk semua
                    </Td>
                  </tr>
                  <tr>
                    <Td>Total tagihan</Td>
                    <Td className="text-right">
                      <Rp n={4_800_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Ongkir <strong>tidak</strong> ditambahkan, karena ditanggung toko
                    </Td>
                  </tr>
                  <tr>
                    <Td>Dibayar</Td>
                    <Td className="text-right">
                      <Rp n={2_000_000} />
                    </Td>
                    <Td className="whitespace-normal">DP</Td>
                  </tr>
                  <tr>
                    <Td>Sisa piutang</Td>
                    <Td className="text-right font-semibold text-amber-700 dark:text-amber-400">
                      <Rp n={2_800_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Muncul di halaman <Tekan>Piutang</Tekan>
                    </Td>
                  </tr>
                  <tr>
                    <Td>Laba nota</Td>
                    <Td className="text-right font-semibold text-green-700 dark:text-green-400">
                      <Rp n={1_150_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      4.800.000 − 3.600.000 HPP − 50.000 ongkir toko
                    </Td>
                  </tr>
                  <tr>
                    <Td>Status bayar</Td>
                    <Td className="text-right">
                      <Badge warna="kuning">Sebagian</Badge>
                    </Td>
                    <Td className="whitespace-normal">Berubah sendiri saat lunas</Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="info" judul="Kalau ongkirnya ditanggung pembeli">
            <p>
              Total tagihan jadi <strong>Rp 4.850.000</strong>, tapi omzet tetap{" "}
              <strong>Rp 4.800.000</strong> dan laba tetap <strong>Rp 1.200.000</strong>.
              Ongkir titipan pembeli bukan penghasilan toko, jadi tidak dihitung ke mana-mana.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= G ================= */}
        <Kasus
          kode="G"
          judul="Pembeli D melunasi sisa tagihannya"
          situasi="Dua minggu kemudian sisa Rp 2.800.000 dibayar transfer."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Piutang</Tekan>. Nota tersebut ada di daftar, lengkap dengan
                sisa tagihan dan umur piutangnya.
              </>
              <>
                Tekan <Tekan>Catat bayar</Tekan>.
              </>
              <>
                Jumlahnya sudah terisi penuh <strong>Rp 2.800.000</strong>. Kalau bayarnya
                cuma sebagian, ubah angkanya — sisanya tetap tercatat sebagai piutang.
              </>
              <>
                Isi tanggal bayar, tulis catatan seperti <em>&ldquo;transfer BCA&rdquo;</em>{" "}
                bila perlu, lalu <Tekan>Simpan pembayaran</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="bisa">
            <p>
              Status berubah jadi <Badge warna="hijau">Lunas</Badge>, nota hilang dari daftar
              Piutang, dan <Isi>Piutang Berjalan</Isi> di Dashboard turun{" "}
              <Rp n={2_800_000} />.
            </p>
            <p>
              <strong>Laba tidak berubah sama sekali.</strong> Labanya sudah diakui waktu
              nota dibuat di kasus F. Yang berubah hanya posisi kas.
            </p>
          </Kotak>

          <Kotak nada="penting">
            <p>
              Pembayaran melebihi sisa tagihan akan ditolak, begitu juga pembayaran pada nota
              yang sudah lunas. Cicilan boleh berkali-kali sampai sisanya nol.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= H ================= */}
        <Kasus
          kode="H"
          judul="Tutup bulan — membaca Laporan L/R"
          situasi="Akhir bulan. A dan B terjual, D terjual, E rusak, C masih di etalase."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Laporan L/R</Tekan>, pilih bulannya.
              </>
              <>
                Baca perhitungan bertingkat di bagian atas, lalu periksa rincian per unit di
                bawahnya.
              </>
              <>
                Tekan <Tekan>Export Excel</Tekan> untuk arsip.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Yang muncul di laporan">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Komponen</Th>
                    <Th className="text-right">Nilai</Th>
                    <Th>Dari mana</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Omzet</Td>
                    <Td className="text-right font-medium">
                      <Rp n={7_300_000} />
                    </Td>
                    <Td className="whitespace-normal">A+B (2.500.000) dan D (4.800.000)</Td>
                  </tr>
                  <tr>
                    <Td>− Modal</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-4_450_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Harga beli A, B, D saja — C belum terjual
                    </Td>
                  </tr>
                  <tr>
                    <Td>− Biaya Service</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-750_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Strap B (150.000) + mesin D (600.000). Kaca C belum jadi beban.
                    </Td>
                  </tr>
                  <tr>
                    <Td>− Kerugian Barang Rusak</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-2_200_000} />
                    </Td>
                    <Td className="whitespace-normal">HPP penuh jam E</Td>
                  </tr>
                  <tr>
                    <Td>− Ongkir ditanggung toko</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-50_000} />
                    </Td>
                    <Td className="whitespace-normal">Dari nota D</Td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-zinc-900/60">
                    <Td className="font-semibold">LABA BERSIH</Td>
                    <Td className="text-right text-base font-semibold text-red-700 dark:text-red-400">
                      <Rp n={-150_000} />
                    </Td>
                    <Td className="whitespace-normal">Bulan ini rugi tipis</Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Kenapa rugi padahal tiap unit untung?">
            <p>
              Ketiga penjualan menghasilkan laba total <strong>Rp 2.050.000</strong>. Tapi
              satu jam mati dan menghapus <strong>Rp 2.200.000</strong>. Itulah risiko jam
              bekas — dan justru inilah yang ingin Anda lihat: satu unit mati bisa menghabiskan
              laba dari tiga penjualan.
            </p>
          </Kotak>

          <Blok judul="Mencocokkan dengan buku kas Anda">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Pergerakan kas</Th>
                    <Th className="text-right">Nilai</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Modal awal (kasus A)</Td>
                    <Td className="text-right">
                      <Rp n={10_000_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>− Beli 5 jam</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-6_850_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>− Biaya service (semuanya, termasuk C dan E)</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-1_650_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>− Ongkir ditanggung toko</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-50_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>+ Terima cash penjualan A &amp; B</Td>
                    <Td className="text-right text-green-700 dark:text-green-400">
                      <Rp n={2_500_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>+ Terima DP dan pelunasan D</Td>
                    <Td className="text-right text-green-700 dark:text-green-400">
                      <Rp n={4_800_000} />
                    </Td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-zinc-900/60">
                    <Td className="font-semibold">Saldo kas akhir bulan</Td>
                    <Td className="text-right font-semibold">
                      <Rp n={8_750_000} />
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>

            <div className="mt-3 rounded-lg bg-gray-100 p-3 text-sm dark:bg-zinc-900">
              <p className="font-medium text-gray-900 dark:text-gray-50">
                App yang mencocokkannya untuk Anda
              </p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">
                Semua baris di tabel atas <strong>sudah tercatat sendiri</strong> di halaman{" "}
                <Tekan>Kas</Tekan> — Anda tidak perlu menyalinnya ke mana-mana. Buka{" "}
                <Tekan>Dashboard</Tekan> dan lihat panel <Isi>Posisi Keuangan</Isi>.
              </p>
              <p className="mt-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                Saldo Kas = Modal Disetor − Prive + Laba Kumulatif
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;− Nilai Persediaan −
                Piutang
                <br />
                8.750.000 = 10.000.000 − 0 + (−150.000) − 1.100.000 − 0 ✓
              </p>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                Kalau cocok, panelnya hijau bertuliskan <strong>Pembukuan cocok</strong>.
                Kalau merah, ada transaksi yang belum diinput — biasanya biaya service atau
                biaya toko yang lupa dicatat. Lihat kasus <Isi>U</Isi>.
              </p>
            </div>
          </Blok>
        </Kasus>

        {/* ================= I ================= */}
        <Kasus
          kode="I"
          judul="Jam C sudah lebih dari 30 hari belum laku"
          situasi="Orient Bambino masih menganggur di etalase, modal Rp 1.100.000 tertahan di sana."
          status="bisa"
        >
          <Blok judul="Cara menemukannya">
            <Langkah>
              <>
                Buka <Tekan>Dashboard</Tekan> — panel <Isi>Barang Mengendap (&gt; 30
                hari)</Isi> menampilkannya otomatis, diurutkan dari yang paling lama.
              </>
              <>
                Atau buka <Tekan>Inventory</Tekan> dan set filter{" "}
                <Isi>Umur stok → Lebih dari 30 hari</Isi>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Warna penanda umur">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Umur</Th>
                    <Th>Penanda</Th>
                    <Th>Artinya</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>0–30 hari</Td>
                    <Td>
                      <Badge warna="hijau">Wajar</Badge>
                    </Td>
                    <Td className="whitespace-normal">Belum perlu diapa-apakan</Td>
                  </tr>
                  <tr>
                    <Td>31–60 hari</Td>
                    <Td>
                      <Badge warna="kuning">Perlu diperhatikan</Badge>
                    </Td>
                    <Td className="whitespace-normal">
                      Mulai muncul di panel Barang Mengendap
                    </Td>
                  </tr>
                  <tr>
                    <Td>&gt; 60 hari</Td>
                    <Td>
                      <Badge warna="merah">Perlu tindakan</Badge>
                    </Td>
                    <Td className="whitespace-normal">
                      Modal terlalu lama tertahan di barang ini
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Blok judul="Pilihan tindakan">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>Turunkan harga.</strong> Buka detail unitnya untuk melihat HPP{" "}
                <Rp n={1_100_000} />. Selama harga jual barunya di atas angka itu, Anda masih
                untung.
              </li>
              <li>
                <strong>Lempar ke mitra.</strong> Margin lebih tipis, tapi modal berputar
                lagi. Cek <Tekan>Mitra</Tekan> untuk melihat siapa yang paling sering ambil
                barang serupa.
              </li>
              <li>
                <strong>Biarkan dulu</strong> kalau memang barang koleksi yang pembelinya
                spesifik — asal Anda sadar modal segitu sedang tidak bekerja.
              </li>
            </ul>
          </Blok>

          <Kotak nada="penting" judul="Harga jual tidak bisa diubah dari halaman Inventory">
            <p>
              Harga jual ditetapkan sekali saat QC lolos. Untuk menurunkan harga, cukup
              masukkan <strong>harga jual final yang baru</strong> saat membuat nota
              penjualan — kolom harga di form penjualan memang bisa diubah untuk keperluan
              nego seperti ini. Laba dihitung dari harga yang Anda ketik di nota, bukan dari
              harga list.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= J ================= */}
        <Kasus
          kode="J"
          judul="Terlanjur menjual di bawah modal"
          situasi="Butuh uang cepat, jam ber-HPP Rp 1.100.000 dilepas Rp 950.000."
          status="bisa"
        >
          <Kotak nada="bisa">
            <p>
              App <strong>tidak melarang</strong> jual rugi — kadang memang keputusan yang
              benar. Tapi Anda akan diperingatkan sebelum menyimpan.
            </p>
          </Kotak>

          <Blok judul="Yang terjadi">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Saat mengetik harga, baris unitnya langsung menampilkan{" "}
                <span className="font-medium text-red-700 dark:text-red-400">
                  Rugi Rp 150.000
                </span>
                .
              </li>
              <li>
                Kotak Ringkasan menampilkan peringatan merah{" "}
                <em>&ldquo;Transaksi ini rugi Rp 150.000&rdquo;</em>.
              </li>
              <li>
                Setelah disimpan, barisnya diberi latar merah di{" "}
                <Tekan>Laporan L/R</Tekan> dan kolom Margin merah di{" "}
                <Tekan>Inventory</Tekan>, supaya mudah ditemukan saat evaluasi.
              </li>
            </ul>
          </Blok>
        </Kasus>

        {/* ================= K ================= */}
        <Kasus
          kode="K"
          judul="Salah pencet Rusak"
          situasi="Jam ditandai rusak, ternyata masih bisa diperbaiki."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Barang Rusak</Tekan>.
              </>
              <>
                Cari unitnya, tekan <Tekan>Batalkan</Tekan>, lalu konfirmasi.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="bisa">
            <p>
              Unit kembali ke <strong>status sebelum ditandai rusak</strong> — kalau tadinya
              Ready ya kembali Ready, kalau tadinya di bengkel ya kembali ke bengkel.
              Kerugiannya hilang dari laporan dan baris ledgernya ikut terhapus, seolah tidak
              pernah terjadi.
            </p>
          </Kotak>

          <Kotak nada="penting">
            <p>
              Lakukan sebelum tutup bulan. Kalau laporan bulan itu sudah diserahkan ke pihak
              lain, membatalkan write-off akan mengubah angka yang sudah terlanjur beredar.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= L ================= */}
        <Kasus
          kode="L"
          judul="Satu jam masuk bengkel dua kali"
          situasi="Sudah ganti mesin, lolos QC. Seminggu kemudian ketahuan kacanya retak."
          status="bisa"
        >
          <Kotak nada="penting" judul="Perlu diketahui">
            <p>
              Dari status <BadgeStatus status="READY" />, jam <strong>tidak bisa</strong>{" "}
              dikembalikan ke bengkel lewat tombol. Jalur QC → Service hanya berlaku untuk
              unit yang sedang di antrian QC.
            </p>
          </Kotak>

          <Blok judul="Yang bisa dilakukan">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>Kalau kerusakannya ringan:</strong> perbaiki di luar app, lalu
                sesuaikan harga jualnya saat membuat nota. Biaya perbaikannya tidak masuk HPP
                — catat di buku kas.
              </li>
              <li>
                <strong>Kalau kerusakannya berat:</strong> pindahkan ke{" "}
                <BadgeStatus status="RUSAK" /> agar kerugiannya tercatat jujur.
              </li>
            </ul>
          </Blok>

          <Kotak nada="bisa" judul="Yang memang didukung: gagal QC berulang">
            <p>
              Selama unit masih di jalur QC, putaran{" "}
              <em>QC gagal → service → QC gagal lagi → service lagi</em> boleh terjadi
              berkali-kali. Setiap tiket service baru menambah HPP, dan seluruh riwayatnya
              bisa dilihat di halaman detail unit.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= M ================= */}
        <Kasus
          kode="M"
          judul="Salah input harga beli"
          situasi="Harga beli terketik Rp 1.200.000 padahal seharusnya Rp 2.100.000."
          status="tidak"
        >
          <Kotak nada="bahaya">
            <p>
              Harga beli <strong>tidak bisa diubah</strong> setelah unit disimpan. Ini
              disengaja: harga beli adalah dasar seluruh perhitungan HPP dan laba, jadi tidak
              boleh berubah diam-diam.
            </p>
          </Kotak>

          <Blok judul="Solusinya tergantung status unit">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Status unit</Th>
                    <Th>Yang bisa dilakukan</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>
                      <BadgeStatus status="MASUK_QC" />
                    </Td>
                    <Td className="whitespace-normal">
                      Belum ada riwayat apa pun — hubungi pembuat app untuk menghapus unitnya,
                      lalu input ulang dengan harga yang benar.
                    </Td>
                  </tr>
                  <tr>
                    <Td>
                      <BadgeStatus status="SERVICE" /> / <BadgeStatus status="READY" />
                    </Td>
                    <Td className="whitespace-normal">
                      Sudah punya riwayat. Selisihnya bisa dititipkan sebagai biaya service
                      berjenis <Isi>Lainnya</Isi> dengan deskripsi{" "}
                      <em>&ldquo;koreksi harga beli&rdquo;</em> — HPP jadi benar, walau
                      pembagian modal vs service di laporan sedikit bergeser.
                    </Td>
                  </tr>
                  <tr>
                    <Td>
                      <BadgeStatus status="TERJUAL" />
                    </Td>
                    <Td className="whitespace-normal">
                      Tidak bisa diperbaiki dari app — labanya sudah dikunci. Perlu koreksi
                      langsung di database.
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting">
            <p>
              Karena itu: <strong>periksa harga beli sebelum menekan simpan.</strong> Ini satu
              angka yang paling mahal kalau salah.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= N ================= */}
        <Kasus
          kode="N"
          judul="Mitra sudah tidak berlangganan lagi"
          situasi="Ingin dibersihkan dari daftar, tapi mitra ini punya riwayat transaksi."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                <Tekan>Mitra</Tekan> → tekan ikon pensil pada barisnya.
              </>
              <>
                Ubah <Isi>Status</Isi> menjadi{" "}
                <Isi>Nonaktif — tidak muncul saat buat nota</Isi> → <Tekan>Simpan</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="penting" judul="Kenapa tidak dihapus saja?">
            <p>
              App <strong>menolak</strong> menghapus mitra yang pernah bertransaksi. Kalau
              dihapus, nota-nota lamanya kehilangan nama pembeli dan laporan bulan-bulan
              sebelumnya jadi rusak. Menonaktifkan membuat namanya hilang dari pilihan saat
              membuat nota, tapi seluruh riwayat tetap utuh.
            </p>
            <p>
              Mitra yang <strong>belum pernah</strong> bertransaksi boleh dihapus permanen.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= O ================= */}
        <Kasus
          kode="O"
          judul="Ada piutang yang lewat jatuh tempo"
          situasi="Pembeli belum melunasi padahal sudah lewat tanggal janji."
          status="bisa"
        >
          <Blok judul="Cara menemukannya">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <Tekan>Dashboard</Tekan> → kartu <Isi>Piutang Berjalan</Isi> menunjukkan
                berapa yang sudah lewat jatuh tempo, dengan angka merah.
              </li>
              <li>
                <Tekan>Piutang</Tekan> → barisnya berlatar merah dengan penanda{" "}
                <Badge warna="merah">Terlewat</Badge>, dan kolom{" "}
                <Isi>Umur</Isi> menunjukkan sudah berapa hari sejak transaksi.
              </li>
            </ul>
          </Blok>

          <Blok judul="Setelah ditagih">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Bayar penuh → <Tekan>Catat bayar</Tekan> dengan jumlah penuh, status jadi
                Lunas.
              </li>
              <li>
                Bayar sebagian → isi sesuai yang dibayar. Sisanya tetap tercatat sebagai
                piutang, dan riwayat cicilannya tersimpan.
              </li>
              <li>
                Belum bayar → biarkan. Tidak ada tindakan yang perlu dilakukan di app.
              </li>
            </ul>
          </Blok>

          <Kotak nada="penting" judul="Piutang tidak bisa dihapus">
            <p>
              Tidak ada fitur menghapus atau memutihkan piutang macet. Kalau ada tagihan yang
              benar-benar tidak akan tertagih, hubungi pembuat app.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= P ================= */}
        <Kasus
          kode="P"
          judul="Angka di Dashboard terasa janggal"
          situasi="Laba tidak masuk akal, atau jumlah stok tidak cocok dengan hitungan fisik."
          status="bisa"
        >
          <Blok judul="Urutan pemeriksaan">
            <Langkah>
              <>
                <Tekan>Laporan L/R</Tekan> pada bulan tersebut — lihat rincian per unit.
                Cari baris berlatar merah (rugi) atau harga yang aneh.
              </>
              <>
                <Tekan>Barang Rusak</Tekan> — write-off besar bisa membuat bulan yang
                sebenarnya bagus terlihat rugi.
              </>
              <>
                <Tekan>Inventory</Tekan> dengan filter status — hitung fisik jam di toko,
                cocokkan dengan jumlah unit berstatus Ready.
              </>
              <>
                <Tekan>Stok Ledger</Tekan> — kalau ada satu unit yang mencurigakan, cari kode
                unitnya di sini untuk melihat seluruh perjalanannya, urut waktu.
              </>
              <>
                Buka <Isi>halaman detail unit</Isi> (klik kode unitnya di mana saja) — di
                sana ada riwayat lengkap: pembelian, setiap QC beserta catatannya, setiap
                tiket service beserta rincian komponennya, dan penjualannya.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="info">
            <p>
              Penyebab paling sering: <strong>biaya service yang lupa dicatat</strong>. Laba
              jadi terlihat lebih besar dari kenyataan. Kalau tiket servicenya masih berjalan,
              biayanya masih bisa ditambahkan.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= Q ================= */}
        <Kasus
          kode="Q"
          judul="Stok batre sendiri, lalu dipakai saat service"
          situasi="Beli 10 batre @Rp 15.000, seminggu kemudian beli 10 lagi @Rp 25.000, lalu pakai 2 untuk sebuah jam."
          status="bisa"
        >
          <Blok judul="Langkah 1 — daftarkan barangnya">
            <Langkah>
              <>
                Buka <Tekan>Stok Sparepart</Tekan> → <Tekan>Tambah sparepart</Tekan>.
              </>
              <>
                Isi nama (<em>Batre Maxell SR626SW</em>), jenis <Isi>Batre</Isi>, satuan{" "}
                <Isi>pcs</Isi>, dan <Isi>Min. stok</Isi> misalnya 5 supaya diingatkan saat
                menipis.
              </>
              <>
                Kode dibuat otomatis: <code>BATRE-01</code>. Stoknya masih 0.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Langkah 2 — isi stok">
            <Langkah>
              <>
                Tekan <Tekan>Isi</Tekan> pada barisnya.
              </>
              <>
                Jumlah <strong>10</strong>, harga satuan <strong>Rp 15.000</strong>, isi
                tanggalnya → <Tekan>Simpan</Tekan>.
              </>
              <>
                Seminggu kemudian harga naik. Isi lagi: jumlah <strong>10</strong>, harga
                satuan <strong>Rp 25.000</strong>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasil setelah dua kali pengisian">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Keterangan</Th>
                    <Th className="text-right">Nilai</Th>
                    <Th>Catatan</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Stok</Td>
                    <Td className="text-right tabular-nums">20 pcs</Td>
                    <Td className="whitespace-normal">10 + 10</Td>
                  </tr>
                  <tr>
                    <Td>Harga rata-rata</Td>
                    <Td className="text-right font-semibold">
                      <Rp n={20_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      (10×15.000 + 10×25.000) ÷ 20 — bukan harga pembelian terakhir
                    </Td>
                  </tr>
                  <tr>
                    <Td>Nilai persediaan</Td>
                    <Td className="text-right">
                      <Rp n={400_000} />
                    </Td>
                    <Td className="whitespace-normal">20 × 20.000</Td>
                  </tr>
                  <tr>
                    <Td>Kas</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-400_000} />
                    </Td>
                    <Td className="whitespace-normal">
                      Keluar Rp 150.000 lalu Rp 250.000
                    </Td>
                  </tr>
                  <tr>
                    <Td>Laba</Td>
                    <Td className="text-right">—</Td>
                    <Td className="whitespace-normal">
                      Belum berubah. Uang berubah wujud jadi barang.
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Blok judul="Langkah 3 — pakai saat service">
            <Langkah>
              <>
                Di <Tekan>Service</Tekan>, pada kartu jam yang sedang dibengkelkan, pindah ke
                tab <Tekan>Ambil dari stok</Tekan>.
              </>
              <>
                Pilih <Isi>Batre Maxell SR626SW</Isi> — daftarnya menampilkan sisa stok dan
                harga rata-ratanya — lalu isi jumlah <strong>2</strong>.
              </>
              <>
                Tekan <Tekan>Ambil</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasil pemakaian">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Yang berubah</Th>
                    <Th>Menjadi</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Stok batre</Td>
                    <Td>20 → 18 pcs</Td>
                  </tr>
                  <tr>
                    <Td>HPP jam</Td>
                    <Td>
                      Naik <Rp n={40_000} /> (2 × Rp 20.000)
                    </Td>
                  </tr>
                  <tr>
                    <Td>Kas</Td>
                    <Td className="whitespace-normal font-semibold">
                      Tidak berubah sama sekali
                    </Td>
                  </tr>
                  <tr>
                    <Td>Harga rata-rata</Td>
                    <Td>Tetap Rp 20.000</Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Kenapa kas tidak berkurang saat dipakai?">
            <p>
              Karena uangnya sudah keluar waktu batrenya dibeli. Kalau saat dipakai kas
              berkurang lagi, biaya batre terhitung <strong>dua kali</strong> dan laba Anda
              akan terlihat lebih kecil dari kenyataan.
            </p>
            <p>
              Yang terjadi saat dipakai hanyalah <em>perpindahan nilai</em>: dari persediaan
              sparepart ke HPP jam. Total aset Anda tidak berubah.
            </p>
          </Kotak>

          <Kotak nada="info" judul="Kalau salah ambil">
            <p>
              Hapus komponennya lewat ikon tempat sampah di daftar. Stok kembali bertambah dan
              HPP jam turun lagi seperti semula.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= R ================= */}
        <Kasus
          kode="R"
          judul="Bayar sewa toko, gaji, dan listrik"
          situasi="Sewa Rp 3.000.000 dan listrik Rp 500.000 dibayar bulan ini."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Biaya Operasional</Tekan> → <Tekan>Catat biaya</Tekan>.
              </>
              <>
                Kategori <Isi>Sewa Tempat</Isi>, deskripsi{" "}
                <em>&ldquo;Sewa toko bulan ini&rdquo;</em>, jumlah{" "}
                <strong>Rp 3.000.000</strong>, isi tanggalnya.
              </>
              <>
                Ulangi untuk listrik dengan kategori <Isi>Listrik</Isi>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Yang berubah</Th>
                    <Th className="text-right">Nilai</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Kas</Td>
                    <Td className="text-right text-red-700 dark:text-red-400">
                      <Rp n={-3_500_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Biaya Operasional bulan ini</Td>
                    <Td className="text-right">
                      <Rp n={3_500_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Laba Kotor Barang</Td>
                    <Td className="text-right whitespace-normal">Tidak berubah</Td>
                  </tr>
                  <tr>
                    <Td>Laba Bersih Usaha</Td>
                    <Td className="text-right font-semibold text-red-700 dark:text-red-400">
                      Turun <Rp n={3_500_000} />
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Bedanya dengan biaya service">
            <p>
              Biaya service menempel pada sebuah jam dan baru jadi beban{" "}
              <strong>saat jam itu terjual</strong>. Biaya operasional tidak menempel pada
              barang apa pun, jadi langsung memotong laba bulan berjalan — tidak ada yang
              perlu ditunggu.
            </p>
          </Kotak>

          <Kotak nada="info" judul="Melanjutkan cerita kasus H">
            <p>
              Bulan itu Laba Kotor Barang adalah <strong>−Rp 150.000</strong>. Setelah biaya
              toko Rp 3.500.000, <Isi>Laba Bersih Usaha</Isi> menjadi{" "}
              <strong>−Rp 3.650.000</strong>. Inilah angka yang sesungguhnya menggambarkan
              bulan tersebut.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= S ================= */}
        <Kasus
          kode="S"
          judul="Ambil uang bisnis untuk keperluan pribadi"
          situasi="Rp 1.000.000 diambil dari kas toko untuk kebutuhan rumah."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                Buka <Tekan>Kas</Tekan> → <Tekan>Catat kas</Tekan>.
              </>
              <>
                Pilih jenis <Isi>Prive (tarik pribadi)</Isi>, isi jumlah, tanggal, dan
                keterangan singkat.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="penting" judul="Prive bukan biaya usaha">
            <p>
              Kas berkurang Rp 1.000.000, tapi <strong>laba tidak berubah sedikit pun</strong>.
              Mengambil uang untuk diri sendiri bukan biaya menjalankan toko — itu pembagian
              hasil kepada pemilik.
            </p>
            <p>
              Kalau prive dicatat sebagai biaya operasional, laba usaha Anda akan terlihat
              jauh lebih buruk dari kenyataan, dan Anda bisa salah menyimpulkan bahwa bisnisnya
              merugi.
            </p>
          </Kotak>

          <Kotak nada="info">
            <p>
              Di panel <Isi>Posisi Keuangan</Isi>, prive tampil sebagai pengurang di sebelah
              Modal Disetor — supaya terlihat berapa yang sudah Anda tarik dari modal yang
              disetor.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= T ================= */}
        <Kasus
          kode="T"
          judul="Stok opname sparepart, ada yang susut"
          situasi="Catatan sistem 18 batre, hitung fisik cuma 17 — satu rusak saat dipasang."
          status="bisa"
        >
          <Blok judul="Langkahnya">
            <Langkah>
              <>
                <Tekan>Stok Sparepart</Tekan> → tekan ikon papan klip pada barisnya.
              </>
              <>
                Isi jumlah hasil hitung fisik: <strong>17</strong>.
              </>
              <>
                Tulis alasannya, misalnya{" "}
                <em>&ldquo;1 batre rusak saat dipasang&rdquo;</em> — ini wajib.
              </>
              <>
                Tekan <Tekan>Simpan</Tekan>.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Hasilnya">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Yang berubah</Th>
                    <Th>Menjadi</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>Stok</Td>
                    <Td>18 → 17 pcs</Td>
                  </tr>
                  <tr>
                    <Td>Nilai persediaan</Td>
                    <Td>
                      Berkurang <Rp n={20_000} /> (1 × harga rata-rata)
                    </Td>
                  </tr>
                  <tr>
                    <Td>Laporan L/R</Td>
                    <Td className="whitespace-normal">
                      Muncul baris <Isi>Kerugian Sparepart</Isi> sebesar <Rp n={20_000} />
                    </Td>
                  </tr>
                  <tr>
                    <Td>Kas</Td>
                    <Td className="whitespace-normal">
                      Tidak berubah — uangnya sudah lama keluar
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="info" judul="Kalau hasilnya justru lebih">
            <p>
              Isi saja angka hasil hitung yang sebenarnya. Selisih lebih menambah nilai
              persediaan tanpa menyentuh kas, dan tidak dihitung sebagai keuntungan — biasanya
              itu memang stok yang sebelumnya salah catat.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= U ================= */}
        <Kasus
          kode="U"
          judul="Saldo kas di app beda dengan uang di laci"
          situasi="App bilang Rp 8.750.000, hitung fisik cuma Rp 8.500.000."
          status="bisa"
        >
          <Blok judul="Langkah 1 — cari dulu, jangan langsung disamakan">
            <Langkah>
              <>
                Buka <Tekan>Dashboard</Tekan>, lihat panel <Isi>Posisi Keuangan</Isi>. Kalau
                bertanda <Badge warna="hijau">Pembukuan cocok</Badge>, berarti catatan app
                konsisten dan selisihnya ada di dunia nyata — bukan salah input.
              </>
              <>
                Buka <Tekan>Kas</Tekan> pada bulan berjalan dan telusuri dari baris teratas.
                Cari pengeluaran yang Anda ingat tapi tidak ada di daftar.
              </>
              <>
                Penyebab tersering: <strong>biaya service dibayar tapi lupa dicatat</strong>,
                belanja sparepart belum diinput, atau ongkir yang ditanggung toko belum
                dimasukkan ke notanya.
              </>
              <>
                Kalau ketemu, catat transaksi yang terlewat itu di halaman yang semestinya —
                jangan pakai penyesuaian. Saldo akan cocok dengan sendirinya.
              </>
            </Langkah>
          </Blok>

          <Blok judul="Langkah 2 — kalau benar-benar tidak ketemu">
            <Langkah>
              <>
                <Tekan>Kas</Tekan> → <Tekan>Catat kas</Tekan>.
              </>
              <>
                Pilih <Isi>Penyesuaian — Kas kurang</Isi>, isi selisihnya{" "}
                <strong>Rp 250.000</strong>.
              </>
              <>
                Tulis keterangan yang jujur, misalnya{" "}
                <em>&ldquo;selisih hitung kas akhir bulan, sumber tidak ditemukan&rdquo;</em>.
              </>
            </Langkah>
          </Blok>

          <Kotak nada="penting" judul="Penyesuaian adalah pilihan terakhir">
            <p>
              Setiap penyesuaian berarti ada uang yang tidak diketahui ke mana perginya. Sekali
              dua kali wajar, tapi kalau sering terjadi berarti ada kebiasaan pencatatan yang
              perlu diperbaiki — biasanya biaya service atau belanja sparepart yang sering
              lupa diinput.
            </p>
          </Kotak>
        </Kasus>

        {/* ================= V ================= */}
        <Kasus
          kode="V"
          judul="Tiga Seiko 1002 dengan service berbeda-beda"
          situasi="Satu diganti strap, satu diganti batre + mesin, satu tidak perlu diservice sama sekali."
          status="bisa"
        >
          <Blok judul="Nama yang muncul di layar">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Kode</Th>
                    <Th>Service yang dikerjakan</Th>
                    <Th>Nama yang tampil</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td className="font-medium">SEIKO-001</Td>
                    <Td>Ganti strap</Td>
                    <Td className="whitespace-normal">Seiko 1002 (Ganti Strap)</Td>
                  </tr>
                  <tr>
                    <Td className="font-medium">SEIKO-002</Td>
                    <Td>Ganti batre lalu ganti mesin</Td>
                    <Td className="whitespace-normal">
                      Seiko 1002 (Ganti Batre, Ganti Mesin)
                    </Td>
                  </tr>
                  <tr>
                    <Td className="font-medium">SEIKO-003</Td>
                    <Td>Tidak ada</Td>
                    <Td className="whitespace-normal">Seiko 1002</Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Blok judul="Tapi di Ranking Produk, ketiganya satu baris">
            <TabelWrap>
              <Tabel>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Produk</Th>
                    <Th className="text-right">Terjual</Th>
                    <Th className="text-right">Omzet</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  <tr>
                    <Td>1</Td>
                    <Td className="font-medium">Seiko 1002</Td>
                    <Td className="text-right tabular-nums">3</Td>
                    <Td className="text-right">
                      <Rp n={4_800_000} />
                    </Td>
                  </tr>
                </tbody>
              </Tabel>
            </TabelWrap>
          </Blok>

          <Kotak nada="penting" judul="Inilah gunanya dua nama">
            <p>
              <strong>Nama lengkap</strong> untuk melihat: di etalase Anda langsung tahu jam
              mana yang sudah diganti mesin dan mana yang masih orisinal.
            </p>
            <p>
              <strong>Nama dasar</strong> untuk menghitung: kalau imbuhan service ikut
              mengelompokkan, ranking di atas akan pecah jadi tiga baris masing-masing 1 unit
              — dan Anda tidak akan pernah tahu bahwa Seiko 1002 sebenarnya model terlaris
              Anda.
            </p>
          </Kotak>

          <Blok judul="Aturan imbuhannya">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Diambil dari <strong>komponen yang diganti</strong>, bukan dari deskripsi
                bebas: Batre, Strap, Kaca, Mesin.
              </li>
              <li>
                Beberapa service digabung urut waktu, dipisah koma.
              </li>
              <li>
                Komponen yang sama diganti dua kali tetap tampil sekali —{" "}
                <em>Ganti Batre, Ganti Batre</em> tidak ada gunanya.
              </li>
              <li>
                Jenis <Isi>Lainnya</Isi> memakai deskripsi yang Anda tulis, misalnya{" "}
                <em>Orient Bambino (Poles Case)</em>.
              </li>
              <li>
                Imbuhan muncul di Inventory, QC, Service, detail unit, Ledger, Barang Rusak,
                dan Laporan L/R — <strong>tapi tidak di rincian nota</strong> yang dilihat
                pembeli.
              </li>
            </ul>
          </Blok>
        </Kasus>
      </div>

      <Card className="mt-4">
        <JudulBagian sub="Rekap seluruh kasus di halaman ini.">Ringkasan</JudulBagian>
        <TabelWrap>
          <Tabel>
            <thead>
              <tr>
                <Th>Kasus</Th>
                <Th>Bisa dicatat?</Th>
                <Th>Dikerjakan di</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
              {[
                ["A · Setor modal awal", true, "Kas"],
                ["B · Beli beberapa jam", true, "Beli Produk"],
                ["C · QC lolos / gagal + service", true, "QC dan Service"],
                ["D · Jam mati, jadi kerugian", true, "Inventory → Rusak"],
                ["E · Jual B2B cash, banyak unit", true, "Penjualan"],
                ["F · Jual B2C tempo + ongkir toko", true, "Penjualan"],
                ["G · Pelunasan piutang", true, "Piutang"],
                ["H · Tutup bulan", true, "Laporan L/R dan Dashboard"],
                ["I · Barang mengendap >30 hari", true, "Dashboard dan Inventory"],
                ["J · Jual rugi", true, "Penjualan"],
                ["K · Batalkan salah write-off", true, "Barang Rusak"],
                ["L · Servis ulang setelah Ready", false, "Hanya bisa lewat write-off"],
                ["M · Koreksi harga beli", false, "Perlu bantuan pembuat app"],
                ["N · Nonaktifkan mitra", true, "Mitra"],
                ["O · Piutang lewat jatuh tempo", true, "Piutang"],
                ["P · Menelusuri angka janggal", true, "Ledger dan detail unit"],
                ["Q · Stok sparepart dan pemakaiannya", true, "Stok Sparepart dan Service"],
                ["R · Bayar sewa, gaji, listrik", true, "Biaya Operasional"],
                ["S · Ambil uang untuk pribadi (prive)", true, "Kas"],
                ["T · Stok opname sparepart", true, "Stok Sparepart"],
                ["U · Saldo kas beda dengan uang fisik", true, "Kas dan Dashboard"],
                ["V · Nama jam & ranking produk", true, "Inventory dan Dashboard"],
              ].map(([nama, bisa, di]) => (
                <tr key={nama as string}>
                  <Td className="whitespace-normal font-medium">{nama as string}</Td>
                  <Td>
                    {bisa ? (
                      <Badge warna="hijau">Ya</Badge>
                    ) : (
                      <Badge warna="merah">Tidak</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-normal text-gray-600 dark:text-gray-400">
                    {di as string}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        </TabelWrap>
      </Card>
    </>
  );
}
