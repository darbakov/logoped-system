import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!dbUser) return unauthorized();

  const clientCount = await prisma.client.count({ where: { userId: user.id } });
  const sessionCount = await prisma.session.count({
    where: { client: { userId: user.id } },
  });

  return NextResponse.json({ ...dbUser, clientCount, sessionCount });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { name, email, currentPassword, newPassword } = body;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return unauthorized();

  const updateData: Record<string, string> = {};

  if (name && name !== dbUser.name) {
    updateData.name = name;
  }

  if (email && email !== dbUser.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: "Этот email уже используется" },
        { status: 409 }
      );
    }
    updateData.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Введите текущий пароль" },
        { status: 400 }
      );
    }

    const isValid = await compare(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Новый пароль должен быть минимум 6 символов" },
        { status: 400 }
      );
    }

    updateData.password = await hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: "Нечего обновлять" });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
