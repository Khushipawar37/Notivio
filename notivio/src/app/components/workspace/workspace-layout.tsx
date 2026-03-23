"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FileText,
  LayoutTemplate,
  PanelRightClose,
  PanelRightOpen,
  Save,
} from "lucide-react";
import { NotebookSidebar } from "./notebook-sidebar";
import { TipTapEditor } from "./tiptap-editor";
import { AIFeaturesPanel } from "./ai-features-panel";
import { AIChatWidget } from "./ai-chat-widget";
import { SourcesPanel, type StudySource } from "./sources-panel";
import { MainSourceWorkspace } from "./main-source-workspace";
import { NoteTemplates } from "./note-templates";
import { exportToMarkdown, exportToPDF } from "../../lib/export-utils";
import { useWorkspace } from "../../hooks/use-workspace";

export function WorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState<"ai" | "sources">("ai");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [activeSource, setActiveSource] = useState<StudySource | null>(null);
  const [workspaceView, setWorkspaceView] = useState<"notes" | "source">("notes");
  const editorApiRef = useRef<{
    insertTextAtCursor: (text: string) => void;
    insertHTMLAtCursor: (html: string) => void;
  } | null>(null);

  const {
    filteredNotebooks,
    notebooks,
    searchQuery,
    setSearchQuery,
    activePageId,
    activePage,
    wordCount,
    saveStatus,
    loading,
    firestoreEnabled,
    createNotebook,
    createSection,
    createPage,
    createPageInNotebook,
    deleteNotebook,
    deleteSection,
    deletePage,
    renameNotebook,
    renameSection,
    renamePage,
    toggleNotebook,
    toggleSection,
    setActivePage,
    updatePageContent,
    updatePageTags,
    saveFlashcards,
  } = useWorkspace();

  const pageTagsValue = useMemo(
    () => (activePage?.tags?.length ? activePage.tags.join(", ") : ""),
    [activePage?.tags]
  );

  const handleTemplateSelect = useCallback(
    (content: string) => {
      if (!activePage) return;
      updatePageContent(activePage.id, content);
    },
    [activePage, updatePageContent]
  );

  const handleDeleteNotebook = useCallback(
    (notebookId: string) => {
      const notebook = notebooks.find((nb) => nb.id === notebookId);
      if (!notebook) return;
      const sectionIds = notebook.sections.map((section) => section.id);
      const pageIds = notebook.sections.flatMap((section) =>
        section.pages.map((page) => page.id)
      );
      void deleteNotebook(notebookId, sectionIds, pageIds);
    },
    [deleteNotebook, notebooks]
  );

  const handleDeleteSection = useCallback(
    (notebookId: string, sectionId: string) => {
      const notebook = notebooks.find((nb) => nb.id === notebookId);
      const section = notebook?.sections.find((sec) => sec.id === sectionId);
      if (!section) return;
      void deleteSection(
        sectionId,
        section.pages.map((page) => page.id)
      );
    },
    [deleteSection, notebooks]
  );

  const handleExport = useCallback(
    (format: "pdf" | "markdown") => {
      if (!activePage) return;
      if (format === "pdf") {
        exportToPDF(activePage.content, activePage.title);
      } else {
        exportToMarkdown(activePage.content, activePage.title);
      }
      setShowExportMenu(false);
    },
    [activePage]
  );

  const saveLabel =
    saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved";

  useEffect(() => {
    setActiveSource(null);
    setWorkspaceView("notes");
  }, [activePageId]);

  const escapeHtml = useCallback((value: string) => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }, []);

  const insertTextToNotes = useCallback(
    (text: string) => {
      if (!text?.trim() || !activePage) return;
      if (workspaceView === "notes" && editorApiRef.current) {
        editorApiRef.current.insertTextAtCursor(text);
        return;
      }
      const block = `<p>${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`;
      updatePageContent(activePage.id, `${activePage.content}${block}`);
    },
    [activePage, escapeHtml, updatePageContent, workspaceView]
  );

  const insertHtmlToNotes = useCallback(
    (html: string) => {
      if (!html?.trim() || !activePage) return;
      if (workspaceView === "notes" && editorApiRef.current) {
        editorApiRef.current.insertHTMLAtCursor(html);
        return;
      }
      updatePageContent(activePage.id, `${activePage.content}${html}`);
    },
    [activePage, updatePageContent, workspaceView]
  );

  return (
    <div className="min-h-screen lg:h-screen flex bg-[#f5f0e8] text-[#6f5b43] overflow-hidden">
      <NotebookSidebar
        notebooks={filteredNotebooks}
        activePageId={activePageId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPageSelect={setActivePage}
        onCreateNotebook={() => void createNotebook()}
        onCreateSection={(notebookId) => void createSection(notebookId)}
        onCreatePage={(notebookId, sectionId) => void createPage(notebookId, sectionId)}
        onCreatePageInNotebook={(notebookId) => void createPageInNotebook(notebookId)}
        onDeleteNotebook={handleDeleteNotebook}
        onDeleteSection={handleDeleteSection}
        onDeletePage={(_notebookId, _sectionId, pageId) => void deletePage(pageId)}
        onRenameNotebook={(notebookId, title) =>
          void renameNotebook(notebookId, title)
        }
        onRenameSection={(_notebookId, sectionId, title) =>
          void renameSection(sectionId, title)
        }
        onRenamePage={(_notebookId, _sectionId, pageId, title) =>
          void renamePage(pageId, title)
        }
        onToggleNotebook={(notebookId) => void toggleNotebook(notebookId)}
        onToggleSection={(_notebookId, sectionId) => void toggleSection(sectionId)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main className="flex-1 min-w-0 flex flex-col bg-[#fffaf3]">
        {!firestoreEnabled && (
          <div className="px-4 py-2 border-b border-[#e4d7c8] bg-[#fdf2de] text-[#7a6143] text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Firestore permissions are unavailable, so this workspace is running in local mode.
          </div>
        )}

        {activePage ? (
          <>
            <header className="px-4 py-2 border-b border-[#e4d7c8] bg-[#f8f1e7]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#7c6a53]/80">
                  <Save className="w-3.5 h-3.5 text-[#8a7559]" />
                  <span>{saveLabel}</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#7c6a53] hover:text-[#5d4a34] hover:bg-[#ede1d1] rounded-lg transition-colors"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    Templates
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu((prev) => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#7c6a53] hover:text-[#5d4a34] hover:bg-[#ede1d1] rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-[#fff8ee] border border-[#e4d7c8] rounded-lg shadow-xl p-1 min-w-[150px]">
                        <button
                          onClick={() => handleExport("pdf")}
                          className="w-full text-left px-3 py-1.5 text-sm text-[#6f5b43] hover:bg-[#f2e6d8] rounded flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF
                        </button>
                        <button
                          onClick={() => handleExport("markdown")}
                          className="w-full text-left px-3 py-1.5 text-sm text-[#6f5b43] hover:bg-[#f2e6d8] rounded flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Markdown
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setRightPanelCollapsed((prev) => !prev)}
                    className="p-1.5 text-[#7c6a53] hover:text-[#5d4a34] hover:bg-[#ede1d1] rounded-lg transition-colors"
                    title={rightPanelCollapsed ? "Show Right Panel" : "Hide Right Panel"}
                  >
                    {rightPanelCollapsed ? (
                      <PanelRightOpen className="w-4 h-4" />
                    ) : (
                      <PanelRightClose className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={activePage.title}
                  onChange={(event) =>
                    void renamePage(activePage.id, event.target.value || "Untitled Page")
                  }
                  className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-white border border-[#d8c6b2] text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b]"
                  placeholder="Page Title"
                />
                <input
                  defaultValue={pageTagsValue}
                  key={`${activePage.id}-${pageTagsValue}`}
                  onBlur={(event) =>
                    void updatePageTags(
                      activePage.id,
                      event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full sm:w-[240px] px-3 py-1.5 rounded-lg bg-white border border-[#d8c6b2] text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b]"
                  placeholder="Tags (comma separated)"
                />
              </div>
            </header>

            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {workspaceView === "source" ? (
                  <MainSourceWorkspace
                    source={activeSource}
                    onBackToNotes={() => setWorkspaceView("notes")}
                    onSourceChange={setActiveSource}
                    onInsertToNotes={insertTextToNotes}
                    onInsertToNotesHtml={insertHtmlToNotes}
                  />
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <TipTapEditor
                      content={activePage.content}
                      onChange={(content) => updatePageContent(activePage.id, content)}
                      onTextSelect={setSelectedText}
                      placeholder="Start writing your notes... Type '/' for commands"
                      onEditorReady={(api) => {
                        editorApiRef.current = api;
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#e7d6c2] flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#8a7559]" />
              </div>
              <h2 className="text-xl font-semibold text-[#7b664d] mb-2">
                Open a study page to begin
              </h2>
              <p className="text-sm text-[#8e775e] leading-relaxed">
                Click the page icon next to any notebook to create/open a note, then type in the center editor.
                Use the top toolbar for headings, colors, highlights, tables, images, symbols, and formatting.
              </p>
              {loading && <p className="mt-4 text-xs text-[#8e775e]">Loading your workspace...</p>}
            </div>
          </div>
        )}
      </main>

      {!rightPanelCollapsed && (
        <aside className="hidden xl:flex w-[360px] border-l border-[#e4d7c8] flex-col bg-[#f8f1e7]">
          <div className="p-2 border-b border-[#e4d7c8] grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setRightTab("ai")}
              className={`py-1.5 text-xs rounded-lg transition-colors ${
                rightTab === "ai"
                  ? "bg-[#e4d4bf] text-[#6f5b43]"
                  : "text-[#8e775e] hover:bg-[#efe2d2]"
              }`}
            >
              AI Features
            </button>
            <button
              onClick={() => setRightTab("sources")}
              className={`py-1.5 text-xs rounded-lg transition-colors ${
                rightTab === "sources"
                  ? "bg-[#e4d4bf] text-[#6f5b43]"
                  : "text-[#8e775e] hover:bg-[#efe2d2]"
              }`}
            >
              Sources
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {rightTab === "ai" ? (
              <AIFeaturesPanel
                content={activePage?.content || ""}
                selectedText={selectedText}
                onSaveFlashcards={(cards) => void saveFlashcards(cards, activePage?.id)}
                onInsertToNotebook={(text) => {
                  editorApiRef.current?.insertTextAtCursor(text);
                }}
              />
            ) : (
              <SourcesPanel
                workspaceKey={activePage?.id || "global"}
                onInsertToNotes={insertTextToNotes}
                onInsertToNotesHtml={insertHtmlToNotes}
                onSelectSource={(source) => {
                  setActiveSource(source);
                  if (source) setWorkspaceView("source");
                }}
              />
            )}
          </div>
        </aside>
      )}

      {showTemplates && (
        <NoteTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <AIChatWidget content={activePage?.content || ""} />

      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
