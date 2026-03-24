import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sourceId } = await params;
  const source = await prisma.studySource.findFirst({
    where: { id: sourceId, userId: user.id },
    select: {
      title: true,
      mimeType: true,
      fileName: true,
      fileData: true,
    },
  });

  if (!source?.fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const contentType = source.mimeType || "application/pdf";
  return new NextResponse(source.fileData, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${source.fileName || source.title}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
