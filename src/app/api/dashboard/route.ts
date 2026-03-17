import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    totalClients,
    activeClients,
    todaySessions,
    weekSessions,
    recentClients,
    upcomingSessions,
    completedThisMonth,
  ] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.client.count({ where: { status: "ACTIVE", userId: user.id } }),
    prisma.session.count({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        client: { userId: user.id },
      },
    }),
    prisma.session.count({
      where: {
        date: { gte: todayStart, lt: weekEnd },
        client: { userId: user.id },
      },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        diagnosis: true,
        createdAt: true,
      },
    }),
    prisma.session.findMany({
      where: {
        date: { gte: todayStart },
        status: "PLANNED",
        client: { userId: user.id },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 8,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.session.count({
      where: {
        status: "COMPLETED",
        date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        client: { userId: user.id },
      },
    }),
  ]);

  const upcomingBirthdays = await prisma.client.findMany({
    where: { status: "ACTIVE", userId: user.id },
    select: { id: true, firstName: true, lastName: true, birthDate: true },
  });

  const birthdays = upcomingBirthdays
    .filter((c) => {
      const bd = new Date(c.birthDate);
      const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < todayStart) next.setFullYear(next.getFullYear() + 1);
      const diff =
        (next.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    })
    .map((c) => {
      const bd = new Date(c.birthDate);
      const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < todayStart) next.setFullYear(next.getFullYear() + 1);
      return { ...c, nextBirthday: next.toISOString() };
    })
    .sort(
      (a, b) =>
        new Date(a.nextBirthday).getTime() -
        new Date(b.nextBirthday).getTime()
    )
    .slice(0, 5);

  return NextResponse.json({
    totalClients,
    activeClients,
    todaySessions,
    weekSessions,
    completedThisMonth,
    recentClients,
    upcomingSessions,
    birthdays,
  });
}
