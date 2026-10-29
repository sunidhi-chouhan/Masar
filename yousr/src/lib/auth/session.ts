import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/domain/types";

export const SESSION_COOKIE = "masar_session";

export interface Session {
  userId: string;
  role: Role;
  name: string;
  nameAr: string;
}

// Demo-grade session: a signed-in persona is stored in an httpOnly cookie.
// A pilot would replace this with UAE PASS / OIDC. Authorization never relies
// on the cookie alone; every repository call re-checks role + consent.
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const user = await prisma.user.findUnique({ where: { id: raw } });
  if (!user) return null;
  return { userId: user.id, role: user.role as Role, name: user.name, nameAr: user.nameAr };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
