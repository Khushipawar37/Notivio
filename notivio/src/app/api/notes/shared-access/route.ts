import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: {
      note: {
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
          notebookId: true,
          sectionId: true,
        },
      },
    },
  });

  if (!link || link.revokedAt) {
    return NextResponse.json({ error: "Invalid share token" }, { status: 404 });
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Share token expired" }, { status: 410 });
  }

  return NextResponse.json({
    role: link.role,
    note: link.note,
  });
}
