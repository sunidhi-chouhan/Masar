import "server-only";
import crypto from "node:crypto";

/**
 * Demo access (/access) is linked from the public landing page and the
 * sign-in screen. Key verification is off for now, so /access, /prototype
 * and the studio actions open with no key. Set this true to require
 * ACCESS_KEY again (open in development; ?key= in production).
 */
const ACCESS_KEY_REQUIRED = false;

export function accessAllowed(key: string | undefined): boolean {
  if (!ACCESS_KEY_REQUIRED) return true;
  const expected = process.env.ACCESS_KEY;
  if (!expected) return process.env.NODE_ENV !== "production";
  if (!key || key.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}

/** Whether demo access can be opened on this server at all (with the right key). */
export function accessEnabled(): boolean {
  if (!ACCESS_KEY_REQUIRED) return true;
  return Boolean(process.env.ACCESS_KEY) || process.env.NODE_ENV !== "production";
}
