"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Globe, Import, Search, Upload } from "lucide-react";
import { normalizeSourceText, sourceTextToHtml } from "../../lib/source-text-utils";

export type SourceType = "pdf" | "url";

export interface StudySource {
  id: string;
  title: string;
  type: SourceType;
  fileUrl?: string;
  originalUrl?: string;
  extractedText?: string;
  createdAt: string;
}

interface SourcesPanelProps {
  workspaceKey: string;
  onSelectSource?: (source: StudySource | null) => void;
  onInsertToNotes?: (text: string) => void;
  onInsertToNotesHtml?: (html: string) => void;
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SourcesPanel({
  workspaceKey,
  onSelectSource,
  onInsertToNotes,
  onInsertToNotesHtml,
}: SourcesPanelProps) {
  const [sources, setSources] = useState<StudySource[]>([]);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onSelectSourceRef = useRef(onSelectSource);

  useEffect(() => {
    onSelectSourceRef.current = onSelectSource;
  }, [onSelectSource]);

  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    const response = await fetch(
      `/api/workspace/sources?workspaceKey=${encodeURIComponent(workspaceKey)}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      setSources([]);
      setSourcesLoading(false);
      return;
    }
    const data = (await response.json()) as StudySource[];
    setSources(data);
    onSelectSourceRef.current?.(data[0] || null);
    setSourcesLoading(false);
  }, [workspaceKey]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((src) => `${src.title} ${src.type}`.toLowerCase().includes(q));
  }, [search, sources]);

  const importPdfFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    setStatus(`Importing ${files.length} PDF file(s)...`);

    let added = 0;
    for (const file of Array.from(files)) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) continue;

      const base64 = await fileToBase64(file);
      const response = await fetch("/api/workspace/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceKey,
          title: file.name.replace(/\.pdf$/i, ""),
          type: "pdf",
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          fileBase64: base64,
        }),
      });

      if (response.ok) {
        const source = (await response.json()) as StudySource;
        setSources((prev) => [source, ...prev]);
        onSelectSource?.(source);
        added += 1;
      }
    }

    if (added) {
      setStatus(`${added} PDF source(s) added.`);
    } else {
      setStatus("No valid PDF file selected.");
    }

    setLoading(false);
    setImportOpen(false);
  };

  const importFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoading(true);
    setStatus("Extracting text from URL...");
    try {
      const extractionResponse = await fetch("/api/source-extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!extractionResponse.ok) throw new Error("URL extraction failed");
      const data = await extractionResponse.json();
      const title = String(data.title || "Web Source");
      const text = normalizeSourceText(String(data.text || ""));

      const saveResponse = await fetch("/api/workspace/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceKey,
          title,
          type: "url",
          originalUrl: url,
          extractedText: text,
        }),
      });
      if (!saveResponse.ok) throw new Error("Could not save source");

      const source = (await saveResponse.json()) as StudySource;
      setSources((prev) => [source, ...prev]);
      onSelectSource?.(source);
      const formatted = sourceTextToHtml(`Source Imported: ${title}`, text);
      onInsertToNotesHtml?.(formatted);
      if (!onInsertToNotesHtml) {
        onInsertToNotes?.(`\n\nSource Imported: ${title}\n${text}\n`);
      }
      setUrlInput("");
      setImportOpen(false);
      setStatus("URL source added and text inserted into notes.");
    } catch {
      setStatus("Could not extract text from this URL.");
    } finally {
      setLoading(false);
    }
  };

  const removeSource = async (sourceId: string) => {
    await fetch(`/api/workspace/sources/${sourceId}`, { method: "DELETE" });
    setSources((prev) => {
      const next = prev.filter((source) => source.id !== sourceId);
      onSelectSource?.(next[0] || null);
      return next;
    });
  };

  return (
    <div className="h-full bg-[#f8f1e7] flex flex-col">
      <div className="px-4 py-3 border-b border-[#e4d7c8]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#6f5b43]">Sources</h2>
          <button
            onClick={() => setImportOpen((prev) => !prev)}
            className="px-2 py-1 rounded-md text-xs bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] inline-flex items-center gap-1"
          >
            <Import className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
        {status && <p className="mt-2 text-[11px] text-[#8a7559]">{status}</p>}
      </div>

      {importOpen && (
        <div className="p-3 border-b border-[#e4d7c8] bg-[#fff8ee] space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-2.5 py-2 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) => {
              void importPdfFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />

          <div className="pt-1 border-t border-[#e4d7c8]">
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="Paste URL to extract text"
              className="w-full px-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none"
            />
            <button
              onClick={importFromUrl}
              disabled={loading || !urlInput.trim()}
              className="mt-2 w-full px-2.5 py-2 rounded-md text-xs border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              Import URL
            </button>
          </div>
        </div>
      )}

      <div className="p-3 border-b border-[#e4d7c8]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9c8871] absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sources..."
            className="w-full pl-7 pr-2 py-1.5 rounded border border-[#d8c6b2] bg-[#fff8ee] text-xs text-[#6f5b43] outline-none"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {sourcesLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-16 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]" />
            <div className="h-16 rounded-lg border border-[#d8c6b2] bg-[#f2e6d8]" />
            <p className="text-xs text-[#8a7559]">Loading sources...</p>
          </div>
        ) : (
          filteredSources.map((source) => (
            <div key={source.id} className="p-2 rounded-lg border border-[#d8c6b2] bg-[#fff8ee]">
              <button onClick={() => onSelectSource?.(source)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#6f5b43] truncate">{source.title}</p>
                  <span className="text-[10px] uppercase text-[#9c8871]">{source.type}</span>
                </div>
              </button>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectSource?.(source)}
                  className="text-[10px] px-2 py-0.5 rounded border border-[#d8c6b2] text-[#7a6143] hover:bg-[#f2e6d8] inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  View In Workspace
                </button>
                <button
                  onClick={() => {
                    void removeSource(source.id);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded border border-[#d8c6b2] text-[#7a6143] hover:bg-[#f2e6d8]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        {!sourcesLoading && !filteredSources.length && (
          <p className="text-xs text-[#8a7559]">No sources yet. Import a PDF or URL.</p>
        )}
      </div>
    </div>
  );
}
