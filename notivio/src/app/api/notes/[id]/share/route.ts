import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { getNoteAccessRole } from "@/server/note-access";

interface ShareBody {
  role?: "viewer" | "editor";
  expiresInDays?: number;
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await context.params;
  const accessRole = await getNoteAccessRole(noteId, user.id);
  if (accessRole !== "owner" && accessRole !== "editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as ShareBody;
  const role = body.role === "editor" ? "editor" : "viewer";
  const expiresInDays = Number(body.expiresInDays ?? 7);

  const expiresAt =
    expiresInDays > 0
      ? new Date(Date.now() + Math.min(expiresInDays, 365) * 24 * 60 * 60 * 1000)
      : null;

  const token = randomBytes(24).toString("hex");

  const link = await prisma.sharedLink.create({
    data: {
      noteId,
      token,
      role,
      expiresAt,
      createdById: user.id,
    },
  });

  return NextResponse.json({
    token: link.token,
    role: link.role,
    expiresAt: link.expiresAt,
    url: `${getBaseUrl(request)}/notes?share=${link.token}`,
    localOnly: getBaseUrl(request).includes("localhost"),
  });
}
