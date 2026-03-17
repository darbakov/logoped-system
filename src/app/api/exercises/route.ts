import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { targetSounds: { contains: search } },
    ];
  }

  const exercises = await prisma.exercise.findMany({
    where: where as any,
    orderBy: { title: "asc" },
    include: { category: true },
  });

  return NextResponse.json(exercises);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const exercise = await prisma.exercise.create({
    data: {
      title: body.title,
      description: body.description || "",
      categoryId: parseInt(body.categoryId),
      minAge: parseInt(body.minAge) || 3,
      maxAge: parseInt(body.maxAge) || 7,
      targetSounds: body.targetSounds || "",
    },
    include: { category: true },
  });
  return NextResponse.json(exercise, { status: 201 });
}
