import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

async function verifySessionOwnership(sessionId: number, userId: number) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, client: { userId } },
  });
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await verifySessionOwnership(parseInt(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exercises = await prisma.sessionExercise.findMany({
    where: { sessionId: parseInt(id) },
    include: { exercise: { include: { category: true } } },
  });
  return NextResponse.json(exercises);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await verifySessionOwnership(parseInt(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const sessionId = parseInt(id);
  const exerciseId = parseInt(body.exerciseId);

  const existing = await prisma.sessionExercise.findUnique({
    where: { sessionId_exerciseId: { sessionId, exerciseId } },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const se = await prisma.sessionExercise.create({
    data: { sessionId, exerciseId, notes: body.notes || null },
    include: { exercise: { include: { category: true } } },
  });
  return NextResponse.json(se, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await verifySessionOwnership(parseInt(id), user.id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const sessionId = parseInt(id);
  const exerciseId = parseInt(body.exerciseId);

  await prisma.sessionExercise.delete({
    where: { sessionId_exerciseId: { sessionId, exerciseId } },
  });
  return NextResponse.json({ success: true });
}
