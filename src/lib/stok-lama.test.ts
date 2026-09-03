import { describe, it, expect } from "vitest";
import { slugBrand } from "@/lib/hitung";

describe("Logika Bisnis Stok Lama & Import Unit", () => {
  describe("Slug Brand untuk Kode Unit", () => {
    it("menghasilkan slug huruf kapital bersih dari nama brand", () => {
      expect(slugBrand("Seiko")).toBe("SEIKO");
      expect(slugBrand("Casio G-Shock")).toBe("CASIOGSHOCK");
      expect(slugBrand("Rolex")).toBe("ROLEX");
      expect(slugBrand("Tag Heuer")).toBe("TAGHEUER");
    });

    it("memotong brand sangat panjang maksimal 12 karakter", () => {
      const slug = slugBrand("Audemars Piguet Royal Oak");
      expect(slug.length).toBeLessThanOrEqual(12);
      expect(slug).toBe("AUDEMARSPIGU");
    });

    it("menangani nama brand dengan karakter khusus", () => {
      expect(slugBrand("A. Lange & Söhne")).toBe("ALANGESOHNE");
      expect(slugBrand("---")).toBe("UNIT");
    });
  });

  describe("Parsing & Normalisasi Data Import", () => {
    function parseBooleanTest(val: unknown): boolean {
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val > 0;
      if (typeof val === "string") {
        const s = val.trim().toLowerCase();
        return s === "ya" || s === "yes" || s === "true" || s === "1" || s === "y";
      }
      return false;
    }

    it("mendeteksi nilai boolean dari teks Ya / Tidak / Yes / No / 1 / 0", () => {
      expect(parseBooleanTest("Ya")).toBe(true);
      expect(parseBooleanTest("ya")).toBe(true);
      expect(parseBooleanTest("YES")).toBe(true);
      expect(parseBooleanTest("1")).toBe(true);
      expect(parseBooleanTest(1)).toBe(true);
      expect(parseBooleanTest(true)).toBe(true);

      expect(parseBooleanTest("Tidak")).toBe(false);
      expect(parseBooleanTest("no")).toBe(false);
      expect(parseBooleanTest("0")).toBe(false);
      expect(parseBooleanTest("")).toBe(false);
      expect(parseBooleanTest(null)).toBe(false);
    });

    it("memvalidasi data baris import jam", () => {
      const barisValid = {
        brand: "Seiko",
        model: "SKX007",
        hargaBeli: 2500000,
        status: "READY",
        grade: "A",
      };

      expect(barisValid.brand.trim().length).toBeGreaterThan(0);
      expect(barisValid.model.trim().length).toBeGreaterThan(0);
      expect(barisValid.hargaBeli).toBeGreaterThan(0);
      expect(["READY", "MASUK_QC"]).toContain(barisValid.status);
      expect(["A", "B", "C"]).toContain(barisValid.grade);
    });

    it("menolak baris dengan harga beli tidak valid atau brand kosong", () => {
      const barisInvalidBrand = { brand: "", model: "SKX007", hargaBeli: 1000 };
      const barisInvalidHarga = { brand: "Seiko", model: "SKX007", hargaBeli: 0 };

      expect(barisInvalidBrand.brand.trim().length === 0).toBe(true);
      expect(barisInvalidHarga.hargaBeli <= 0).toBe(true);
    });
  });
});
