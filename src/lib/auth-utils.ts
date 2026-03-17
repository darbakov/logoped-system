import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: parseInt(session.user.id),
    name: session.user.name,
    email: session.user.email,
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}
