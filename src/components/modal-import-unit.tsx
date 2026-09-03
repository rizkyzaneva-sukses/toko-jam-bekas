"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { api } from "@/lib/api-client";
import { formatRupiah, tanggalWIB } from "@/lib/utils";
import { Modal } from "@/components/ui/dialog";
import { Badge, Button } from "@/components/ui/ui";

interface ParsedUnitRow {
  brand: string;
  model: string;
  hargaBeli: number;
  hargaJual: number | null;
  status: "READY" | "MASUK_QC";
  grade: "A" | "B" | "C" | null;
  tglBeli: string;
  adaBox: boolean;
  adaSurat: boolean;
  adaBuku: boolean;
  adaExtraLink: boolean;
  adaSertifikat: boolean;
  catatanKondisi: string | null;
  catatan: string | null;
  valid: boolean;
  pesanError?: string;
}

function parseBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    return s === "ya" || s === "yes" || s === "true" || s === "1" || s === "y" || s === "v";
  }
  return false;
}

function parseTanggal(val: unknown): string {
  if (!val) return tanggalWIB();
  if (typeof val === "number") {
    // Excel serial date format
    const date = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  if (typeof val === "string") {
    const str = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Format DD/MM/YYYY or DD-MM-YYYY
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return tanggalWIB();
}

export function ModalImportUnit({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dataParsed, setDataParsed] = React.useState<ParsedUnitRow[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setDataParsed([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (rows.length === 0) {
          toast.error("File Excel kosong atau tidak memiliki baris data");
          setIsProcessing(false);
          return;
        }

        const hasil: ParsedUnitRow[] = rows.map((r) => {
          const brand = String(r["Brand"] || r["brand"] || r["BRAND"] || r["Merek"] || r["Merk"] || "").trim();
          const model = String(r["Model"] || r["model"] || r["MODEL"] || r["Tipe"] || r["Seri"] || "").trim();
          const hargaBeli = Math.max(
            0,
            parseFloat(String(r["Harga Beli"] || r["hargaBeli"] || r["Harga_Beli"] || r["Modal"] || 0)) || 0
          );
          const rawHargaJual = parseFloat(
            String(r["Harga Jual"] || r["hargaJual"] || r["Harga_Jual"] || r["Jual"] || 0)
          );
          const hargaJual = rawHargaJual && rawHargaJual > 0 ? rawHargaJual : null;

          const rawStatus = String(r["Status"] || r["status"] || r["STATUS"] || "READY")
            .trim()
            .toUpperCase();
          const status: "READY" | "MASUK_QC" = rawStatus === "MASUK_QC" ? "MASUK_QC" : "READY";

          const rawGrade = String(r["Grade"] || r["grade"] || r["GRADE"] || "")
            .trim()
            .toUpperCase();
          let grade: "A" | "B" | "C" | null = null;
          if (rawGrade === "A" || rawGrade === "B" || rawGrade === "C") {
            grade = rawGrade;
          } else if (status === "READY") {
            grade = "B"; // default jika ready tapi grade kosong
          }

          const tglBeli = parseTanggal(r["Tanggal Beli"] || r["tglBeli"] || r["Tanggal"] || r["Tgl"]);
          const adaBox = parseBoolean(r["Box"] || r["adaBox"] || r["Kotak"]);
          const adaSurat = parseBoolean(r["Surat"] || r["adaSurat"] || r["Garansi"] || r["Kartu Garansi"]);
          const adaBuku = parseBoolean(r["Buku"] || r["adaBuku"] || r["Buku Manual"] || r["Manual"]);
          const adaExtraLink = parseBoolean(r["Extra Link"] || r["adaExtraLink"] || r["Link"] || r["Rantai"]);
          const adaSertifikat = parseBoolean(r["Sertifikat"] || r["adaSertifikat"] || r["COA"]);

          const catatanKondisi =
            String(r["Kondisi"] || r["catatanKondisi"] || r["Catatan Kondisi"] || "").trim() || null;
          const catatan = String(r["Catatan"] || r["catatan"] || r["Keterangan"] || "").trim() || null;

          const errorList: string[] = [];
          if (!brand) errorList.push("Brand wajib diisi");
          if (!model) errorList.push("Model wajib diisi");
          if (hargaBeli <= 0) errorList.push("Harga beli modal harus > 0");

          return {
            brand,
            model,
            hargaBeli,
            hargaJual,
            status,
            grade,
            tglBeli,
            adaBox,
            adaSurat,
            adaBuku,
            adaExtraLink,
            adaSertifikat,
            catatanKondisi,
            catatan,
            valid: errorList.length === 0,
            pesanError: errorList.join(", "),
          };
        });

        setDataParsed(hasil);
      } catch (err) {
        toast.error("Gagal membaca file Excel: " + (err instanceof Error ? err.message : "Format tidak sesuai"));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importMutation = useMutation({
    mutationFn: () => {
      const itemsValid = dataParsed
        .filter((r) => r.valid)
        .map((r) => ({
          brand: r.brand,
          model: r.model,
          hargaBeli: r.hargaBeli,
          hargaJual: r.hargaJual,
          status: r.status,
          grade: r.grade,
          tglBeli: r.tglBeli,
          adaBox: r.adaBox,
          adaSurat: r.adaSurat,
          adaBuku: r.adaBuku,
          adaExtraLink: r.adaExtraLink,
          adaSertifikat: r.adaSertifikat,
          catatanKondisi: r.catatanKondisi,
          catatan: r.catatan,
        }));

      return api.post<{ ok: boolean; count: number }>("/api/units/import", { items: itemsValid });
    },
    onSuccess: (res: { count?: number }) => {
      toast.success(`${res?.count ?? dataParsed.length} unit jam berhasil diimport ke stok lama!`);
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["qc"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const validCount = dataParsed.filter((r) => r.valid).length;
  const invalidCount = dataParsed.length - validCount;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      judul="Import Stok Jam via Excel"
      deskripsi="Unggah spreadsheet (.xlsx / .xls / .csv) untuk memasukkan inventaris jam lama secara massal tanpa memotong saldo kas."
    >
      <div className="space-y-4">
        {/* Banner Download Template */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Butuh format file template?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Unduh template resmi lengkap dengan contoh jam dan petunjuk kolom.
            </p>
          </div>
          <a href="/api/units/template" download="Template-Import-Stok-Jam.xlsx">
            <Button
              varian="secondary"
              className="bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Unduh Template
            </Button>
          </a>
        </div>

        {/* File Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Pilih File Excel / CSV
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-blue-400 dark:text-gray-400"
            />
          </div>
        </div>

        {/* Data Preview */}
        {dataParsed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Pratinjau Data ({dataParsed.length} baris)
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center text-red-700 dark:text-red-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" /> {invalidCount} ada error
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-zinc-700">
              <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-zinc-700">
                <thead className="bg-gray-50 dark:bg-zinc-800 sticky top-0">
                  <tr>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Brand & Model</th>
                    <th className="px-2.5 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300">Status Awal</th>
                    <th className="px-2.5 py-1.5 text-center font-medium text-gray-600 dark:text-gray-300">Grade</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">Harga Beli</th>
                    <th className="px-2.5 py-1.5 text-right font-medium text-gray-600 dark:text-gray-300">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                  {dataParsed.map((r, i) => (
                    <tr key={i} className={!r.valid ? "bg-red-50/60 dark:bg-red-950/30" : undefined}>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        {r.valid ? (
                          <Badge warna="hijau">OK</Badge>
                        ) : (
                          <span className="text-red-700 dark:text-red-400 font-medium" title={r.pesanError}>
                            {r.pesanError}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-gray-900 dark:text-gray-100">
                        {r.brand} {r.model}
                      </td>
                      <td className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300">
                        {r.status === "READY" ? (
                          <Badge warna="biru">READY</Badge>
                        ) : (
                          <Badge warna="kuning">QC</Badge>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 text-center text-gray-700 dark:text-gray-300">
                        {r.grade ?? "-"}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                        {formatRupiah(r.hargaBeli)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {r.hargaJual ? formatRupiah(r.hargaJual) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
          <Button varian="secondary" onClick={onClose} disabled={importMutation.isPending || isProcessing}>
            Batal
          </Button>
          <Button
            loading={importMutation.isPending || isProcessing}
            disabled={validCount === 0}
            onClick={() => importMutation.mutate()}
          >
            Import {validCount} Unit Jam
          </Button>
        </div>
      </div>
    </Modal>
  );
}
