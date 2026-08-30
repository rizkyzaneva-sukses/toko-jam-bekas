"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/ui";

export function Modal({
  open,
  onOpenChange,
  judul,
  deskripsi,
  children,
  lebar = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  judul: string;
  deskripsi?: string;
  children: React.ReactNode;
  lebar?: "md" | "lg" | "xl";
}) {
  const kelasLebar = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" }[lebar];

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />
        <RadixDialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border p-5",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[92vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
            "border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
            kelasLebar && `sm:${kelasLebar}`,
            lebar === "md" && "sm:max-w-md",
            lebar === "lg" && "sm:max-w-2xl",
            lebar === "xl" && "sm:max-w-4xl"
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {judul}
              </RadixDialog.Title>
              {deskripsi && (
                <RadixDialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {deskripsi}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                aria-label="Tutup"
                className="rounded-md p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Dialog konfirmasi — dipakai sebelum aksi yang sulit dibatalkan. */
export function ConfirmDialog({
  open,
  onOpenChange,
  judul,
  pesan,
  labelKonfirmasi = "Ya, lanjutkan",
  varian = "danger",
  loading,
  onKonfirmasi,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  judul: string;
  pesan: React.ReactNode;
  labelKonfirmasi?: string;
  varian?: "danger" | "primary";
  loading?: boolean;
  onKonfirmasi: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} judul={judul}>
      <div className="text-sm text-gray-700 dark:text-gray-300">{pesan}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button varian="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
          Batal
        </Button>
        <Button varian={varian} loading={loading} onClick={onKonfirmasi}>
          {labelKonfirmasi}
        </Button>
      </div>
    </Modal>
  );
}
