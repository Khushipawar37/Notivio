"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth, db, FIRESTORE_COLLECTIONS } from "../lib/firebase";

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


function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in (value as Timestamp)) {
    return (value as Timestamp).toDate();
  }
  return new Date();
}

function generateId() {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function defaultUserId() {
  if (typeof window === "undefined") return "local-user";
  const existing = localStorage.getItem("workspace-user-id");
  if (existing) return existing;
  const newId = `local-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem("workspace-user-id", newId);
  return newId;
}

function isPermissionDenied(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message || "") : "";
  return code === "permission-denied" || message.toLowerCase().includes("insufficient permissions");
}

function readLocalWorkspace(): WorkspaceNotebook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("studyspace-notebooks");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkspaceNotebook[];
    return parsed.map((nb) => ({
      ...nb,
      createdAt: toDate(nb.createdAt),
      updatedAt: toDate(nb.updatedAt),
      sections: nb.sections.map((sec) => ({
        ...sec,
        createdAt: toDate(sec.createdAt),
        updatedAt: toDate(sec.updatedAt),
        pages: sec.pages.map((pg) => ({
          ...pg,
          createdAt: toDate(pg.createdAt),
          updatedAt: toDate(pg.updatedAt),
        })),
      })),
    }));
  } catch {
    return [];
  }
}

function writeLocalWorkspace(notebooks: WorkspaceNotebook[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("studyspace-notebooks", JSON.stringify(notebooks));
}

export function useWorkspace() {
  const [notebooks, setNotebooks] = useState<WorkspaceNotebook[]>(readLocalWorkspace);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState(defaultUserId());
  const [firestoreEnabled, setFirestoreEnabled] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string>(defaultUserId());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUserId(user?.uid ?? defaultUserId());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    writeLocalWorkspace(notebooks);
  }, [notebooks]);

  useEffect(() => {
    if (!firestoreEnabled) {
      setLoading(false);
      return;
    }

    const uid = userId;
    const notebookQuery = query(collection(db, FIRESTORE_COLLECTIONS.notebooks), where("userId", "==", uid));
    const sectionQuery = query(collection(db, FIRESTORE_COLLECTIONS.sections), where("userId", "==", uid));
    const pageQuery = query(collection(db, FIRESTORE_COLLECTIONS.pages), where("userId", "==", uid));

    let notebookDocs: Array<Record<string, unknown> & { id: string }> = [];
    let sectionDocs: Array<Record<string, unknown> & { id: string }> = [];
    let pageDocs: Array<Record<string, unknown> & { id: string }> = [];

    const fallback = (error: unknown) => {
      if (isPermissionDenied(error)) {
        setFirestoreEnabled(false);
      }
      setLoading(false);
    };

    const rebuild = () => {
      const sectionsByNotebook = new Map<string, WorkspaceSection[]>();
      const pagesBySection = new Map<string, WorkspacePage[]>();

      pageDocs.forEach((raw) => {
        const sectionId = String(raw.sectionId || "");
        if (!pagesBySection.has(sectionId)) pagesBySection.set(sectionId, []);
        pagesBySection.get(sectionId)?.push({
          id: raw.id,
          title: String(raw.title || "Untitled Page"),
          content: String(raw.content || "<h1>Untitled</h1><p>Start writing...</p>"),
          tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
          createdAt: toDate(raw.createdAt),
          updatedAt: toDate(raw.updatedAt),
        });
      });

      sectionDocs.forEach((raw) => {
        const notebookId = String(raw.notebookId || "");
        if (!sectionsByNotebook.has(notebookId)) sectionsByNotebook.set(notebookId, []);
        const pages = pagesBySection.get(raw.id) || [];
        pages.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        sectionsByNotebook.get(notebookId)?.push({
          id: raw.id,
          title: String(raw.title || "New Section"),
          isExpanded: Boolean(raw.isExpanded ?? true),
          createdAt: toDate(raw.createdAt),
          updatedAt: toDate(raw.updatedAt),
          pages,
        });
      });

      const nextNotebooks = notebookDocs.map((raw) => {
        const sections = sectionsByNotebook.get(raw.id) || [];
        sections.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return {
          id: raw.id,
          title: String(raw.title || "New Notebook"),
          emoji: String(raw.emoji || ""),
          isExpanded: Boolean(raw.isExpanded ?? true),
          createdAt: toDate(raw.createdAt),
          updatedAt: toDate(raw.updatedAt),
          sections,
        };
      });
      nextNotebooks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setNotebooks(nextNotebooks);
      setLoading(false);
    };

    const unsubN = onSnapshot(notebookQuery, (snapshot) => {
      notebookDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rebuild();
    }, fallback);
    const unsubS = onSnapshot(sectionQuery, (snapshot) => {
      sectionDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rebuild();
    }, fallback);
    const unsubP = onSnapshot(pageQuery, (snapshot) => {
      pageDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rebuild();
    }, fallback);

    return () => {
      unsubN();
      unsubS();
      unsubP();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [firestoreEnabled, userId]);

  const activePage = useMemo(
    () => notebooks.find((nb) => nb.id === activeNotebookId)?.sections.find((sec) => sec.id === activeSectionId)?.pages.find((pg) => pg.id === activePageId),
    [notebooks, activeNotebookId, activeSectionId, activePageId]
  );

  const filteredNotebooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notebooks;

    return notebooks.map((nb) => {
      const notebookMatch = nb.title.toLowerCase().includes(q);
      const sections = nb.sections
        .map((sec) => {
          const sectionMatch = sec.title.toLowerCase().includes(q);
          const pages = sec.pages.filter((pg) => {
            const plain = pg.content.replace(/<[^>]*>/g, " ");
            return `${pg.title} ${plain} ${pg.tags.join(" ")}`.toLowerCase().includes(q);
          });
          if (notebookMatch || sectionMatch) return sec;
          if (pages.length) return { ...sec, pages };
          return null;
        })
        .filter(Boolean) as WorkspaceSection[];

      if (notebookMatch || sections.length) return { ...nb, sections: notebookMatch ? nb.sections : sections };
      return null;
    }).filter(Boolean) as WorkspaceNotebook[];
  }, [notebooks, searchQuery]);

  const mutateLocal = useCallback((updater: (prev: WorkspaceNotebook[]) => WorkspaceNotebook[]) => {
    setNotebooks((prev) => updater(prev));
  }, []);

  const createNotebook = useCallback(async () => {
    const uid = userIdRef.current;
    const createLocalNotebook = () => {
      const notebookId = generateId();
      const sectionId = generateId();
      const pageId = generateId();
      const now = new Date();
      mutateLocal((prev) => [
        ...prev,
        {
          id: notebookId,
          title: "New Notebook",
          emoji: "",
          isExpanded: true,
          createdAt: now,
          updatedAt: now,
          sections: [
            {
              id: sectionId,
              title: "General",
              isExpanded: true,
              createdAt: now,
              updatedAt: now,
              pages: [
                {
                  id: pageId,
                  title: "Untitled Page",
                  content: "<h1>Untitled</h1><p>Start writing...</p>",
                  tags: [],
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            },
          ],
        },
      ]);
      setActiveNotebookId(notebookId);
      setActiveSectionId(sectionId);
      setActivePageId(pageId);
    };

    if (!firestoreEnabled) {
      createLocalNotebook();
      return;
    }
    try {
      const notebookRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.notebooks), {
        userId: uid,
        title: "New Notebook",
        emoji: "",
        isExpanded: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const sectionRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.sections), {
        userId: uid,
        notebookId: notebookRef.id,
        title: "General",
        isExpanded: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const pageRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.pages), {
        userId: uid,
        notebookId: notebookRef.id,
        sectionId: sectionRef.id,
        title: "Untitled Page",
        content: "<h1>Untitled</h1><p>Start writing...</p>",
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveNotebookId(notebookRef.id);
      setActiveSectionId(sectionRef.id);
      setActivePageId(pageRef.id);
    } catch (error) {
      if (isPermissionDenied(error)) {
        setFirestoreEnabled(false);
        createLocalNotebook();
        return;
      }
      throw error;
    }
  }, [firestoreEnabled, mutateLocal]);

  const createSection = useCallback(async (notebookId: string) => {
    const uid = userIdRef.current;
    if (!firestoreEnabled) {
      const now = new Date();
      mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? { ...nb, isExpanded: true, sections: [...nb.sections, { id: generateId(), title: "New Section", isExpanded: true, createdAt: now, updatedAt: now, pages: [] }] } : nb));
      return;
    }
    try {
      await addDoc(collection(db, FIRESTORE_COLLECTIONS.sections), {
        userId: uid,
        notebookId,
        title: "New Section",
        isExpanded: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.notebooks, notebookId), { isExpanded: true, updatedAt: serverTimestamp() });
    } catch (error) {
      if (isPermissionDenied(error)) {
        setFirestoreEnabled(false);
        const now = new Date();
        mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? { ...nb, isExpanded: true, sections: [...nb.sections, { id: generateId(), title: "New Section", isExpanded: true, createdAt: now, updatedAt: now, pages: [] }] } : nb));
        return;
      }
      throw error;
    }
  }, [firestoreEnabled, mutateLocal]);

  const createPage = useCallback(async (notebookId: string, sectionId: string) => {
    const uid = userIdRef.current;
    if (!firestoreEnabled) {
      const pageId = generateId();
      const now = new Date();
      mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? {
        ...nb,
        sections: nb.sections.map((sec) => sec.id === sectionId ? {
          ...sec,
          isExpanded: true,
          pages: [...sec.pages, { id: pageId, title: "Untitled Page", content: "<h1>Untitled</h1><p>Start writing...</p>", tags: [], createdAt: now, updatedAt: now }],
        } : sec),
      } : nb));
      setActiveNotebookId(notebookId);
      setActiveSectionId(sectionId);
      setActivePageId(pageId);
      return;
    }
    try {
      const pageRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.pages), {
        userId: uid,
        notebookId,
        sectionId,
        title: "Untitled Page",
        content: "<h1>Untitled</h1><p>Start writing...</p>",
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveNotebookId(notebookId);
      setActiveSectionId(sectionId);
      setActivePageId(pageRef.id);
    } catch (error) {
      if (isPermissionDenied(error)) {
        setFirestoreEnabled(false);
        const pageId = generateId();
        const now = new Date();
        mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? {
          ...nb,
          sections: nb.sections.map((sec) => sec.id === sectionId ? {
            ...sec,
            isExpanded: true,
            pages: [...sec.pages, { id: pageId, title: "Untitled Page", content: "<h1>Untitled</h1><p>Start writing...</p>", tags: [], createdAt: now, updatedAt: now }],
          } : sec),
        } : nb));
        setActiveNotebookId(notebookId);
        setActiveSectionId(sectionId);
        setActivePageId(pageId);
        return;
      }
      throw error;
    }
  }, [firestoreEnabled, mutateLocal]);

  const createPageInNotebook = useCallback(async (notebookId: string) => {
    const notebook = notebooks.find((nb) => nb.id === notebookId);
    if (!notebook) return;
    const firstSection = notebook.sections[0];
    if (firstSection) {
      await createPage(notebookId, firstSection.id);
      return;
    }

    const uid = userIdRef.current;
    if (!firestoreEnabled) {
      const now = new Date();
      const sectionId = generateId();
      const pageId = generateId();
      mutateLocal((prev) =>
        prev.map((nb) =>
          nb.id === notebookId
            ? {
                ...nb,
                isExpanded: true,
                sections: [
                  ...nb.sections,
                  {
                    id: sectionId,
                    title: "General",
                    isExpanded: true,
                    createdAt: now,
                    updatedAt: now,
                    pages: [
                      {
                        id: pageId,
                        title: "Untitled Page",
                        content: "<h1>Untitled</h1><p>Start writing...</p>",
                        tags: [],
                        createdAt: now,
                        updatedAt: now,
                      },
                    ],
                  },
                ],
              }
            : nb
        )
      );
      setActiveNotebookId(notebookId);
      setActiveSectionId(sectionId);
      setActivePageId(pageId);
      return;
    }

    const sectionRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.sections), {
      userId: uid,
      notebookId,
      title: "General",
      isExpanded: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const pageRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.pages), {
      userId: uid,
      notebookId,
      sectionId: sectionRef.id,
      title: "Untitled Page",
      content: "<h1>Untitled</h1><p>Start writing...</p>",
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setActiveNotebookId(notebookId);
    setActiveSectionId(sectionRef.id);
    setActivePageId(pageRef.id);
  }, [createPage, firestoreEnabled, mutateLocal, notebooks]);

  const renameNotebook = useCallback(async (notebookId: string, title: string) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? { ...nb, title } : nb));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.notebooks, notebookId), { title, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, mutateLocal]);

  const renameSection = useCallback(async (sectionId: string, title: string) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => sec.id === sectionId ? { ...sec, title } : sec) })));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.sections, sectionId), { title, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, mutateLocal]);

  const renamePage = useCallback(async (pageId: string, title: string) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => ({ ...sec, pages: sec.pages.map((pg) => pg.id === pageId ? { ...pg, title } : pg) })) })));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.pages, pageId), { title, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, mutateLocal]);

  const deleteNotebook = useCallback(async (notebookId: string, sectionIds: string[], pageIds: string[]) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.filter((nb) => nb.id !== notebookId));
      if (activeNotebookId === notebookId) {
        setActiveNotebookId(null);
        setActiveSectionId(null);
        setActivePageId(null);
      }
      return;
    }
    await Promise.all([
      ...sectionIds.map((id) => deleteDoc(doc(db, FIRESTORE_COLLECTIONS.sections, id))),
      ...pageIds.map((id) => deleteDoc(doc(db, FIRESTORE_COLLECTIONS.pages, id))),
      deleteDoc(doc(db, FIRESTORE_COLLECTIONS.notebooks, notebookId)),
    ]);
  }, [activeNotebookId, firestoreEnabled, mutateLocal]);

  const deleteSection = useCallback(async (sectionId: string, pageIds: string[]) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.filter((sec) => sec.id !== sectionId) })));
      if (activeSectionId === sectionId) {
        setActiveSectionId(null);
        setActivePageId(null);
      }
      return;
    }
    await Promise.all([
      ...pageIds.map((id) => deleteDoc(doc(db, FIRESTORE_COLLECTIONS.pages, id))),
      deleteDoc(doc(db, FIRESTORE_COLLECTIONS.sections, sectionId)),
    ]);
  }, [activeSectionId, firestoreEnabled, mutateLocal]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => ({ ...sec, pages: sec.pages.filter((pg) => pg.id !== pageId) })) })));
      if (activePageId === pageId) setActivePageId(null);
      return;
    }
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.pages, pageId));
  }, [activePageId, firestoreEnabled, mutateLocal]);

  const toggleNotebook = useCallback(async (notebookId: string) => {
    const notebook = notebooks.find((n) => n.id === notebookId);
    if (!notebook) return;
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => nb.id === notebookId ? { ...nb, isExpanded: !notebook.isExpanded } : nb));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.notebooks, notebookId), { isExpanded: !notebook.isExpanded, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, notebooks, mutateLocal]);

  const toggleSection = useCallback(async (sectionId: string) => {
    const section = notebooks.flatMap((n) => n.sections).find((s) => s.id === sectionId);
    if (!section) return;
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => sec.id === sectionId ? { ...sec, isExpanded: !section.isExpanded } : sec) })));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.sections, sectionId), { isExpanded: !section.isExpanded, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, notebooks, mutateLocal]);

  const setActivePage = useCallback((notebookId: string, sectionId: string, pageId: string) => {
    setActiveNotebookId(notebookId);
    setActiveSectionId(sectionId);
    setActivePageId(pageId);
  }, []);

  const updatePageContent = useCallback((pageId: string, content: string) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!firestoreEnabled) {
          mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => ({ ...sec, pages: sec.pages.map((pg) => pg.id === pageId ? { ...pg, content, updatedAt: new Date() } : pg) })) })));
        } else {
          await updateDoc(doc(db, FIRESTORE_COLLECTIONS.pages, pageId), { content, updatedAt: serverTimestamp() });
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 2000);
  }, [firestoreEnabled, mutateLocal]);

  const updatePageTags = useCallback(async (pageId: string, tags: string[]) => {
    if (!firestoreEnabled) {
      mutateLocal((prev) => prev.map((nb) => ({ ...nb, sections: nb.sections.map((sec) => ({ ...sec, pages: sec.pages.map((pg) => pg.id === pageId ? { ...pg, tags } : pg) })) })));
      return;
    }
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.pages, pageId), { tags, updatedAt: serverTimestamp() });
  }, [firestoreEnabled, mutateLocal]);

  const saveFlashcards = useCallback(async (flashcards: FlashcardInput[], pageId?: string) => {
    const uid = userIdRef.current;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (!firestoreEnabled) {
      const existing = JSON.parse(localStorage.getItem("studyspace-flashcards") || "[]") as unknown[];
      const next = flashcards.map((card) => ({ id: generateId(), userId: uid, pageId: pageId ?? null, question: card.question, answer: card.answer, intervalDays: 1, easeFactor: 2.5, repetitions: 0, dueDate, createdAt: now, updatedAt: now }));
      localStorage.setItem("studyspace-flashcards", JSON.stringify([...existing, ...next]));
      return;
    }

    await Promise.all(flashcards.map((card) => addDoc(collection(db, FIRESTORE_COLLECTIONS.flashcards), {
      userId: uid,
      pageId: pageId ?? null,
      question: card.question,
      answer: card.answer,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })));
  }, [firestoreEnabled]);

  const logStudySession = useCallback(async (type: "study" | "break", durationSeconds: number, pageId?: string) => {
    const uid = userIdRef.current;

    if (!firestoreEnabled) {
      const existing = JSON.parse(localStorage.getItem("studyspace-sessions") || "[]") as unknown[];
      localStorage.setItem("studyspace-sessions", JSON.stringify([
        ...existing,
        { id: generateId(), userId: uid, type, durationSeconds, pageId: pageId ?? null, completedAt: new Date() },
      ]));
      return;
    }

    await addDoc(collection(db, FIRESTORE_COLLECTIONS.studySessions), {
      userId: uid,
      type,
      durationSeconds,
      pageId: pageId ?? null,
      completedAt: serverTimestamp(),
    });
  }, [firestoreEnabled]);

  const wordCount = useMemo(() => {
    if (!activePage) return 0;
    return (activePage.content.replace(/<[^>]*>/g, " ").match(/\S+/g) || []).length;
  }, [activePage]);

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
    firestoreEnabled,
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
