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
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.categoryId !== undefined) data.categoryId = parseInt(body.categoryId);
  if (body.minAge !== undefined) data.minAge = parseInt(body.minAge);
  if (body.maxAge !== undefined) data.maxAge = parseInt(body.maxAge);
  if (body.targetSounds !== undefined) data.targetSounds = body.targetSounds;

  const exercise = await prisma.exercise.update({
    where: { id: parseInt(id) },
    data: data as any,
    include: { category: true },
  });
  return NextResponse.json(exercise);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  await prisma.exercise.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
