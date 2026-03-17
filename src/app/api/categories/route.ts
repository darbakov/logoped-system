import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { exercises: true } }, children: true },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const category = await prisma.category.create({
    data: {
      name: body.name,
      parentId: body.parentId ? parseInt(body.parentId) : null,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
