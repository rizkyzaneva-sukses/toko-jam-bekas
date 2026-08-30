"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import type { BarisLedger } from "@/lib/tipe";
import { LABEL_LEDGER } from "@/lib/tipe";
import { bulanIniWIB, formatTanggal } from "@/lib/utils";
import { PilihBulan } from "@/components/pilih-bulan";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SkeletonTabel,
  StatCard,
  Tabel,
  TabelWrap,
  Td,
  Th,
} from "@/components/ui/ui";

const OPSI_JENIS = [
  { value: "SEMUA", label: "Semua pergerakan" },
  ...Object.entries(LABEL_LEDGER).map(([value, label]) => ({ value, label })),
];

export default function HalamanLedger() {
  const [bulan, setBulan] = React.useState(bulanIniWIB());
  const [jenis, setJenis] = React.useState("SEMUA");
  const [q, setQ] = React.useState("");
  const [qDebounce, setQDebounce] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounce(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ledger", bulan, jenis, qDebounce],
    queryFn: () =>
      api.get<BarisLedger[]>(
        `/api/ledger?bulan=${bulan}&jenis=${jenis}&q=${encodeURIComponent(qDebounce)}`
      ),
  });

  const rows = data ?? [];
  const masuk = rows.filter((r) => r.qty > 0).length;
  const keluar = rows.filter((r) => r.qty < 0).length;

  return (
    <>
      <PageHeader
        judul="Stok Ledger"
        deskripsi="Buku besar pergerakan barang. Semua baris dibuat otomatis oleh sistem — tidak bisa diinput manual."
        aksi={
          <a href={`/api/export?jenis=ledger&bulan=${bulan}`}>
            <Button varian="secondary">
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          </a>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Baris tampil" nilai={rows.length} rupiah={false} />
        <StatCard label="Unit masuk stok" nilai={masuk} rupiah={false} />
        <StatCard label="Unit keluar stok" nilai={keluar} rupiah={false} />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Cari unit">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kode, brand, model"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Periode">
            <PilihBulan value={bulan} onChange={setBulan} denganSemua className="w-full" />
          </Field>

          <Field label="Jenis pergerakan">
            <SearchableSelect
              options={OPSI_JENIS}
              value={jenis}
              onChange={(v) => setJenis(v ?? "SEMUA")}
              placeholder="Semua pergerakan"
            />
          </Field>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <SkeletonTabel baris={10} />
        ) : error ? (
          <ErrorState pesan={(error as Error).message} onCoba={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            judul="Belum ada pergerakan"
            deskripsi="Ledger terisi otomatis saat unit dibeli, di-QC, diservice, dijual, atau ditulis-hapus."
          />
        ) : (
          <TabelWrap>
            <Tabel>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Kode</Th>
                  <Th>Jam</Th>
                  <Th>Pergerakan</Th>
                  <Th className="text-right">Qty</Th>
                  <Th>Keterangan</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td>{formatTanggal(r.tanggal)}</Td>
                    <Td>
                      <Link
                        href={`/unit/${r.unitId}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {r.kodeUnit}
                      </Link>
                    </Td>
                    <Td>{r.namaLengkap}</Td>
                    <Td>
                      <Badge
                        warna={
                          r.qty > 0 ? "hijau" : r.qty < 0 ? "merah" : "abu"
                        }
                      >
                        {LABEL_LEDGER[r.jenis] ?? r.jenis}
                      </Badge>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {r.qty > 0 ? `+${r.qty}` : r.qty === 0 ? "—" : r.qty}
                    </Td>
                    <Td className="max-w-[280px] truncate text-gray-600 dark:text-gray-400">
                      {r.keterangan ?? "-"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWrap>
        )}
      </Card>
    </>
  );
}
