"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeAlert,
  BookOpen,
  Boxes,
  ClipboardCheck,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  ReceiptText,
  ScrollText,
  ShoppingCart,
  Store,
  TrendingUp,
  Wallet,
  Watch,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { ThemeToggle } from "@/components/theme-toggle";

interface ItemMenu {
  href: string;
  label: string;
  icon: React.ElementType;
}

const MENU: { grup: string; item: ItemMenu[] }[] = [
  {
    grup: "Ringkasan",
    item: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    grup: "Alur Barang",
    item: [
      { href: "/beli", label: "Beli Produk", icon: ShoppingCart },
      { href: "/qc", label: "QC", icon: ClipboardCheck },
      { href: "/service", label: "Service", icon: Wrench },
      { href: "/unit", label: "Inventory", icon: Package },
      { href: "/sparepart", label: "Stok Sparepart", icon: Boxes },
    ],
  },
  {
    grup: "Penjualan",
    item: [
      { href: "/penjualan", label: "Penjualan", icon: Receipt },
      { href: "/piutang", label: "Piutang", icon: HandCoins },
      { href: "/mitra", label: "Mitra", icon: Store },
    ],
  },
  {
    grup: "Keuangan",
    item: [
      { href: "/kas", label: "Kas", icon: Wallet },
      { href: "/biaya", label: "Biaya Operasional", icon: ReceiptText },
      { href: "/laporan", label: "Laporan L/R", icon: TrendingUp },
    ],
  },
  {
    grup: "Catatan",
    item: [
      { href: "/rusak", label: "Barang Rusak", icon: BadgeAlert },
      { href: "/ledger", label: "Stok Ledger", icon: ScrollText },
    ],
  },
  {
    grup: "Bantuan",
    item: [
      { href: "/panduan", label: "Panduan", icon: BookOpen },
      { href: "/study-case", label: "Study Case", icon: GraduationCap },
    ],
  },
];

function aktif(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ nama: string; role: string }>("/api/auth/me"),
  });

  React.useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  async function logout() {
    try {
      await api.post("/api/auth/logout");
      router.push("/login");
    } catch {
      toast.error("Gagal logout");
    }
  }

  const namaApp = process.env.NEXT_PUBLIC_APP_NAME || "Jam Bekas Ops";

  const isiSidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      {MENU.map((grup) => (
        <div key={grup.grup}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            {grup.grup}
          </p>
          <ul className="space-y-1">
            {grup.item.map((item) => {
              const Icon = item.icon;
              const isAktif = aktif(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isAktif
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                    )}
                    aria-current={isAktif ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Watch className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-50 sm:text-base">
              {namaApp}
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden text-sm text-gray-700 dark:text-gray-300 sm:inline">
              {user?.nama ?? ""}
            </span>
            <button
              onClick={logout}
              aria-label="Logout"
              title="Logout"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 lg:block">
          {isiSidebar}
        </aside>

        {/* Drawer HP */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Tutup menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawer(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-zinc-700">
                <span className="font-semibold text-gray-900 dark:text-gray-50">Menu</span>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="Tutup menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {isiSidebar}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
