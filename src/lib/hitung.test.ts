import { describe, expect, it } from "vitest";
import {
  bucketUmur,
  hitungHpp,
  hitungLabaBersihUsaha,
  hitungLabaKotorBarang,
  hitungLabaUnit,
  hitungSaldoKas,
  hitungStatusBayar,
  hitungTotalTagihan,
  saldoKasSeharusnya,
  slugBrand,
} from "./hitung";
import { formatRupiah, rentangBulanWIB, selisihHari, tanggalInputKeDate } from "./utils";
import { hitungHargaRataBaru } from "./sparepart";
import { labelService, namaUnitDariItems } from "./nama-unit";

describe("HPP dan laba per unit", () => {
  it("HPP = harga beli + biaya service (contoh SEIKO-001 di PRD)", () => {
    expect(hitungHpp(1_200_000, 400_000)).toBe(1_600_000);
  });

  it("laba unit = harga jual - HPP", () => {
    expect(hitungLabaUnit(2_300_000, 1_600_000)).toBe(700_000);
  });

  it("laba negatif kalau dijual di bawah HPP", () => {
    expect(hitungLabaUnit(1_500_000, 1_600_000)).toBe(-100_000);
  });
});

describe("Laba kotor barang", () => {
  it("mengurangi modal, biaya service, kerugian rusak, dan ongkir toko", () => {
    expect(
      hitungLabaKotorBarang({
        omzet: 10_000_000,
        modal: 6_000_000,
        biayaService: 500_000,
        kerugianRusak: 1_000_000,
        ongkirToko: 100_000,
      })
    ).toBe(2_400_000);
  });

  it("periode tanpa transaksi menghasilkan nol, bukan NaN", () => {
    expect(
      hitungLabaKotorBarang({
        omzet: 0,
        modal: 0,
        biayaService: 0,
        kerugianRusak: 0,
        ongkirToko: 0,
      })
    ).toBe(0);
  });

  it("write-off tanpa penjualan menghasilkan rugi", () => {
    expect(
      hitungLabaKotorBarang({
        omzet: 0,
        modal: 0,
        biayaService: 0,
        kerugianRusak: 1_600_000,
        ongkirToko: 0,
      })
    ).toBe(-1_600_000);
  });
});

describe("Total tagihan & ongkir", () => {
  it("ongkir ditanggung pembeli menambah tagihan", () => {
    expect(hitungTotalTagihan(5_000_000, 50_000, "PEMBELI")).toBe(5_050_000);
  });

  it("ongkir ditanggung toko tidak ditagihkan", () => {
    expect(hitungTotalTagihan(5_000_000, 50_000, "TOKO")).toBe(5_000_000);
  });
});

describe("Status bayar", () => {
  it("lunas saat dibayar penuh", () => {
    expect(hitungStatusBayar(6_500_000, 6_500_000)).toBe("LUNAS");
  });

  it("sebagian saat DP (contoh mitra di PRD)", () => {
    expect(hitungStatusBayar(6_500_000, 3_000_000)).toBe("SEBAGIAN");
  });

  it("belum lunas saat belum bayar sama sekali", () => {
    expect(hitungStatusBayar(6_500_000, 0)).toBe("BELUM_LUNAS");
  });
});

describe("Umur stok", () => {
  it("mengelompokkan sesuai bucket PRD", () => {
    expect(bucketUmur(0)).toBe("0-30");
    expect(bucketUmur(30)).toBe("0-30");
    expect(bucketUmur(31)).toBe("31-60");
    expect(bucketUmur(90)).toBe("61-90");
    expect(bucketUmur(91)).toBe(">90");
  });

  it("menghitung selisih hari penuh", () => {
    const dari = new Date("2026-08-01T00:00:00Z");
    const sampai = new Date("2026-08-31T00:00:00Z");
    expect(selisihHari(dari, sampai)).toBe(30);
  });

  it("tidak pernah negatif", () => {
    const dari = new Date("2026-09-01T00:00:00Z");
    const sampai = new Date("2026-08-01T00:00:00Z");
    expect(selisihHari(dari, sampai)).toBe(0);
  });
});

describe("Rentang bulan WIB", () => {
  it("1 Agustus 00:00 WIB = 31 Juli 17:00 UTC", () => {
    const { dari, sampai } = rentangBulanWIB("2026-08");
    expect(dari.toISOString()).toBe("2026-07-31T17:00:00.000Z");
    expect(sampai.toISOString()).toBe("2026-08-31T17:00:00.000Z");
  });

  it("transaksi 1 Agustus pagi WIB masuk periode Agustus", () => {
    const { dari, sampai } = rentangBulanWIB("2026-08");
    const transaksi = tanggalInputKeDate("2026-08-01");
    expect(transaksi >= dari && transaksi < sampai).toBe(true);
  });

  it("transaksi 31 Agustus masih masuk Agustus", () => {
    const { dari, sampai } = rentangBulanWIB("2026-08");
    const transaksi = tanggalInputKeDate("2026-08-31");
    expect(transaksi >= dari && transaksi < sampai).toBe(true);
  });
});

describe("Format rupiah", () => {
  it("tanpa desimal, pemisah titik", () => {
    expect(formatRupiah(1_000_000)).toBe("Rp 1.000.000");
    expect(formatRupiah(1_250_000)).toBe("Rp 1.250.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("nilai negatif diberi tanda minus di depan", () => {
    expect(formatRupiah(-500_000)).toBe("-Rp 500.000");
  });
});

describe("Kode unit", () => {
  it("membuat awalan dari brand", () => {
    expect(slugBrand("Seiko")).toBe("SEIKO");
    expect(slugBrand("Casio G-Shock")).toBe("CASIOGSHOCK");
  });

  it("brand kosong atau simbol jatuh ke UNIT", () => {
    expect(slugBrand("!!!")).toBe("UNIT");
  });

  it("dipotong maksimal 12 karakter", () => {
    expect(slugBrand("Jaeger LeCoultre Reverso").length).toBeLessThanOrEqual(12);
  });
});

describe("Laba bersih usaha", () => {
  const bulanIni = {
    omzet: 7_300_000,
    modal: 4_450_000,
    biayaService: 750_000,
    kerugianRusak: 2_200_000,
    ongkirToko: 50_000,
  };

  it("laba kotor barang belum dikurangi biaya toko", () => {
    expect(hitungLabaKotorBarang(bulanIni)).toBe(-150_000);
  });

  it("biaya operasional memotong laba kotor", () => {
    expect(hitungLabaBersihUsaha(hitungLabaKotorBarang(bulanIni), 3_000_000)).toBe(-3_150_000);
  });

  it("kerugian sparepart ikut memotong laba kotor", () => {
    expect(
      hitungLabaKotorBarang({ ...bulanIni, kerugianSparepart: 100_000 })
    ).toBe(-250_000);
  });

  it("kerugian sparepart yang tidak diisi dianggap nol", () => {
    expect(hitungLabaKotorBarang({ ...bulanIni, kerugianSparepart: undefined })).toBe(-150_000);
  });
});

describe("Kas", () => {
  it("saldo = masuk - keluar", () => {
    expect(hitungSaldoKas(17_300_000, 8_550_000)).toBe(8_750_000);
  });

  it("saldo boleh negatif kalau uang keluar melebihi masuk", () => {
    expect(hitungSaldoKas(1_000_000, 1_500_000)).toBe(-500_000);
  });
});

describe("Rekonsiliasi kas", () => {
  it("mencocokkan contoh study case: modal 10jt, rugi 150rb, stok 1,1jt", () => {
    expect(
      saldoKasSeharusnya({
        modalDisetor: 10_000_000,
        prive: 0,
        labaKumulatif: -150_000,
        nilaiPersediaan: 1_100_000,
        piutang: 0,
      })
    ).toBe(8_750_000);
  });

  it("piutang menahan kas walau labanya sudah diakui", () => {
    expect(
      saldoKasSeharusnya({
        modalDisetor: 10_000_000,
        prive: 0,
        labaKumulatif: 1_000_000,
        nilaiPersediaan: 0,
        piutang: 4_000_000,
      })
    ).toBe(7_000_000);
  });

  it("prive mengurangi kas tanpa menyentuh laba", () => {
    expect(
      saldoKasSeharusnya({
        modalDisetor: 10_000_000,
        prive: 2_000_000,
        labaKumulatif: 0,
        nilaiPersediaan: 0,
        piutang: 0,
      })
    ).toBe(8_000_000);
  });
});

describe("Harga rata-rata bergerak sparepart", () => {
  it("pembelian pertama memakai harga belinya", () => {
    expect(hitungHargaRataBaru(0, 0, 10, 15_000)).toBe(15_000);
  });

  it("pembelian kedua dengan harga beda menghasilkan rata-rata", () => {
    // 10 pcs @15.000 lalu 10 pcs @25.000 -> rata-rata 20.000
    expect(hitungHargaRataBaru(10, 15_000, 10, 25_000)).toBe(20_000);
  });

  it("stok besar meredam kenaikan harga", () => {
    // 90 pcs @10.000 lalu 10 pcs @20.000 -> 11.000
    expect(hitungHargaRataBaru(90, 10_000, 10, 20_000)).toBe(11_000);
  });

  it("dibulatkan ke rupiah penuh", () => {
    expect(Number.isInteger(hitungHargaRataBaru(3, 10_000, 1, 12_500))).toBe(true);
  });
});

describe("Penamaan unit", () => {
  it("tanpa service, namanya polos", () => {
    expect(namaUnitDariItems("Seiko", "1002", []).namaLengkap).toBe("Seiko 1002");
  });

  it("satu service menambah imbuhan", () => {
    const n = namaUnitDariItems("Seiko", "1002", [{ jenis: "BATRE" }]);
    expect(n.namaLengkap).toBe("Seiko 1002 (Ganti Batre)");
  });

  it("beberapa service digabung urut waktu", () => {
    const n = namaUnitDariItems("Seiko", "1002", [
      { jenis: "BATRE" },
      { jenis: "STRAP" },
    ]);
    expect(n.namaLengkap).toBe("Seiko 1002 (Ganti Batre, Ganti Strap)");
  });

  it("komponen sama yang diganti dua kali hanya tampil sekali", () => {
    const n = namaUnitDariItems("Seiko", "1002", [
      { jenis: "BATRE" },
      { jenis: "STRAP" },
      { jenis: "BATRE" },
    ]);
    expect(n.namaLengkap).toBe("Seiko 1002 (Ganti Batre, Ganti Strap)");
  });

  it("jenis LAINNYA memakai deskripsinya", () => {
    const n = namaUnitDariItems("Orient", "Bambino", [
      { jenis: "LAINNYA", deskripsi: "poles case" },
    ]);
    expect(n.namaLengkap).toBe("Orient Bambino (Poles Case)");
  });

  it("deskripsi LAINNYA yang kepanjangan dipotong", () => {
    const label = labelService({
      jenis: "LAINNYA",
      deskripsi: "ganti crown dan tabung lengkap sekalian servis mesin",
    });
    expect(label.length).toBeLessThanOrEqual(30);
    expect(label.endsWith("…")).toBe(true);
  });

  it("nama dasar tidak ikut berubah — inilah kunci ranking produk", () => {
    const n = namaUnitDariItems("Seiko", "1002", [{ jenis: "STRAP" }]);
    expect(n.namaDasar).toBe("Seiko 1002");
    expect(n.namaDasar).toBe(namaUnitDariItems("Seiko", "1002", []).namaDasar);
  });

  it("dua unit model sama dengan service beda tetap satu kelompok", () => {
    const a = namaUnitDariItems("Seiko", "1002", [{ jenis: "BATRE" }]);
    const b = namaUnitDariItems("Seiko", "1002", [{ jenis: "MESIN" }]);
    expect(a.namaLengkap).not.toBe(b.namaLengkap);
    expect(a.namaDasar).toBe(b.namaDasar);
  });
});
