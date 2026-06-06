import { SourceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

function mapSource(source: {
  id: string;
  title: string;
  type: SourceType;
  originalUrl: string | null;
  extractedText: string | null;
  createdAt: Date;
  fileData: Uint8Array | null;
}) {
  return {
    id: source.id,
    title: source.title,
    type: source.type === SourceType.PDF ? "pdf" : "url",
    originalUrl: source.originalUrl ?? undefined,
    extractedText: source.extractedText ?? undefined,
    fileUrl: source.fileData ? `/api/workspace/sources/${source.id}/file` : undefined,
    createdAt: source.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workspaceKey = searchParams.get("workspaceKey");
  if (!workspaceKey) return NextResponse.json({ error: "workspaceKey is required" }, { status: 400 });

  const sources = await prisma.studySource.findMany({
    where: { userId: user.id, workspaceKey },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      originalUrl: true,
      extractedText: true,
      createdAt: true,
      fileData: true,
    },
  });

  return NextResponse.json(sources.map(mapSource));
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    workspaceKey?: string;
    title?: string;
    type?: "pdf" | "url";
    originalUrl?: string;
    extractedText?: string;
    fileName?: string;
    mimeType?: string;
    fileBase64?: string;
  };

  const workspaceKey = String(body.workspaceKey ?? "");
  if (!workspaceKey) return NextResponse.json({ error: "workspaceKey is required" }, { status: 400 });

  const source = await prisma.studySource.create({
    data: {
      userId: user.id,
      workspaceKey,
      pageId: workspaceKey === "global" ? null : workspaceKey,
      title: String(body.title ?? "Source"),
      type: body.type === "pdf" ? SourceType.PDF : SourceType.URL,
      originalUrl: body.originalUrl ?? null,
      extractedText: body.extractedText ?? null,
      fileName: body.fileName ?? null,
      mimeType: body.mimeType ?? null,
      fileData: body.fileBase64 ? Buffer.from(body.fileBase64, "base64") : null,
    },
    select: {
      id: true,
      title: true,
      type: true,
      originalUrl: true,
      extractedText: true,
      createdAt: true,
      fileData: true,
    },
  });

  return NextResponse.json(mapSource(source));
}
