import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";

  const where: Record<string, unknown> = { userId: user.id };
  
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { patronymic: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (source) where.source = source;

  const clients = await prisma.client.findMany({
    where: where as any,
    orderBy: { lastName: "asc" },
    include: { _count: { select: { sessions: true, speechCards: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      firstName: body.firstName,
      lastName: body.lastName,
      patronymic: body.patronymic || "",
      birthDate: new Date(body.birthDate),
      parentName: body.parentName,
      parentPhone: body.parentPhone,
      parentEmail: body.parentEmail || null,
      diagnosis: body.diagnosis,
      source: body.source,
      status: body.status || "ACTIVE",
      notes: body.notes || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
