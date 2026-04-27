import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

const ALLOWED_FILES = [
  "knowledge.json",
  "specific_rules.json",
  "escalation_rules.json",
  "ai_guidelines.json",
  "ai_policy.json",
];

function resolveDataPath(filename: string): string | null {
  if (!ALLOWED_FILES.includes(filename)) return null;
  return path.join(process.cwd(), "data", filename);
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  const filepath = file ? resolveDataPath(file) : null;

  if (!filepath) {
    return Response.json({ error: "Invalid file" }, { status: 400 });
  }

  const content = fs.readFileSync(filepath, "utf-8");
  return Response.json({ content });
}

export async function PUT(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  const filepath = file ? resolveDataPath(file) : null;

  if (!filepath) {
    return Response.json({ error: "Invalid file" }, { status: 400 });
  }

  const { content } = await request.json();

  JSON.parse(content);

  fs.writeFileSync(filepath, content, "utf-8");
  return Response.json({ ok: true });
}
