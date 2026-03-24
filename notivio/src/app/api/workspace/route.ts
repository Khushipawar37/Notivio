import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { StudySessionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const WORKSPACE_STATE_KEY = "default";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function mapBootstrap(notebooks: Awaited<ReturnType<typeof loadNotebooks>>, state: { activeNotebookId: string | null; activeSectionId: string | null; activePageId: string | null } | null) {
  return {
    notebooks: notebooks.map((notebook) => ({
      id: notebook.id,
      title: notebook.title,
      emoji: notebook.emoji,
      isExpanded: notebook.isExpanded,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
      sections: notebook.sections.map((section) => ({
        id: section.id,
        title: section.title,
        isExpanded: section.isExpanded,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        pages: section.pages.map((page) => ({
          id: page.id,
          title: page.title,
          content: page.content,
          tags: page.tags,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        })),
      })),
    })),
    state: state ?? {
      activeNotebookId: null,
      activeSectionId: null,
      activePageId: null,
    },
  };
}

async function loadNotebooks(userId: string) {
  return prisma.notebook.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          pages: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

async function getNotebookMaxSortOrder(userId: string) {
  const result = await prisma.notebook.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

async function getSectionMaxSortOrder(userId: string, notebookId: string) {
  const result = await prisma.section.aggregate({
    where: { userId, notebookId },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

async function getPageMaxSortOrder(userId: string, sectionId: string) {
  const result = await prisma.page.aggregate({
    where: { userId, sectionId },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) return unauthorized();

  const [notebooks, state] = await Promise.all([
    loadNotebooks(user.id),
    prisma.workspaceState.findUnique({
      where: {
        userId_key: { userId: user.id, key: WORKSPACE_STATE_KEY },
      },
      select: {
        activeNotebookId: true,
        activeSectionId: true,
        activePageId: true,
      },
    }),
  ]);

  return NextResponse.json(mapBootstrap(notebooks, state));
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) return unauthorized();

  const { action, payload } = (await request.json()) as {
    action: string;
    payload?: Record<string, unknown>;
  };

  try {
    switch (action) {
      case "createNotebook": {
        const created = await prisma.$transaction(async (tx) => {
          const notebookSortOrder = await getNotebookMaxSortOrder(user.id);
          const notebook = await tx.notebook.create({
            data: {
              userId: user.id,
              title: "New Notebook",
              emoji: "",
              isExpanded: true,
              sortOrder: notebookSortOrder,
            },
          });

          const section = await tx.section.create({
            data: {
              userId: user.id,
              notebookId: notebook.id,
              title: "General",
              isExpanded: true,
              sortOrder: 0,
            },
          });

          const page = await tx.page.create({
            data: {
              userId: user.id,
              notebookId: notebook.id,
              sectionId: section.id,
              title: "Untitled Page",
              content: "<h1>Untitled</h1><p>Start writing...</p>",
              tags: [],
              sortOrder: 0,
            },
          });

          await tx.workspaceState.upsert({
            where: { userId_key: { userId: user.id, key: WORKSPACE_STATE_KEY } },
            create: {
              userId: user.id,
              key: WORKSPACE_STATE_KEY,
              activeNotebookId: notebook.id,
              activeSectionId: section.id,
              activePageId: page.id,
            },
            update: {
              activeNotebookId: notebook.id,
              activeSectionId: section.id,
              activePageId: page.id,
            },
          });

          return { notebookId: notebook.id, sectionId: section.id, pageId: page.id };
        });

        return NextResponse.json(created);
      }

      case "createSection": {
        const notebookId = String(payload?.notebookId ?? "");
        if (!notebookId) return NextResponse.json({ error: "Invalid notebookId" }, { status: 400 });

        const sectionSortOrder = await getSectionMaxSortOrder(user.id, notebookId);
        const section = await prisma.section.create({
          data: {
            userId: user.id,
            notebookId,
            title: "New Section",
            isExpanded: true,
            sortOrder: sectionSortOrder,
          },
        });
        await prisma.notebook.updateMany({
          where: { id: notebookId, userId: user.id },
          data: { isExpanded: true },
        });
        return NextResponse.json({ sectionId: section.id });
      }

      case "createPage": {
        const notebookId = String(payload?.notebookId ?? "");
        const sectionId = String(payload?.sectionId ?? "");
        if (!notebookId || !sectionId) {
          return NextResponse.json({ error: "Invalid notebookId/sectionId" }, { status: 400 });
        }

        const pageSortOrder = await getPageMaxSortOrder(user.id, sectionId);
        const page = await prisma.page.create({
          data: {
            userId: user.id,
            notebookId,
            sectionId,
            title: "Untitled Page",
            content: "<h1>Untitled</h1><p>Start writing...</p>",
            tags: [],
            sortOrder: pageSortOrder,
          },
        });

        await prisma.section.updateMany({
          where: { id: sectionId, userId: user.id },
          data: { isExpanded: true },
        });

        await prisma.workspaceState.upsert({
          where: { userId_key: { userId: user.id, key: WORKSPACE_STATE_KEY } },
          create: {
            userId: user.id,
            key: WORKSPACE_STATE_KEY,
            activeNotebookId: notebookId,
            activeSectionId: sectionId,
            activePageId: page.id,
          },
          update: {
            activeNotebookId: notebookId,
            activeSectionId: sectionId,
            activePageId: page.id,
          },
        });

        return NextResponse.json({ pageId: page.id });
      }

      case "createPageInNotebook": {
        const notebookId = String(payload?.notebookId ?? "");
        if (!notebookId) return NextResponse.json({ error: "Invalid notebookId" }, { status: 400 });

        const firstSection = await prisma.section.findFirst({
          where: { userId: user.id, notebookId },
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        });

        let sectionId = firstSection?.id ?? null;
        if (!sectionId) {
          const section = await prisma.section.create({
            data: {
              userId: user.id,
              notebookId,
              title: "General",
              isExpanded: true,
              sortOrder: 0,
            },
          });
          sectionId = section.id;
        }

        const pageSortOrder = await getPageMaxSortOrder(user.id, sectionId);
        const page = await prisma.page.create({
          data: {
            userId: user.id,
            notebookId,
            sectionId,
            title: "Untitled Page",
            content: "<h1>Untitled</h1><p>Start writing...</p>",
            tags: [],
            sortOrder: pageSortOrder,
          },
        });

        await prisma.workspaceState.upsert({
          where: { userId_key: { userId: user.id, key: WORKSPACE_STATE_KEY } },
          create: {
            userId: user.id,
            key: WORKSPACE_STATE_KEY,
            activeNotebookId: notebookId,
            activeSectionId: sectionId,
            activePageId: page.id,
          },
          update: {
            activeNotebookId: notebookId,
            activeSectionId: sectionId,
            activePageId: page.id,
          },
        });

        return NextResponse.json({ sectionId, pageId: page.id });
      }

      case "renameNotebook": {
        await prisma.notebook.updateMany({
          where: { id: String(payload?.notebookId ?? ""), userId: user.id },
          data: { title: String(payload?.title ?? "New Notebook") },
        });
        return NextResponse.json({ ok: true });
      }

      case "renameSection": {
        await prisma.section.updateMany({
          where: { id: String(payload?.sectionId ?? ""), userId: user.id },
          data: { title: String(payload?.title ?? "New Section") },
        });
        return NextResponse.json({ ok: true });
      }

      case "renamePage": {
        await prisma.page.updateMany({
          where: { id: String(payload?.pageId ?? ""), userId: user.id },
          data: { title: String(payload?.title ?? "Untitled Page") },
        });
        return NextResponse.json({ ok: true });
      }

      case "toggleNotebook": {
        await prisma.notebook.updateMany({
          where: { id: String(payload?.notebookId ?? ""), userId: user.id },
          data: { isExpanded: Boolean(payload?.isExpanded) },
        });
        return NextResponse.json({ ok: true });
      }

      case "toggleSection": {
        await prisma.section.updateMany({
          where: { id: String(payload?.sectionId ?? ""), userId: user.id },
          data: { isExpanded: Boolean(payload?.isExpanded) },
        });
        return NextResponse.json({ ok: true });
      }

      case "deleteNotebook": {
        await prisma.notebook.deleteMany({
          where: { id: String(payload?.notebookId ?? ""), userId: user.id },
        });
        return NextResponse.json({ ok: true });
      }

      case "deleteSection": {
        await prisma.section.deleteMany({
          where: { id: String(payload?.sectionId ?? ""), userId: user.id },
        });
        return NextResponse.json({ ok: true });
      }

      case "deletePage": {
        await prisma.page.deleteMany({
          where: { id: String(payload?.pageId ?? ""), userId: user.id },
        });
        return NextResponse.json({ ok: true });
      }

      case "setActivePage": {
        await prisma.workspaceState.upsert({
          where: { userId_key: { userId: user.id, key: WORKSPACE_STATE_KEY } },
          create: {
            userId: user.id,
            key: WORKSPACE_STATE_KEY,
            activeNotebookId: String(payload?.notebookId ?? ""),
            activeSectionId: String(payload?.sectionId ?? ""),
            activePageId: String(payload?.pageId ?? ""),
          },
          update: {
            activeNotebookId: String(payload?.notebookId ?? ""),
            activeSectionId: String(payload?.sectionId ?? ""),
            activePageId: String(payload?.pageId ?? ""),
          },
        });
        return NextResponse.json({ ok: true });
      }

      case "updatePageContent": {
        await prisma.page.updateMany({
          where: { id: String(payload?.pageId ?? ""), userId: user.id },
          data: { content: String(payload?.content ?? "") },
        });
        return NextResponse.json({ ok: true });
      }

      case "updatePageTags": {
        const tags = Array.isArray(payload?.tags) ? payload?.tags.map(String) : [];
        await prisma.page.updateMany({
          where: { id: String(payload?.pageId ?? ""), userId: user.id },
          data: { tags },
        });
        return NextResponse.json({ ok: true });
      }

      case "saveFlashcards": {
        const cards = Array.isArray(payload?.cards)
          ? (payload?.cards as Array<{ question?: string; answer?: string }>)
          : [];
        const pageId = payload?.pageId ? String(payload.pageId) : null;
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        if (!cards.length) return NextResponse.json({ ok: true });

        await prisma.flashcard.createMany({
          data: cards
            .filter((card) => String(card.question ?? "").trim() && String(card.answer ?? "").trim())
            .map((card) => ({
              userId: user.id,
              pageId,
              question: String(card.question ?? ""),
              answer: String(card.answer ?? ""),
              intervalDays: 1,
              easeFactor: 2.5,
              repetitions: 0,
              dueDate,
            })),
        });
        return NextResponse.json({ ok: true });
      }

      case "logStudySession": {
        const rawType = String(payload?.type ?? "study").toUpperCase();
        const type = rawType === "BREAK" ? StudySessionType.BREAK : StudySessionType.STUDY;
        await prisma.studySession.create({
          data: {
            userId: user.id,
            type,
            durationSeconds: Number(payload?.durationSeconds ?? 0),
            pageId: payload?.pageId ? String(payload.pageId) : null,
            completedAt: new Date(),
          },
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Workspace API error", error);
    return NextResponse.json({ error: "Workspace action failed" }, { status: 500 });
  }
}
