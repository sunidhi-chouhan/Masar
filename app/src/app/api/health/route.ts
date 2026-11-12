import { connection, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

// For the host's health check. Reports whether the data folder can be
// written, and nothing about any person.
export async function GET() {
  await connection();
  const dir = process.env.MASAR_DATA_DIR || path.join(process.cwd(), ".data");
  let storage = "ok";
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch {
    storage = "not writable";
  }
  return NextResponse.json({ status: storage === "ok" ? "ok" : "degraded", storage }, { status: storage === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
