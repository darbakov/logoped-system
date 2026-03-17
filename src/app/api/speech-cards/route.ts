import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = { client: { userId: user.id } };
  if (clientId) where.clientId = parseInt(clientId);

  const cards = await prisma.speechCard.findMany({
    where: where as any,
    orderBy: { date: "desc" },
    include: { client: { select: { id: true, firstName: true, lastName: true, patronymic: true } } },
  });

  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const clientId = parseInt(body.clientId);
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.speechCard.create({
    data: {
      clientId,
      date: new Date(body.date || new Date()),
      soundPronunciation: body.soundPronunciation || "{}",
      phonematicHearing: body.phonematicHearing || "",
      syllableStructure: body.syllableStructure || "",
      vocabulary: body.vocabulary || "",
      grammar: body.grammar || "",
      coherentSpeech: body.coherentSpeech || "",
      conclusion: body.conclusion || "",
    },
  });
  return NextResponse.json(card, { status: 201 });
}
