import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const clientId = parseInt(body.clientId);
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Array<{ sound: string; stage: string }> = body.updates;

  const operations = updates.map((u) =>
    prisma.soundProgress.upsert({
      where: { clientId_sound: { clientId, sound: u.sound } },
      update: { stage: u.stage },
      create: { clientId, sound: u.sound, stage: u.stage },
    })
  );

  const results = await prisma.$transaction(operations);
  return NextResponse.json(results);
}
