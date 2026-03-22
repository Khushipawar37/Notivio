"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  FileText,
  FolderOpen,
  Globe,
  Highlighter,
  Import,
  Link2,
  Loader2,
  Search,
  Tags,
  Upload,
  Youtube,
  AudioLines,
  Plus,
  Check,
  ChevronRight,
  SplitSquareVertical,
  GitCompare,
  X,
} from "lucide-react";

type SourceType = "pdf" | "text" | "url" | "youtube" | "audio";
type HighlightCategory = "concept" | "definition" | "exam" | "confusion" | "connection";

interface SourceBookmark {
  id: string;
  label: string;
  locator: string;
}

interface SourceHighlight {
  id: string;
  text: string;
  category: HighlightCategory;
  locator: string;
}

interface StudySource {
  id: string;
  title: string;
  type: SourceType;
  folder: string;
  tags: string[];
  textContent: string;
  fileUrl?: string;
  originalUrl?: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  bookmarks: SourceBookmark[];
  highlights: SourceHighlight[];
}

interface SourcesPanelProps {
  workspaceKey: string;
  onInsertCitation?: (html: string) => void;
  onInsertPlain?: (text: string) => void;
}

const STORAGE_PREFIX = "studyspace-sources";

const HIGHLIGHT_META: Record<HighlightCategory, { label: string; tone: string }> = {
  concept: { label: "Key Concept", tone: "bg-amber-200/70" },
  definition: { label: "Definition", tone: "bg-emerald-200/70" },
  exam: { label: "Exam Likely", tone: "bg-pink-200/70" },
  confusion: { label: "Need Clarification", tone: "bg-sky-200/70" },
  connection: { label: "Cross Topic", tone: "bg-orange-200/70" },
};

function makeId() {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseYouTubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").trim();
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

async function callStudyAI(feature: string, content: string) {
  const response = await fetch("/api/ai-study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feature, content }),
  });
  if (!response.ok) throw new Error("AI call failed");
  const data = await response.json();
  return String(data.result || "");
}

export function SourcesPanel({
  workspaceKey,
  onInsertCitation,
  onInsertPlain,
}: SourcesPanelProps) {
  const storageKey = `${STORAGE_PREFIX}:${workspaceKey}`;
  const [sources, setSources] = useState<StudySource[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("All");
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [folderName, setFolderName] = useState("General");
  const [sourceTitle, setSourceTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [viewerSearch, setViewerSearch] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HighlightCategory>("concept");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [compareResult, setCompareResult] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [audioBookmarkLabel, setAudioBookmarkLabel] = useState("");
  const textViewerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StudySource[];
      setSources(parsed);
      if (parsed.length) setActiveSourceId(parsed[0].id);
    } catch {
      setSources([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sources));
  }, [sources, storageKey]);

  useEffect(() => {
    const current = sources.find((s) => s.id === activeSourceId);
    if (!current && sources.length) setActiveSourceId(sources[0].id);
  }, [activeSourceId, sources]);

  const folders = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const src of sources) set.add(src.folder || "General");
    return [...set];
  }, [sources]);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources.filter((src) => {
      if (folderFilter !== "All" && src.folder !== folderFilter) return false;
      if (!q) return true;
      return `${src.title} ${src.tags.join(" ")} ${src.type}`.toLowerCase().includes(q);
    });
  }, [folderFilter, search, sources]);

  const activeSource = useMemo(
    () => sources.find((s) => s.id === activeSourceId) || null,
    [activeSourceId, sources]
  );

  const visibleText = useMemo(() => {
    if (!activeSource?.textContent) return "";
    if (!viewerSearch.trim()) return activeSource.textContent;
    const query = viewerSearch.trim().toLowerCase();
    return activeSource.textContent
      .split(/\n/)
      .filter((line) => line.toLowerCase().includes(query))
      .join("\n");
  }, [activeSource?.textContent, viewerSearch]);

  const updateSource = useCallback(
    (sourceId: string, updater: (prev: StudySource) => StudySource) => {
      setSources((prev) => prev.map((src) => (src.id === sourceId ? updater(src) : src)));
    },
    []
  );

  const createSource = useCallback(
    (
      partial: Omit<
        StudySource,
        "id" | "createdAt" | "updatedAt" | "progress" | "bookmarks" | "highlights"
      >
    ) => {
      const now = new Date().toISOString();
      const src: StudySource = {
        ...partial,
        id: makeId(),
        progress: 0,
        bookmarks: [],
        highlights: [],
        createdAt: now,
        updatedAt: now,
      };
      setSources((prev) => [src, ...prev]);
      setActiveSourceId(src.id);
      return src.id;
    },
    []
  );

  const enrichSourceWithAI = useCallback(
    async (sourceId: string, content: string) => {
      if (!content || content.trim().length < 120) return;
      try {
        const [_, tagsRaw] = await Promise.all([
          callStudyAI("source_summary", content.slice(0, 12000)),
          callStudyAI("source_tags", content.slice(0, 12000)),
        ]);
        let tags: string[] = [];
        try {
          const maybe = JSON.parse(tagsRaw);
          if (Array.isArray(maybe)) tags = maybe.map(String).slice(0, 10);
        } catch {
          tags = tagsRaw
            .split(/,|\n/)
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 10);
        }
        if (tags.length) {
          updateSource(sourceId, (prev) => ({ ...prev, tags, updatedAt: new Date().toISOString() }));
        }
      } catch {
        // non-blocking enrichment
      }
    },
    [updateSource]
  );

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setStatus(`Processing ${files.length} file(s)...`);

    for (const file of Array.from(files)) {
      const lower = file.name.toLowerCase();
      const ext = lower.split(".").pop() || "";
      const sourceType: SourceType = file.type.startsWith("audio/")
        ? "audio"
        : ext === "pdf"
        ? "pdf"
        : "text";

      let textContent = "";
      let fileUrl = "";
      if (sourceType === "text") textContent = await file.text();
      else fileUrl = URL.createObjectURL(file);

      const sourceId = createSource({
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: sourceType,
        folder: folderName || "General",
        tags: [],
        textContent,
        fileUrl,
      });
      if (textContent) void enrichSourceWithAI(sourceId, textContent);
    }

    setUploading(false);
    setStatus("Import complete.");
    setImportOpen(false);
  };

  const importFromUrl = async () => {
    const url = inputUrl.trim();
    if (!url) return;
    setUploading(true);
    setStatus("Fetching page content...");
    try {
      const response = await fetch("/api/source-extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Unable to fetch");
      const data = await response.json();
      const text = String(data.text || "");
      const title = String(data.title || sourceTitle || "Web Source");
      const sourceId = createSource({
        title,
        type: "url",
        folder: folderName || "General",
        tags: [],
        textContent: text,
        originalUrl: url,
      });
      void enrichSourceWithAI(sourceId, text);
      setInputUrl("");
      setSourceTitle("");
      setImportOpen(false);
      setStatus("URL imported.");
    } catch {
      setStatus("Could not import this URL.");
    } finally {
      setUploading(false);
    }
  };

  const importRawText = async () => {
    if (!rawText.trim()) return;
    setUploading(true);
    const sourceId = createSource({
      title: sourceTitle.trim() || "Pasted Text",
      type: "text",
      folder: folderName || "General",
      tags: [],
      textContent: rawText,
    });
    void enrichSourceWithAI(sourceId, rawText);
    setRawText("");
    setSourceTitle("");
    setImportOpen(false);
    setUploading(false);
    setStatus("Text imported.");
  };

  const importYouTubeTranscript = async () => {
    const url = inputUrl.trim();
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      setStatus("Enter a valid YouTube URL.");
      return;
    }
    setUploading(true);
    setStatus("Fetching transcript...");
    try {
      const response = await fetch(`/api/video-transcript?videoId=${encodeURIComponent(videoId)}`);
      if (!response.ok) throw new Error("Transcript failed");
      const data = await response.json();
      const transcript = String(data.transcript || "");
      const sourceId = createSource({
        title: String(data.title || "YouTube Transcript"),
        type: "youtube",
        folder: folderName || "General",
        tags: ["lecture", "video"],
        textContent: transcript,
        originalUrl: url,
      });
      void enrichSourceWithAI(sourceId, transcript);
      setInputUrl("");
      setImportOpen(false);
      setStatus("Transcript imported.");
    } catch {
      setStatus("Could not fetch transcript for this video.");
    } finally {
      setUploading(false);
    }
  };

  const addHighlightFromSelection = () => {
    if (!activeSource) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString().trim();
    if (!text) return;

    const highlight: SourceHighlight = {
      id: makeId(),
      text,
      category: selectedCategory,
      locator: activeSource.type === "pdf" ? `Page ${pdfPage}` : "Text section",
    };
    updateSource(activeSource.id, (prev) => ({
      ...prev,
      highlights: [highlight, ...prev.highlights],
      updatedAt: new Date().toISOString(),
    }));
    setCopiedText(text);
  };

  const addBookmark = () => {
    if (!activeSource) return;
    let locator = "Text section";
    if (activeSource.type === "pdf") locator = `Page ${pdfPage}`;
    if (activeSource.type === "audio" && audioRef.current) {
      locator = `Time ${Math.floor(audioRef.current.currentTime)}s`;
    }
    const bookmark: SourceBookmark = {
      id: makeId(),
      label: audioBookmarkLabel.trim() || `Bookmark ${activeSource.bookmarks.length + 1}`,
      locator,
    };
    updateSource(activeSource.id, (prev) => ({
      ...prev,
      bookmarks: [bookmark, ...prev.bookmarks],
      updatedAt: new Date().toISOString(),
    }));
    setAudioBookmarkLabel("");
  };

  const insertCitation = (text: string, locator?: string) => {
    if (!activeSource || !text.trim()) return;
    const where = locator || (activeSource.type === "pdf" ? `Page ${pdfPage}` : "Source");
    const html = `<blockquote style="border-left:3px solid #c9b39a;padding:10px 12px;margin:12px 0;background:#f5eadc;border-radius:8px;">
<p style="margin:0 0 8px 0;color:#5d4a34;">${escapeHtml(text.trim())}</p>
<p style="margin:0;font-size:12px;color:#8a7559;">Source: ${escapeHtml(activeSource.title)} (${escapeHtml(where)})</p>
</blockquote>`;
    onInsertCitation?.(html);
  };

  const insertHighlightsAsNotes = () => {
    if (!activeSource || !activeSource.highlights.length) return;
    const body = activeSource.highlights
      .slice(0, 12)
      .map((h, i) => `${i + 1}. [${HIGHLIGHT_META[h.category].label}] ${h.text} (${h.locator})`)
      .join("\n");
    onInsertPlain?.(`\n\nSource Highlights - ${activeSource.title}\n${body}\n`);
  };

  const compareSources = async () => {
    if (!compareA || !compareB || compareA === compareB) return;
    const a = sources.find((s) => s.id === compareA);
    const b = sources.find((s) => s.id === compareB);
    if (!a || !b || !a.textContent || !b.textContent) return;

    setLoadingCompare(true);
    setCompareResult("");
    try {
      const result = await callStudyAI(
        "compare_sources",
        `Source A (${a.title}):\n${a.textContent.slice(0, 7000)}\n\nSource B (${b.title}):\n${b.textContent.slice(0, 7000)}`
      );
      setCompareResult(result);
    } catch {
      setCompareResult("Comparison failed. Try again.");
    } finally {
      setLoadingCompare(false);
    }
  };

  const updateReadingProgress = useCallback(() => {
    if (!activeSource || !textViewerRef.current) return;
    const el = textViewerRef.current;
    const total = el.scrollHeight - el.clientHeight;
    const progress = total <= 0 ? 100 : Math.round((el.scrollTop / total) * 100);
    updateSource(activeSource.id, (prev) => ({ ...prev, progress }));
  }, [activeSource, updateSource]);

  return (
    <div className="h-full bg-[#f8f1e7] flex flex-col">
      <div className="px-4 py-3 border-b border-[#e4d7c8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#8a7559]" />
            <h2 className="text-sm font-semibold text-[#6f5b43]">Sources Workspace</h2>
          </div>
          <button
            onClick={() => setImportOpen((prev) => !prev)}
            className="px-2 py-1 rounded-md text-xs bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] flex items-center gap-1.5"
          >
            <Import className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
        {status && <p className="mt-2 text-[11px] text-[#8a7559]">{status}</p>}
      </div>

      {importOpen && (
        <div className="p-3 border-b border-[#e4d7c8] bg-[#fff8ee] space-y-2">
          <div className="flex gap-2">
            <input
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder="Source title (optional)"
              className="flex-1 px-2 py-1.5 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none"
            />
            <input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Folder"
              className="w-24 px-2 py-1.5 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Files
            </button>
            <button
              onClick={importRawText}
              disabled={uploading || !rawText.trim()}
              className="px-2.5 py-1.5 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] disabled:opacity-40 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Save Text
            </button>
            <button
              onClick={importFromUrl}
              disabled={uploading || !inputUrl.trim()}
              className="px-2.5 py-1.5 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] disabled:opacity-40 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              Import URL
            </button>
            <button
              onClick={importYouTubeTranscript}
              disabled={uploading || !inputUrl.trim()}
              className="px-2.5 py-1.5 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] disabled:opacity-40 flex items-center gap-1.5"
            >
              <Youtube className="w-3.5 h-3.5" />
              YouTube Transcript
            </button>
          </div>

          <input
            value={inputUrl}
            onChange={(event) => setInputUrl(event.target.value)}
            placeholder="Paste URL (article or YouTube)"
            className="w-full px-2 py-1.5 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none"
          />
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Paste raw text here..."
            className="w-full h-20 px-2 py-1.5 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none resize-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.txt,.md,.csv,.json,audio/*"
            onChange={(event) => {
              void handleFilesUpload(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </div>
      )}

      <div className="p-3 border-b border-[#e4d7c8] space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#9c8871] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sources..."
              className="w-full pl-7 pr-2 py-1.5 rounded border border-[#d8c6b2] bg-[#fff8ee] text-xs text-[#6f5b43] outline-none"
            />
          </div>
          <select
            value={folderFilter}
            onChange={(event) => setFolderFilter(event.target.value)}
            className="w-[110px] px-2 py-1.5 rounded border border-[#d8c6b2] bg-[#fff8ee] text-xs text-[#6f5b43] outline-none"
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setLibraryOpen((prev) => !prev)}
          className="w-full text-left px-2 py-1 rounded text-xs text-[#7a6143] hover:bg-[#f2e6d8] flex items-center gap-1.5"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${libraryOpen ? "rotate-90" : ""}`} />
          Source Library ({filteredSources.length})
        </button>
        {libraryOpen && (
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filteredSources.map((src) => (
              <button
                key={src.id}
                onClick={() => setActiveSourceId(src.id)}
                className={`w-full text-left p-2 rounded-lg border ${
                  activeSourceId === src.id
                    ? "bg-[#f2e6d8] border-[#cfb899]"
                    : "bg-[#fff8ee] border-[#e4d7c8] hover:bg-[#f6ecdf]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#6f5b43] truncate">{src.title}</p>
                  <span className="text-[10px] uppercase text-[#9c8871]">{src.type}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-[#eadcc9] overflow-hidden">
                  <div className="h-full bg-[#c9b39a]" style={{ width: `${Math.max(0, Math.min(100, src.progress))}%` }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {!activeSource && (
          <div className="h-full flex items-center justify-center text-center text-xs text-[#8a7559]">
            Select a source from library to start reading and citing.
          </div>
        )}

        {activeSource && (
          <>
            <div className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#6f5b43]">{activeSource.title}</h3>
                  <p className="text-[11px] text-[#8a7559]">
                    Folder: {activeSource.folder} | Highlights: {activeSource.highlights.length} | Bookmarks: {activeSource.bookmarks.length}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSources((prev) => prev.filter((s) => s.id !== activeSource.id));
                    setActiveSourceId(null);
                  }}
                  className="p-1 rounded text-[#8a7559] hover:bg-[#f2e6d8]"
                  title="Remove source"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button onClick={addHighlightFromSelection} className="px-2 py-1 text-[11px] rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] flex items-center gap-1"><Highlighter className="w-3 h-3" />Capture</button>
                <button onClick={() => insertCitation(copiedText || activeSource.textContent.slice(0, 220))} className="px-2 py-1 text-[11px] rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] flex items-center gap-1"><Link2 className="w-3 h-3" />Cite</button>
                <button onClick={insertHighlightsAsNotes} className="px-2 py-1 text-[11px] rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] flex items-center gap-1"><SplitSquareVertical className="w-3 h-3" />Insert Highlights</button>
                <button onClick={addBookmark} className="px-2 py-1 text-[11px] rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] flex items-center gap-1"><BookMarked className="w-3 h-3" />Bookmark</button>
              </div>
            </div>

            <div className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee] space-y-2">
              <div className="flex items-center gap-2">
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as HighlightCategory)} className="w-[160px] px-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none">
                  {Object.entries(HIGHLIGHT_META).map(([key, meta]) => (<option key={key} value={key}>{meta.label}</option>))}
                </select>
                <input value={audioBookmarkLabel} onChange={(event) => setAudioBookmarkLabel(event.target.value)} placeholder="Bookmark label" className="flex-1 px-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none" />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-[#8a7559]" />}
              </div>

              {activeSource.type === "pdf" && activeSource.fileUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPdfPage((p) => Math.max(1, p - 1))} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]">Prev</button>
                    <input value={pdfPage} onChange={(event) => setPdfPage(Math.max(1, Number(event.target.value) || 1))} className="w-16 px-2 py-1 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none" />
                    <button onClick={() => setPdfPage((p) => p + 1)} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]">Next</button>
                  </div>
                  <iframe src={`${activeSource.fileUrl}#page=${pdfPage}&zoom=page-width`} className="w-full h-[320px] rounded border border-[#e4d7c8] bg-white" title={`PDF ${activeSource.title}`} />
                </div>
              )}

              {activeSource.type === "audio" && activeSource.fileUrl && (
                <audio ref={audioRef} controls className="w-full">
                  <source src={activeSource.fileUrl} />
                </audio>
              )}

              {(activeSource.type === "text" || activeSource.type === "url" || activeSource.type === "youtube") && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#9c8871] absolute left-2 top-1/2 -translate-y-1/2" />
                    <input value={viewerSearch} onChange={(event) => setViewerSearch(event.target.value)} placeholder="Search inside source text..." className="w-full pl-7 pr-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none" />
                  </div>
                  <div ref={textViewerRef} onScroll={updateReadingProgress} className="h-[320px] overflow-y-auto rounded border border-[#e4d7c8] bg-white p-3 text-xs text-[#6f5b43] whitespace-pre-wrap leading-relaxed">
                    {visibleText || "No text available in this source."}
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee] space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#6f5b43]">
                <Tags className="w-3.5 h-3.5" />
                Highlights & Bookmarks
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {activeSource.highlights.map((h) => (
                  <div key={h.id} className="p-2 rounded border border-[#e4d7c8] bg-[#fdf8f0]">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${HIGHLIGHT_META[h.category].tone} text-[#5d4a34]`}>{HIGHLIGHT_META[h.category].label}</span>
                      <span className="text-[10px] text-[#9c8871]">{h.locator}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6f5b43] line-clamp-3">{h.text}</p>
                    <button onClick={() => insertCitation(h.text, h.locator)} className="mt-1.5 text-[10px] px-1.5 py-0.5 rounded border border-[#d8c6b2] text-[#7a6143] hover:bg-[#f2e6d8]">Cite</button>
                  </div>
                ))}
                {activeSource.bookmarks.map((b) => (
                  <div key={b.id} className="p-2 rounded border border-[#e4d7c8] bg-[#fdf8f0] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#6f5b43]">{b.label}</p>
                      <p className="text-[10px] text-[#9c8871]">{b.locator}</p>
                    </div>
                    <button onClick={() => insertCitation(`${activeSource.title} - ${b.label}`, b.locator)} className="text-[10px] px-1.5 py-0.5 rounded border border-[#d8c6b2] text-[#7a6143] hover:bg-[#f2e6d8]">Cite</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee] space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#6f5b43]">
                <GitCompare className="w-3.5 h-3.5" />
                Compare Sources
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={compareA} onChange={(event) => setCompareA(event.target.value)} className="px-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none">
                  <option value="">Source A</option>
                  {sources.map((src) => <option key={src.id} value={src.id}>{src.title}</option>)}
                </select>
                <select value={compareB} onChange={(event) => setCompareB(event.target.value)} className="px-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none">
                  <option value="">Source B</option>
                  {sources.map((src) => <option key={src.id} value={src.id}>{src.title}</option>)}
                </select>
              </div>
              <button onClick={compareSources} disabled={!compareA || !compareB || compareA === compareB || loadingCompare} className="w-full py-1.5 rounded bg-[#e7d6c2] hover:bg-[#ddc8ad] text-xs text-[#6f5b43] disabled:opacity-40 flex items-center justify-center gap-1.5">
                {loadingCompare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                Compare
              </button>
              {compareResult && (
                <div className="rounded border border-[#e4d7c8] bg-[#fdf8f0] p-2 text-xs text-[#6f5b43] whitespace-pre-wrap max-h-44 overflow-y-auto">
                  {compareResult}
                  <button onClick={() => onInsertPlain?.(`\n\nSource Comparison\n${compareResult}\n`)} className="mt-2 px-2 py-1 text-[10px] rounded border border-[#d8c6b2] text-[#7a6143] hover:bg-[#f2e6d8] inline-flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add to Notes
                  </button>
                </div>
              )}
            </div>

            <div className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee] text-[11px] text-[#8a7559]">
              <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#7f6a4d]" />Citation insertions go directly to notebook cursor.</p>
              <p className="mt-1 flex items-center gap-1.5"><AudioLines className="w-3.5 h-3.5 text-[#7f6a4d]" />Audio bookmarks and YouTube transcripts are source-ready.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
