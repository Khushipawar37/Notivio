"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  FolderOpen,
  GraduationCap,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export interface NotebookPage {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookSection {
  id: string;
  title: string;
  pages: NotebookPage[];
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notebook {
  id: string;
  title: string;
  emoji: string;
  sections: NotebookSection[];
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotebookSidebarProps {
  notebooks: Notebook[];
  loading?: boolean;
  activePageId: string | null;
  searchQuery: string;
  semanticQuery: string;
  searchMode: "keyword" | "semantic";
  onSearchChange: (value: string) => void;
  onSearchModeChange: (mode: "keyword" | "semantic") => void;
  onPageSelect: (notebookId: string, sectionId: string, pageId: string) => void;
  onCreateNotebook: () => void;
  onCreateSection: (notebookId: string) => void;
  onCreatePage: (notebookId: string, sectionId: string) => void;
  onCreatePageInNotebook: (notebookId: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onDeleteSection: (notebookId: string, sectionId: string) => void;
  onDeletePage: (notebookId: string, sectionId: string, pageId: string) => void;
  onRenameNotebook: (notebookId: string, newTitle: string) => void;
  onRenameSection: (notebookId: string, sectionId: string, newTitle: string) => void;
  onRenamePage: (notebookId: string, sectionId: string, pageId: string, newTitle: string) => void;
  onToggleNotebook: (notebookId: string) => void;
  onToggleSection: (notebookId: string, sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSemanticSearch?: () => void;
}

export function NotebookSidebar({
  notebooks,
  loading = false,
  activePageId,
  searchQuery,
  semanticQuery,
  searchMode,
  onSearchChange,
  onSearchModeChange,
  onPageSelect,
  onCreateNotebook,
  onCreateSection,
  onCreatePage,
  onCreatePageInNotebook,
  onDeleteNotebook,
  onDeleteSection,
  onDeletePage,
  onRenameNotebook,
  onRenameSection,
  onRenamePage,
  onToggleNotebook,
  onToggleSection,
  isCollapsed,
  onToggleCollapse,
  onOpenSemanticSearch,
}: NotebookSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
    setContextMenuId(null);
    setTimeout(() => editInputRef.current?.focus(), 20);
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#f8f1e7] border-r border-[#e4d7c8] flex flex-col items-center py-3 gap-3">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[#ede1d1] text-[#8a7559] hover:text-[#7b664d] transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <button
          onClick={onCreateNotebook}
          className="p-1.5 rounded-lg hover:bg-[#ede1d1] text-[#8a7559] hover:text-[#7b664d] transition-colors"
          title="New Notebook"
        >
          <Plus className="w-4 h-4" />
        </button>
        {notebooks.map((notebook) => (
          <button
            key={notebook.id}
            onClick={() => onToggleNotebook(notebook.id)}
            className="p-1.5 rounded-lg hover:bg-[#ede1d1] transition-all duration-200 text-sm hover:shadow-sm"
            title={notebook.title}
          >
            <BookOpen className="w-4 h-4 text-[#8a7559]" />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-64 sm:w-72 bg-[#f8f1e7] border-r border-[#e4d7c8] flex flex-col h-full">
      <div className="px-3 py-3 border-b border-[#e4d7c8]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#8a7559]" />
            <span className="text-sm font-semibold text-[#6f5b43]">StudySpace</span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-[#ede1d1] text-[#8a7559] hover:text-[#8a7559] transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0896f]" />
          <input
            value={searchMode === "keyword" ? searchQuery : semanticQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => {
              if (searchMode === "semantic") onOpenSemanticSearch?.();
            }}
            placeholder={
              searchMode === "keyword"
                ? "Search all notes..."
                : "Search by meaning..."
            }
            className="w-full pl-8 pr-10 py-1.5 bg-[#f2e6d8] border border-[#d8c6b2] rounded-lg text-xs text-[#7b664d] outline-none focus:border-[#b79c79] placeholder:text-[#8a7559] transition-all duration-200 hover:bg-[#efe2d2]"
          />
          {onOpenSemanticSearch && (
            <button
              onClick={onOpenSemanticSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[#e7d6c2] text-[#8a7559] hover:text-[#6f5b43] transition-colors"
              title="Semantic Search (AI)"
            >
              <Brain className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-[#f2e6d8] p-0.5 border border-[#d8c6b2]">
          <button
            onClick={() => onSearchModeChange("keyword")}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              searchMode === "keyword"
                ? "bg-[#e7d6c2] text-[#6f5b43]"
                : "text-[#8a7559] hover:bg-[#ede1d1]"
            }`}
            title="Keyword search"
          >
            Keyword
          </button>
          <button
            onClick={() => {
              onSearchModeChange("semantic");
              onOpenSemanticSearch?.();
            }}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              searchMode === "semantic"
                ? "bg-[#e7d6c2] text-[#6f5b43]"
                : "text-[#8a7559] hover:bg-[#ede1d1]"
            }`}
            title="Semantic search"
          >
            Semantic
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-6 space-y-3 animate-pulse">
            <div className="h-3 w-24 rounded bg-[#e7d6c2]" />
            <div className="h-8 w-full rounded bg-[#efe2d2]" />
            <div className="h-8 w-11/12 rounded bg-[#efe2d2]" />
            <div className="h-8 w-10/12 rounded bg-[#efe2d2]" />
            <p className="text-xs text-[#8a7559]">Loading notebooks...</p>
          </div>
        ) : (
          <>
        {notebooks.map((notebook) => (
          <div key={notebook.id}>
            {(() => {
              const pageCount = notebook.sections.reduce(
                (count, section) => count + section.pages.length,
                0
              );
              return (
            <div
              className={`group flex items-center gap-1 px-2 py-1 mx-1 rounded-md cursor-pointer transition-colors ${
                contextMenuId === notebook.id ? "bg-[#f2e6d8]" : "hover:bg-[#ede1d1]"
              }`}
            >
              <button
                onClick={() => onToggleNotebook(notebook.id)}
                className="p-0.5 text-[#8a7559] hover:text-[#6f5b43] transition-colors"
                title="Toggle Notebook"
              >
                {notebook.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {editingId === notebook.id ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && editValue.trim()) {
                      onRenameNotebook(notebook.id, editValue.trim());
                      setEditingId(null);
                    }
                    if (event.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-[#f2e6d8] px-1.5 py-0.5 rounded text-xs text-[#6f5b43] outline-none"
                />
              ) : (
                <span onClick={() => onToggleNotebook(notebook.id)} className="flex-1 text-xs font-medium text-[#8a7559] truncate">
                  {notebook.title}
                  <span className="ml-1 text-[10px] text-[#a0896f]">({pageCount})</span>
                </span>
              )}

              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                <button
                  onClick={() => onCreatePageInNotebook(notebook.id)}
                  className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                  title="Add Page"
                >
                  <FileText className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onCreateSection(notebook.id)}
                  className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                  title="Add Section"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setContextMenuId(contextMenuId === notebook.id ? null : notebook.id)}
                  className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                  title="Notebook Menu"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </div>
            </div>
              );
            })()}

            {contextMenuId === notebook.id && (
              <div className="mx-3 my-1 p-1 bg-[#fff8ee] border border-[#d8c6b2] rounded-lg shadow-xl text-xs">
                <button
                  onClick={() => startEditing(notebook.id, notebook.title)}
                  className="w-full text-left px-2 py-1 text-[#7b664d] hover:bg-[#ede1d1] rounded flex items-center gap-2"
                >
                  <Edit3 className="w-3 h-3" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    onDeleteNotebook(notebook.id);
                    setContextMenuId(null);
                  }}
                  className="w-full text-left px-2 py-1 text-red-400/80 hover:bg-[#ede1d1] rounded flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}

            {notebook.isExpanded &&
              notebook.sections.map((section) => (
                <div key={section.id} className="ml-3">
                  <div className="group flex items-center gap-1 px-2 py-1 mx-1 rounded-md cursor-pointer hover:bg-[#ede1d1] transition-colors">
                    <button
                      onClick={() => onToggleSection(notebook.id, section.id)}
                      className="p-0.5 text-[#8a7559]"
                      title="Toggle Section"
                    >
                      {section.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    <FolderOpen className="w-3 h-3 text-[#8a7559]" />

                    {editingId === section.id ? (
                      <input
                        ref={editInputRef}
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && editValue.trim()) {
                            onRenameSection(notebook.id, section.id, editValue.trim());
                            setEditingId(null);
                          }
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 bg-[#f2e6d8] px-1.5 py-0.5 rounded text-xs text-[#6f5b43] outline-none"
                      />
                    ) : (
                      <span
                        className="flex-1 text-xs text-[#8a7559] truncate"
                        onClick={() => {
                          if (section.pages.length > 0) {
                            const recentPage = [...section.pages].sort(
                              (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
                            )[0];
                            if (recentPage) onPageSelect(notebook.id, section.id, recentPage.id);
                          } else {
                            onCreatePage(notebook.id, section.id);
                          }
                        }}
                      >
                        {section.title}
                        <span className="ml-1 text-[10px] text-[#a0896f]">
                          {section.pages.length}
                        </span>
                      </span>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={() => onCreatePage(notebook.id, section.id)}
                        className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                        title="Add Page"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => startEditing(section.id, section.title)}
                        className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                        title="Rename Section"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteSection(notebook.id, section.id)}
                        className="p-0.5 rounded hover:bg-[#ede1d1] text-red-400/60"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {section.isExpanded &&
                    section.pages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => onPageSelect(notebook.id, section.id, page.id)}
                className={`group px-2 py-1 mx-1 ml-5 rounded-md cursor-pointer border transition-colors ${
                          activePageId === page.id
                            ? "bg-[#e7d6c2] border-[#cfb899] shadow-sm"
                            : "hover:bg-[#ede1d1] hover:shadow-sm border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className={`w-3 h-3 ${activePageId === page.id ? "text-[#8a7559]" : "text-[#8a7559]"}`} />
                          {editingId === page.id ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(event) => setEditValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && editValue.trim()) {
                                  onRenamePage(notebook.id, section.id, page.id, editValue.trim());
                                  setEditingId(null);
                                }
                                if (event.key === "Escape") setEditingId(null);
                              }}
                              className="flex-1 bg-[#f2e6d8] px-1.5 py-0.5 rounded text-xs text-[#6f5b43] outline-none"
                            />
                          ) : (
                            <span
                              className={`flex-1 text-xs truncate ${
                                activePageId === page.id ? "text-[#8a7559] font-medium" : "text-[#8a7559]"
                              }`}
                            >
                              {page.title}
                            </span>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditing(page.id, page.title);
                              }}
                              className="p-0.5 rounded hover:bg-[#ede1d1] text-[#8a7559]"
                              title="Rename Page"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onDeletePage(notebook.id, section.id, page.id);
                              }}
                              className="p-0.5 rounded hover:bg-[#ede1d1] text-red-400/70"
                              title="Delete Page"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                        {page.tags.length > 0 && (
                          <div className="mt-1 ml-4 flex flex-wrap gap-1">
                            {page.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#f2e6d8] text-[#8a7559]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}

        {notebooks.length === 0 && (
          <div className="px-4 py-8 text-center">
            <BookOpen className="w-8 h-8 text-[#b39b7f] mx-auto mb-2" />
            <p className="text-xs text-[#8a7559] mb-3">No notebooks yet</p>
            <button
              onClick={onCreateNotebook}
              className="px-3 py-1.5 bg-[#e7d6c2] text-[#8a7559] rounded-lg text-xs hover:bg-[#ddc8ad] transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Create Notebook
            </button>
          </div>
        )}
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[#e4d7c8]">
        <button
          onClick={onCreateNotebook}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#8a7559] hover:text-[#8a7559] hover:bg-[#ede1d1] rounded-lg transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Notebook
        </button>
      </div>
    </aside>
  );
}
