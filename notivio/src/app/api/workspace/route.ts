import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getCurrentUserProfile } from "@/server/auth";
import { StudySessionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const WORKSPACE_STATE_KEY = "default";

type WorkspaceStateShape = {
  activeNotebookId: string | null;
  activeSectionId: string | null;
  activePageId: string | null;
};

type ShareAccess = {
  mode: "share";
  token: string;
  role: "viewer" | "editor";
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    notebookId: string;
    sectionId: string;
    notebookTitle: string;
    sectionTitle: string;
  };
};

type UserAccess = {
  mode: "user";
  userId: string;
};

type AccessContext = ShareAccess | UserAccess;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function mapBootstrap(
  notebooks: Awaited<ReturnType<typeof loadNotebooks>>,
  state: WorkspaceStateShape | null
) {
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

function mapShareBootstrap(access: ShareAccess) {
  const note = access.note;
  return {
    notebooks: [
      {
        id: note.notebookId,
        title: `${note.notebookTitle} (Shared)`,
        emoji: "",
        isExpanded: true,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        sections: [
          {
            id: note.sectionId,
            title: note.sectionTitle,
            isExpanded: true,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pages: [
              {
                id: note.id,
                title: note.title,
                content: note.content,
                tags: note.tags,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
              },
            ],
          },
        ],
      },
    ],
    state: {
      activeNotebookId: note.notebookId,
      activeSectionId: note.sectionId,
      activePageId: note.id,
    },
  };
}

async function resolveAccess(request: Request): Promise<AccessContext | null> {
  const user = await getCurrentUserProfile();
  if (user) {
    return { mode: "user", userId: user.id };
  }

  const token = request.headers.get("x-share-token");
  if (!token) return null;

  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: {
      note: {
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          notebookId: true,
          sectionId: true,
          notebook: {
            select: { title: true },
          },
          section: {
            select: { title: true },
          },
        },
      },
    },
  });

  if (!link || link.revokedAt) return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

  return {
    mode: "share",
    token,
    role: link.role === "editor" ? "editor" : "viewer",
    note: {
      id: link.note.id,
      title: link.note.title,
      content: link.note.content,
      tags: link.note.tags,
      createdAt: link.note.createdAt,
      updatedAt: link.note.updatedAt,
      notebookId: link.note.notebookId,
      sectionId: link.note.sectionId,
      notebookTitle: link.note.notebook.title,
      sectionTitle: link.note.section.title,
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

export async function GET(request: Request) {
  const access = await resolveAccess(request);
  if (!access) return unauthorized();

  if (access.mode === "share") {
    return NextResponse.json(mapShareBootstrap(access));
  }

  const [notebooks, state] = await Promise.all([
    loadNotebooks(access.userId),
    prisma.workspaceState.findUnique({
      where: {
        userId_key: { userId: access.userId, key: WORKSPACE_STATE_KEY },
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
  const access = await resolveAccess(request);
  if (!access) return unauthorized();

  const { action, payload } = (await request.json()) as {
    action: string;
    payload?: Record<string, unknown>;
  };

  try {
    if (access.mode === "share") {
      const pageId = String(payload?.pageId ?? payload?.activePageId ?? "");
      if (pageId && pageId !== access.note.id) return forbidden();

      if (action === "setActivePage") {
        return NextResponse.json({ ok: true });
      }

      if (access.role !== "editor") {
        return forbidden();
      }

      switch (action) {
        case "updatePageContent": {
          await prisma.page.update({
            where: { id: access.note.id },
            data: { content: String(payload?.content ?? "") },
          });
          return NextResponse.json({ ok: true });
        }
        case "renamePage": {
          await prisma.page.update({
            where: { id: access.note.id },
            data: { title: String(payload?.title ?? "Untitled Page") },
          });
          return NextResponse.json({ ok: true });
        }
        case "updatePageTags": {
          const tags = Array.isArray(payload?.tags) ? payload.tags.map(String) : [];
          await prisma.page.update({
            where: { id: access.note.id },
            data: { tags },
          });
          return NextResponse.json({ ok: true });
        }
        default:
          return forbidden();
      }
    }

    const userId = access.userId;

    switch (action) {
      case "createNotebook": {
        const created = await prisma.$transaction(async (tx) => {
          const notebookSortOrder = await getNotebookMaxSortOrder(userId);
          const notebook = await tx.notebook.create({
            data: {
              userId,
              title: "New Notebook",
              emoji: "",
              isExpanded: true,
              sortOrder: notebookSortOrder,
            },
          });

          const section = await tx.section.create({
            data: {
              userId,
              notebookId: notebook.id,
              title: "General",
              isExpanded: true,
              sortOrder: 0,
            },
          });

          const page = await tx.page.create({
            data: {
              userId,
              notebookId: notebook.id,
              sectionId: section.id,
              title: "Untitled Page",
              content: "<h1>Untitled</h1><p>Start writing...</p>",
              tags: [],
              sortOrder: 0,
            },
          });

          await tx.workspaceState.upsert({
            where: { userId_key: { userId, key: WORKSPACE_STATE_KEY } },
            create: {
              userId,
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

        const sectionSortOrder = await getSectionMaxSortOrder(userId, notebookId);
        const section = await prisma.section.create({
          data: {
            userId,
            notebookId,
            title: "New Section",
            isExpanded: true,
            sortOrder: sectionSortOrder,
          },
        });
        await prisma.notebook.updateMany({
          where: { id: notebookId, userId },
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

        const pageSortOrder = await getPageMaxSortOrder(userId, sectionId);
        const page = await prisma.page.create({
          data: {
            userId,
            notebookId,
            sectionId,
            title: "Untitled Page",
            content: "<h1>Untitled</h1><p>Start writing...</p>",
            tags: [],
            sortOrder: pageSortOrder,
          },
        });

        await prisma.section.updateMany({
          where: { id: sectionId, userId },
          data: { isExpanded: true },
        });

        await prisma.workspaceState.upsert({
          where: { userId_key: { userId, key: WORKSPACE_STATE_KEY } },
          create: {
            userId,
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
          where: { userId, notebookId },
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        });

        let sectionId = firstSection?.id ?? null;
        if (!sectionId) {
          const section = await prisma.section.create({
            data: {
              userId,
              notebookId,
              title: "General",
              isExpanded: true,
              sortOrder: 0,
            },
          });
          sectionId = section.id;
        }

        const pageSortOrder = await getPageMaxSortOrder(userId, sectionId);
        const page = await prisma.page.create({
          data: {
            userId,
            notebookId,
            sectionId,
            title: "Untitled Page",
            content: "<h1>Untitled</h1><p>Start writing...</p>",
            tags: [],
            sortOrder: pageSortOrder,
          },
        });

        await prisma.workspaceState.upsert({
          where: { userId_key: { userId, key: WORKSPACE_STATE_KEY } },
          create: {
            userId,
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
          where: { id: String(payload?.notebookId ?? ""), userId },
          data: { title: String(payload?.title ?? "New Notebook") },
        });
        return NextResponse.json({ ok: true });
      }

      case "renameSection": {
        await prisma.section.updateMany({
          where: { id: String(payload?.sectionId ?? ""), userId },
          data: { title: String(payload?.title ?? "New Section") },
        });
        return NextResponse.json({ ok: true });
      }

      case "renamePage": {
        await prisma.page.updateMany({
          where: { id: String(payload?.pageId ?? ""), userId },
          data: { title: String(payload?.title ?? "Untitled Page") },
        });
        return NextResponse.json({ ok: true });
      }

      case "toggleNotebook": {
        await prisma.notebook.updateMany({
          where: { id: String(payload?.notebookId ?? ""), userId },
          data: { isExpanded: Boolean(payload?.isExpanded) },
        });
        return NextResponse.json({ ok: true });
      }

      case "toggleSection": {
        await prisma.section.updateMany({
          where: { id: String(payload?.sectionId ?? ""), userId },
          data: { isExpanded: Boolean(payload?.isExpanded) },
        });
        return NextResponse.json({ ok: true });
      }

      case "deleteNotebook": {
        await prisma.notebook.deleteMany({
          where: { id: String(payload?.notebookId ?? ""), userId },
        });
        return NextResponse.json({ ok: true });
      }

      case "deleteSection": {
        await prisma.section.deleteMany({
          where: { id: String(payload?.sectionId ?? ""), userId },
        });
        return NextResponse.json({ ok: true });
      }

      case "deletePage": {
        await prisma.page.deleteMany({
          where: { id: String(payload?.pageId ?? ""), userId },
        });
        return NextResponse.json({ ok: true });
      }

      case "setActivePage": {
        await prisma.workspaceState.upsert({
          where: { userId_key: { userId, key: WORKSPACE_STATE_KEY } },
          create: {
            userId,
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
          where: { id: String(payload?.pageId ?? ""), userId },
          data: { content: String(payload?.content ?? "") },
        });
        return NextResponse.json({ ok: true });
      }

      case "updatePageTags": {
        const tags = Array.isArray(payload?.tags) ? payload.tags.map(String) : [];
        await prisma.page.updateMany({
          where: { id: String(payload?.pageId ?? ""), userId },
          data: { tags },
        });
        return NextResponse.json({ ok: true });
      }

      case "saveFlashcards": {
        const cards = Array.isArray(payload?.cards)
          ? (payload.cards as Array<{ question?: string; answer?: string }>)
          : [];
        const pageId = payload?.pageId ? String(payload.pageId) : null;
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        if (!cards.length) return NextResponse.json({ ok: true });

        await prisma.flashcard.createMany({
          data: cards
            .filter((card) => String(card.question ?? "").trim() && String(card.answer ?? "").trim())
            .map((card) => ({
              userId,
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
            userId,
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
