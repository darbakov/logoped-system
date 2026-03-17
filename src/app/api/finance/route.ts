import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE", userId: user.id },
      include: {
        payments: true,
        sessions: { where: { status: "COMPLETED" } },
      },
    });

    const summary = clients.map((c) => {
      const totalEarned = c.sessions.reduce((sum, s) => sum + (s.price || c.sessionPrice || 0), 0);
      const totalPaid = c.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        clientId: c.id,
        clientName: `${c.lastName} ${c.firstName}`,
        sessionPrice: c.sessionPrice,
        completedSessions: c.sessions.length,
        totalEarned,
        totalPaid,
        balance: totalPaid - totalEarned,
      };
    });

    return NextResponse.json(summary);
  }

  const client = await prisma.client.findFirst({
    where: { id: parseInt(clientId), userId: user.id },
    include: {
      payments: { orderBy: { date: "desc" } },
      sessions: { where: { status: "COMPLETED" }, orderBy: { date: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalEarned = client.sessions.reduce((sum, s) => sum + (s.price || client.sessionPrice || 0), 0);
  const totalPaid = client.payments.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    clientId: client.id,
    clientName: `${client.lastName} ${client.firstName}`,
    sessionPrice: client.sessionPrice,
    completedSessions: client.sessions.length,
    totalEarned,
    totalPaid,
    balance: totalPaid - totalEarned,
    payments: client.payments,
    sessions: client.sessions,
  });
}
