import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { client: { userId: user.id } };
  if (clientId) where.clientId = parseInt(clientId);
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const sessions = await prisma.session.findMany({
    where: where as any,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { client: { select: { id: true, firstName: true, lastName: true, patronymic: true } } },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();

  const client = await prisma.client.findFirst({ where: { id: parseInt(body.clientId), userId: user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = [];

  if (body.isRecurring && body.repeatWeeks && body.repeatWeeks > 1) {
    const groupId = `recurring_${Date.now()}`;
    for (let i = 0; i < body.repeatWeeks; i++) {
      const date = new Date(body.date);
      date.setDate(date.getDate() + i * 7);
      sessions.push(
        prisma.session.create({
          data: {
            clientId: parseInt(body.clientId),
            date,
            startTime: body.startTime,
            duration: parseInt(body.duration) || 30,
            type: body.type || "Индивидуальное",
            status: "PLANNED",
            notes: body.notes || null,
            isRecurring: true,
            recurringGroupId: groupId,
          },
        })
      );
    }
    const result = await prisma.$transaction(sessions);
    return NextResponse.json(result, { status: 201 });
  }

  const session = await prisma.session.create({
    data: {
      clientId: parseInt(body.clientId),
      date: new Date(body.date),
      startTime: body.startTime,
      duration: parseInt(body.duration) || 30,
      type: body.type || "Индивидуальное",
      status: "PLANNED",
      notes: body.notes || null,
      isRecurring: body.isRecurring || false,
    },
  });

  return NextResponse.json(session, { status: 201 });
}
