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
  const card = await prisma.speechCard.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
    include: { client: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.speechCard.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = { ...body };
  if (data.date) data.date = new Date(data.date as string);
  delete data.id;
  delete data.clientId;
  delete data.client;
  delete data.createdAt;

  const card = await prisma.speechCard.update({
    where: { id: parseInt(id) },
    data: data as any,
  });
  return NextResponse.json(card);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.speechCard.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.speechCard.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
