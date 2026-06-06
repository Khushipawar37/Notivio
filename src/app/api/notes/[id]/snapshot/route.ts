import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { canEditFromRole, getNoteAccessRole } from "@/server/note-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await context.params;
  const accessRole = await getNoteAccessRole(noteId, user.id);
  if (!canEditFromRole(accessRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { snapshot?: unknown };
  if (!body.snapshot) {
    return NextResponse.json({ error: "snapshot is required" }, { status: 400 });
  }

  const revision = await prisma.noteRevision.create({
    data: {
      noteId,
      userId: user.id,
      snapshot: body.snapshot,
    },
  });

  return NextResponse.json(revision);
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await context.params;
  const accessRole = await getNoteAccessRole(noteId, user.id);
  if (!accessRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const revisions = await prisma.noteRevision.findMany({
    where: { noteId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ revisions });
}
