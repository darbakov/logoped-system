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
  const existing = await prisma.homework.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.description !== undefined) data.description = body.description;
  if (body.exercises !== undefined) data.exercises = body.exercises;
  if (body.notes !== undefined) data.notes = body.notes;

  const hw = await prisma.homework.update({
    where: { id: parseInt(id) },
    data: data as any,
  });
  return NextResponse.json(hw);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.homework.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.homework.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
