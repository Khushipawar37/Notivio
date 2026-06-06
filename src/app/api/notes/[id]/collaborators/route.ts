import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { getNoteAccessRole } from "@/server/note-access";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await context.params;
  const accessRole = await getNoteAccessRole(noteId, user.id);
  if (!accessRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [note, collaborators, links] = await Promise.all([
    prisma.page.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        title: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.noteCollaborator.findMany({
      where: { noteId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.sharedLink.findMany({
      where: {
        noteId,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        role: true,
        token: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    note,
    accessRole,
    collaborators,
    links: links.map((link) => ({
      ...link,
      url: `/notes?share=${link.token}`,
    })),
  });
}
