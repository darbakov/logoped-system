import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id: parseInt(id), userId: user.id },
    include: {
      sessions: { orderBy: { date: "desc" }, take: 10 },
      speechCards: { orderBy: { date: "desc" } },
      soundProgress: true,
      _count: { select: { sessions: true, speechCards: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.client.findFirst({
    where: { id: parseInt(id), userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...body };
  if (data.birthDate) data.birthDate = new Date(data.birthDate as string);

  const client = await prisma.client.update({
    where: { id: parseInt(id) },
    data: data as any,
  });

  return NextResponse.json(client);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.client.findFirst({
    where: { id: parseInt(id), userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  await prisma.client.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
