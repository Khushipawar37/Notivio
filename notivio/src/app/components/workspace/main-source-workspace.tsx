"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  FileText,
  Highlighter,
  Italic,
  Search,
  Underline,
} from "lucide-react";
import type { StudySource } from "./sources-panel";
import { looksLikeGibberish, normalizeSourceText, sourceTextToHtml } from "../../lib/source-text-utils";

interface MainSourceWorkspaceProps {
  source: StudySource | null;
  onBackToNotes: () => void;
  onInsertToNotes?: (text: string) => void;
  onInsertToNotesHtml?: (html: string) => void;
  onSourceChange?: (source: StudySource) => void;
}

function decodePdfString(value: string) {
  return value
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\");
}

async function extractTextFromPdfUrl(fileUrl: string) {
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const raw = new TextDecoder("latin1").decode(buffer);
  const chunks: string[] = [];

  const tjMatches = raw.match(/\((?:\\.|[^\\()])*\)\s*Tj/g) || [];
  for (const match of tjMatches) chunks.push(decodePdfString(match.slice(1, match.lastIndexOf(")"))));

  const tjArrayMatches = raw.match(/\[[\s\S]*?\]\s*TJ/g) || [];
  for (const block of tjArrayMatches) {
    const parts = block.match(/\((?:\\.|[^\\()])*\)/g) || [];
    for (const part of parts) chunks.push(decodePdfString(part.slice(1, -1)));
  }

  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function applyCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function MainSourceWorkspace({
  source,
  onBackToNotes,
  onInsertToNotes,
  onInsertToNotesHtml,
  onSourceChange,
}: MainSourceWorkspaceProps) {
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(125);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [working, setWorking] = useState(false);
  const [viewTab, setViewTab] = useState<"preview" | "text">("preview");
  const [editableText, setEditableText] = useState(source?.extractedText || "");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditableText(source?.extractedText || "");
    setSearch("");
    setStatus("");
    setViewTab(source?.type === "pdf" ? "preview" : "text");
    setPdfPage(1);
  }, [source?.id, source?.type, source?.extractedText]);

  useEffect(() => {
    if (!source?.id) return;
    if (editableText === (source.extractedText || "")) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      void fetch(`/api/workspace/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedText: editableText }),
      });
      onSourceChange?.({ ...source, extractedText: editableText });
    }, 800);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [editableText, onSourceChange, source]);

  const visibleText = useMemo(() => {
    if (!editableText.trim()) return "";
    if (!search.trim()) return editableText;
    const q = search.trim().toLowerCase();
    return editableText
      .split(/\n/)
      .filter((line) => line.toLowerCase().includes(q))
      .join("\n");
  }, [editableText, search]);

  if (!source) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-[#8a7559] bg-[#fffaf3]">
        Select a source from the right panel to open it in this workspace.
      </div>
    );
  }

  const extractPdfText = async () => {
    if (source.type !== "pdf" || !source.fileUrl) return;
    setWorking(true);
    setStatus("Extracting text from PDF...");
    try {
      let extractedText = normalizeSourceText(await extractTextFromPdfUrl(source.fileUrl));

      // Fallback for scanned/handwritten PDFs using free OCR API wrapper.
      if (extractedText.replace(/\s+/g, "").length < 200 || looksLikeGibberish(extractedText)) {
        const blob = await fetch(source.fileUrl).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", blob, `${source.title || "source"}.pdf`);
        const ocrResponse = await fetch("/api/pdf-extract", {
          method: "POST",
          body: formData,
        });
        if (ocrResponse.ok) {
          const ocrData = await ocrResponse.json();
          extractedText = normalizeSourceText(String(ocrData.text || extractedText));
        }
      }

      if (!extractedText) {
        setStatus("No readable text found in this PDF.");
        return;
      }
      setEditableText(extractedText);
      onSourceChange?.({ ...source, extractedText });
      await fetch(`/api/workspace/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedText }),
      });
      setViewTab("text");
      setStatus("PDF text extracted. You can edit/highlight it here.");
      const formatted = sourceTextToHtml(`Extracted from PDF: ${source.title}`, extractedText);
      onInsertToNotesHtml?.(formatted);
      if (!onInsertToNotesHtml) {
        onInsertToNotes?.(`\n\nExtracted from PDF: ${source.title}\n${extractedText}\n`);
      }
    } catch {
      setStatus("PDF extraction failed.");
    } finally {
      setWorking(false);
    }
  };

  const pushTextToNotes = () => {
    const text = normalizeSourceText((editorRef.current?.innerText || editableText || "").trim());
    if (!text) return;
    const formatted = sourceTextToHtml(`Source Text: ${source.title}`, text);
    onInsertToNotesHtml?.(formatted);
    if (!onInsertToNotesHtml) {
      onInsertToNotes?.(`\n\nSource Text: ${source.title}\n${text}\n`);
    }
    setStatus("Added source text to notes.");
  };

  return (
    <div className="h-full flex flex-col bg-[#fffaf3]">
      <div className="px-4 py-2 border-b border-[#e4d7c8] bg-[#f8f1e7] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToNotes}
            className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back To Notes
          </button>
          <p className="text-sm font-medium text-[#6f5b43] truncate">{source.title}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {source.type === "pdf" && (
            <>
              <button
                onClick={() => setViewTab("preview")}
                className={`px-2 py-1 text-xs rounded border ${viewTab === "preview" ? "border-[#cfb899] bg-[#e7d6c2] text-[#5d4a34]" : "border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]"}`}
              >
                PDF
              </button>
              <button
                onClick={() => setViewTab("text")}
                className={`px-2 py-1 text-xs rounded border ${viewTab === "text" ? "border-[#cfb899] bg-[#e7d6c2] text-[#5d4a34]" : "border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]"}`}
              >
                Text
              </button>
              <button
                onClick={() => void extractPdfText()}
                disabled={working}
                className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] disabled:opacity-40"
              >
                Extract Text
              </button>
            </>
          )}
          <button
            onClick={pushTextToNotes}
            className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            Add To Notes
          </button>
        </div>
      </div>

      {status && <p className="px-4 py-1 border-b border-[#e4d7c8] text-[11px] text-[#8a7559]">{status}</p>}

      {source.type === "pdf" && viewTab === "preview" && source.fileUrl ? (
        <div className="flex-1 min-h-0 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setPdfPage((p) => Math.max(1, p - 1))} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]">Prev</button>
            <input value={pdfPage} onChange={(event) => setPdfPage(Math.max(1, Number(event.target.value) || 1))} className="w-16 px-2 py-1 text-xs rounded border border-[#d8c6b2] bg-white text-[#6f5b43] outline-none" />
            <button onClick={() => setPdfPage((p) => p + 1)} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]">Next</button>
            <span className="text-xs text-[#8a7559]">Zoom</span>
            <input type="range" min={80} max={200} value={pdfZoom} onChange={(event) => setPdfZoom(Number(event.target.value))} />
            <span className="text-xs text-[#8a7559]">{pdfZoom}%</span>
          </div>
          <iframe
            key={`${source.id}-${pdfPage}-${pdfZoom}`}
            src={`${source.fileUrl}#page=${pdfPage}&zoom=${pdfZoom}&toolbar=0&navpanes=0`}
            className="w-full h-[min(64vh,560px)] rounded border border-[#d8c6b2] bg-white"
            title={`PDF ${source.title}`}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 p-3 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9c8871] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search in source text..."
              className="w-full pl-7 pr-2 py-1.5 rounded border border-[#d8c6b2] bg-white text-xs text-[#6f5b43] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => applyCommand("bold")} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"><Bold className="w-3.5 h-3.5" />Bold</button>
            <button onClick={() => applyCommand("italic")} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"><Italic className="w-3.5 h-3.5" />Italic</button>
            <button onClick={() => applyCommand("underline")} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"><Underline className="w-3.5 h-3.5" />Underline</button>
            <button onClick={() => applyCommand("hiliteColor", "#fef08a")} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8] inline-flex items-center gap-1"><Highlighter className="w-3.5 h-3.5" />Highlight</button>
            <button onClick={() => applyCommand("removeFormat")} className="px-2 py-1 text-xs rounded border border-[#d8c6b2] text-[#6f5b43] hover:bg-[#f2e6d8]">Clear</button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => setEditableText(event.currentTarget.innerText)}
            className="flex-1 min-h-0 overflow-y-auto rounded border border-[#d8c6b2] bg-white p-3 text-sm text-[#6f5b43] whitespace-pre-wrap leading-relaxed outline-none"
            dangerouslySetInnerHTML={{
              __html: (visibleText || editableText || source.extractedText || "No source text available yet. For PDFs click Extract Text.")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br/>"),
            }}
          />
        </div>
      )}
    </div>
  );
}
