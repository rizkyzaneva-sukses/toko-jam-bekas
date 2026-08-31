import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-helpers";

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const aksi = searchParams.get("aksi");
  const entitas = searchParams.get("entitas");
  const userId = searchParams.get("userId");
  const halaman = Math.max(1, parseInt(searchParams.get("halaman") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "30", 10)));
  const skip = (halaman - 1) * limit;

  const prisma = getPrisma();
  const where: Prisma.AuditLogWhereInput = {};

  if (aksi && aksi !== "SEMUA") {
    where.aksi = aksi;
  }
  if (entitas && entitas !== "SEMUA") {
    where.entitas = entitas;
  }
  if (userId && userId !== "SEMUA") {
    where.userId = userId;
  }
  if (q) {
    where.OR = [
      { user: { nama: { contains: q, mode: "insensitive" } } },
      { user: { username: { contains: q, mode: "insensitive" } } },
      { entitas: { contains: q, mode: "insensitive" } },
      { entitasId: { contains: q, mode: "insensitive" } },
      { aksi: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows, users] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, nama: true, username: true, role: true },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, nama: true, role: true },
      orderBy: { nama: "asc" },
    }),
  ]);

  // Hitung aktivitas hari ini
  const awalHari = new Date();
  awalHari.setHours(0, 0, 0, 0);
  const aktivitasHariIni = await prisma.auditLog.count({
    where: { createdAt: { gte: awalHari } },
  });

  return NextResponse.json({
    logs: rows.map((l) => ({
      id: l.id,
      userId: l.userId,
      user: l.user,
      aksi: l.aksi,
      entitas: l.entitas,
      entitasId: l.entitasId,
      detail: l.detail,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    halaman,
    totalHalaman: Math.ceil(total / limit) || 1,
    users,
    statistik: {
      total,
      aktivitasHariIni,
    },
  });
});
