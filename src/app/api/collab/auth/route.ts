import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { getNoteAccessRole } from "@/server/note-access";

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { noteId?: string };
  const noteId = String(body.noteId ?? "");

  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  const role = await getNoteAccessRole(noteId, user.id);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return NextResponse.json({
    token,
    noteId,
    role,
    expiresAt,
    wsRoom: `note-${noteId}`,
  });
}
