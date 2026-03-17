import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await prisma.session.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const data: Record<string, unknown> = { ...body };
  if (data.date) data.date = new Date(data.date as string);
  if (data.clientId) data.clientId = parseInt(data.clientId as string);
  if (data.duration) data.duration = parseInt(data.duration as string);

  const updated = await prisma.session.update({
    where: { id: parseInt(id) },
    data: data as any,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await prisma.session.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.session.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
