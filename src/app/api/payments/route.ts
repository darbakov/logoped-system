import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = { client: { userId: user.id } };
  if (clientId) where.clientId = parseInt(clientId);

  const payments = await prisma.payment.findMany({
    where: where as any,
    orderBy: { date: "desc" },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
  });
  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const clientId = parseInt(body.clientId);

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      clientId,
      amount: parseInt(body.amount),
      date: new Date(body.date || new Date()),
      method: body.method || "CASH",
      notes: body.notes || null,
    },
  });
  return NextResponse.json(payment, { status: 201 });
}
