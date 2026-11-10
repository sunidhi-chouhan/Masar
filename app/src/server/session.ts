import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PERSON_IDS, findAccount, sign, verifySignature, type Role } from "@/lib/accounts";

// Sessions are a signed cookie naming the account. They are created only by a
// verified login link (see /auth/[token]); UAE PASS and facility sign-on plug
// in at the same point later.

export type { Role };

export interface Session {
  role: Role;
  id: string;
}

const COOKIE = "masar_session";

export function sessionCookie(s: Session): [string, string] {
  const value = `${s.role}:${s.id}`;
  return [COOKIE, `${value}.${sign(value)}`];
}

export function clearCookieName(): string {
  return COOKIE;
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  const value = raw.slice(0, dot);
  if (!verifySignature(value, raw.slice(dot + 1))) return null;
  const [role, id] = value.split(":");
  return findAccount(role, id) ? { role: role as Role, id } : null;
}

export async function requireRole(role: Role): Promise<Session> {
  // Signed-in pages are always rendered per request (they log access with timestamps).
  await connection();
  const s = await getSession();
  if (!s) redirect("/sign-in");
  if (s.role !== role) redirect("/");
  return s;
}

export function isPerson(id: string): boolean {
  return PERSON_IDS.includes(id);
}
