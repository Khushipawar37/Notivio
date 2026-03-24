"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface WorkspacePage {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSection {
  id: string;
  title: string;
  pages: WorkspacePage[];
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceNotebook {
  id: string;
  title: string;
  emoji: string;
  sections: WorkspaceSection[];
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardInput {
  question: string;
  answer: string;
}

interface WorkspaceBootstrapResponse {
  notebooks: Array<{
    id: string;
    title: string;
    emoji: string;
    isExpanded: boolean;
    createdAt: string;
    updatedAt: string;
    sections: Array<{
      id: string;
      title: string;
      isExpanded: boolean;
      createdAt: string;
      updatedAt: string;
      pages: Array<{
        id: string;
        title: string;
        content: string;
        tags: string[];
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
  }>;
  state: {
    activeNotebookId: string | null;
    activeSectionId: string | null;
    activePageId: string | null;
  };
}

type SaveStatus = "saved" | "saving" | "unsaved";

function toWorkspaceNotebooks(
  notebooks: WorkspaceBootstrapResponse["notebooks"]
): WorkspaceNotebook[] {
  return notebooks.map((notebook) => ({
    id: notebook.id,
    title: notebook.title,
    emoji: notebook.emoji,
    isExpanded: notebook.isExpanded,
    createdAt: new Date(notebook.createdAt),
    updatedAt: new Date(notebook.updatedAt),
    sections: notebook.sections.map((section) => ({
      id: section.id,
      title: section.title,
      isExpanded: section.isExpanded,
      createdAt: new Date(section.createdAt),
      updatedAt: new Date(section.updatedAt),
      pages: section.pages.map((page) => ({
        id: page.id,
        title: page.title,
        content: page.content,
        tags: page.tags,
        createdAt: new Date(page.createdAt),
        updatedAt: new Date(page.updatedAt),
      })),
    })),
  }));
}

async function postWorkspaceAction(action: string, payload?: Record<string, unknown>) {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    throw new Error(`Workspace action failed: ${action}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export function useWorkspace() {
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (!response.ok) {
        setNotebooks([]);
        return;
      }

      const data = (await response.json()) as WorkspaceBootstrapResponse;
      const converted = toWorkspaceNotebooks(data.notebooks);
      setNotebooks(converted);

      const state = data.state;
      if (state.activeNotebookId && state.activeSectionId && state.activePageId) {
        setActiveNotebookId(state.activeNotebookId);
        setActiveSectionId(state.activeSectionId);
        setActivePageId(state.activePageId);
      } else {
        const firstNotebook = converted[0];
        const firstSection = firstNotebook?.sections[0];
        const firstPage = firstSection?.pages[0];
        setActiveNotebookId(firstNotebook?.id ?? null);
        setActiveSectionId(firstSection?.id ?? null);
        setActivePageId(firstPage?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const activePage = useMemo(
    () =>
      notebooks
        .find((nb) => nb.id === activeNotebookId)
        ?.sections.find((sec) => sec.id === activeSectionId)
        ?.pages.find((pg) => pg.id === activePageId),
    [notebooks, activeNotebookId, activeSectionId, activePageId]
  );

  const filteredNotebooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notebooks;

    return notebooks
      .map((notebook) => {
        const notebookMatch = notebook.title.toLowerCase().includes(q);
        const sections = notebook.sections
          .map((section) => {
            const sectionMatch = section.title.toLowerCase().includes(q);
            const pages = section.pages.filter((page) => {
              const plainContent = page.content.replace(/<[^>]*>/g, " ");
              return `${page.title} ${plainContent} ${page.tags.join(" ")}`
                .toLowerCase()
                .includes(q);
            });

            if (notebookMatch || sectionMatch) return section;
            if (pages.length) return { ...section, pages };
            return null;
          })
          .filter(Boolean) as WorkspaceSection[];

        if (notebookMatch || sections.length) {
          return { ...notebook, sections: notebookMatch ? notebook.sections : sections };
        }

        return null;
      })
      .filter(Boolean) as WorkspaceNotebook[];
  }, [notebooks, searchQuery]);

  const mutateLocal = useCallback(
    (updater: (previous: WorkspaceNotebook[]) => WorkspaceNotebook[]) => {
      setNotebooks((previous) => updater(previous));
    },
    []
  );

  const createNotebook = useCallback(async () => {
    await postWorkspaceAction("createNotebook");
    await refreshWorkspace();
  }, [refreshWorkspace]);

  const createSection = useCallback(
    async (notebookId: string) => {
      await postWorkspaceAction("createSection", { notebookId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const createPage = useCallback(
    async (notebookId: string, sectionId: string) => {
      await postWorkspaceAction("createPage", { notebookId, sectionId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const createPageInNotebook = useCallback(
    async (notebookId: string) => {
      await postWorkspaceAction("createPageInNotebook", { notebookId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const renameNotebook = useCallback(
    async (notebookId: string, title: string) => {
      mutateLocal((previous) =>
        previous.map((notebook) =>
          notebook.id === notebookId ? { ...notebook, title } : notebook
        )
      );
      await postWorkspaceAction("renameNotebook", { notebookId, title });
    },
    [mutateLocal]
  );

  const renameSection = useCallback(
    async (sectionId: string, title: string) => {
      mutateLocal((previous) =>
        previous.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((section) =>
            section.id === sectionId ? { ...section, title } : section
          ),
        }))
      );
      await postWorkspaceAction("renameSection", { sectionId, title });
    },
    [mutateLocal]
  );

  const renamePage = useCallback(
    async (pageId: string, title: string) => {
      mutateLocal((previous) =>
        previous.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((section) => ({
            ...section,
            pages: section.pages.map((page) =>
              page.id === pageId ? { ...page, title } : page
            ),
          })),
        }))
      );
      await postWorkspaceAction("renamePage", { pageId, title });
    },
    [mutateLocal]
  );

  const deleteNotebook = useCallback(
    async (notebookId: string) => {
      await postWorkspaceAction("deleteNotebook", { notebookId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      await postWorkspaceAction("deleteSection", { sectionId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      await postWorkspaceAction("deletePage", { pageId });
      await refreshWorkspace();
    },
    [refreshWorkspace]
  );

  const toggleNotebook = useCallback(
    async (notebookId: string) => {
      const notebook = notebooks.find((item) => item.id === notebookId);
      if (!notebook) return;
      const isExpanded = !notebook.isExpanded;
      mutateLocal((previous) =>
        previous.map((item) =>
          item.id === notebookId ? { ...item, isExpanded } : item
        )
      );
      await postWorkspaceAction("toggleNotebook", { notebookId, isExpanded });
    },
    [mutateLocal, notebooks]
  );

  const toggleSection = useCallback(
    async (sectionId: string) => {
      const section = notebooks
        .flatMap((notebook) => notebook.sections)
        .find((item) => item.id === sectionId);
      if (!section) return;
      const isExpanded = !section.isExpanded;
      mutateLocal((previous) =>
        previous.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((item) =>
            item.id === sectionId ? { ...item, isExpanded } : item
          ),
        }))
      );
      await postWorkspaceAction("toggleSection", { sectionId, isExpanded });
    },
    [mutateLocal, notebooks]
  );

  const setActivePage = useCallback((notebookId: string, sectionId: string, pageId: string) => {
    setActiveNotebookId(notebookId);
    setActiveSectionId(sectionId);
    setActivePageId(pageId);
    void postWorkspaceAction("setActivePage", { notebookId, sectionId, pageId });
  }, []);

  const updatePageContent = useCallback(
    (pageId: string, content: string) => {
      mutateLocal((previous) =>
        previous.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((section) => ({
            ...section,
            pages: section.pages.map((page) =>
              page.id === pageId ? { ...page, content, updatedAt: new Date() } : page
            ),
          })),
        }))
      );

      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await postWorkspaceAction("updatePageContent", { pageId, content });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("unsaved");
        }
      }, 1200);
    },
    [mutateLocal]
  );

  const updatePageTags = useCallback(
    async (pageId: string, tags: string[]) => {
      mutateLocal((previous) =>
        previous.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((section) => ({
            ...section,
            pages: section.pages.map((page) => (page.id === pageId ? { ...page, tags } : page)),
          })),
        }))
      );
      await postWorkspaceAction("updatePageTags", { pageId, tags });
    },
    [mutateLocal]
  );

  const saveFlashcards = useCallback(
    async (flashcards: FlashcardInput[], pageId?: string) => {
      await postWorkspaceAction("saveFlashcards", { cards: flashcards, pageId: pageId ?? null });
    },
    []
  );

  const logStudySession = useCallback(
    async (type: "study" | "break", durationSeconds: number, pageId?: string) => {
      await postWorkspaceAction("logStudySession", {
        type,
        durationSeconds,
        pageId: pageId ?? null,
      });
    },
    []
  );

  const wordCount = useMemo(() => {
    if (!activePage) return 0;
    return (activePage.content.replace(/<[^>]*>/g, " ").match(/\S+/g) || []).length;
  }, [activePage]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    notebooks,
    filteredNotebooks,
    searchQuery,
    setSearchQuery,
    loading,
    saveStatus,
    activeNotebookId,
    activeSectionId,
    activePageId,
    activePage,
    wordCount,
    firestoreEnabled: false,
    createNotebook,
    createSection,
    createPage,
    createPageInNotebook,
    renameNotebook,
    renameSection,
    renamePage,
    deleteNotebook,
    deleteSection,
    deletePage,
    toggleNotebook,
    toggleSection,
    setActivePage,
    updatePageContent,
    updatePageTags,
    saveFlashcards,
    logStudySession,
  };
}
