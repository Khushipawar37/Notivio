import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sourceId } = await params;
  const body = (await request.json()) as {
    title?: string;
    extractedText?: string;
  };

  const source = await prisma.studySource.updateMany({
    where: { id: sourceId, userId: user.id },
    data: {
      ...(typeof body.title === "string" ? { title: body.title } : {}),
      ...(typeof body.extractedText === "string"
        ? { extractedText: body.extractedText }
        : {}),
    },
  });

  if (!source.count) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sourceId } = await params;
  await prisma.studySource.deleteMany({
    where: { id: sourceId, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
