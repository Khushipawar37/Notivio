import { prisma } from "@/server/prisma";

export type NoteAccessRole = "owner" | "editor" | "viewer" | null;

export async function getNoteAccessRole(noteId: string, userId: string): Promise<NoteAccessRole> {
  const note = await prisma.page.findUnique({
    where: { id: noteId },
    select: { userId: true },
  });

  if (!note) return null;
  if (note.userId === userId) return "owner";

  const collaborator = await prisma.noteCollaborator.findUnique({
    where: {
      noteId_userId: {
        noteId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!collaborator) return null;
  return collaborator.role === "editor" ? "editor" : "viewer";
}

export function canEditFromRole(role: NoteAccessRole) {
  return role === "owner" || role === "editor";
}
