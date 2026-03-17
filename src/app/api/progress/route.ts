import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({ where: { id: parseInt(clientId), userId: user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await prisma.soundProgress.findMany({
    where: { clientId: parseInt(clientId) },
    orderBy: { sound: "asc" },
  });

  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const clientId = parseInt(body.clientId);
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sound = body.sound;
  const stage = body.stage;

  const progress = await prisma.soundProgress.upsert({
    where: { clientId_sound: { clientId, sound } },
    update: { stage },
    create: { clientId, sound, stage },
  });

  return NextResponse.json(progress);
}
