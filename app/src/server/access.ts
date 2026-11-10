import "server-only";
import crypto from "node:crypto";

/**
 * The /access page (login links and data reset) is never linked from the
 * product. In production it needs ACCESS_KEY; in development it is open.
 */
export function accessAllowed(key: string | undefined): boolean {
  const expected = process.env.ACCESS_KEY;
  if (!expected) return process.env.NODE_ENV !== "production";
  if (!key || key.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}
