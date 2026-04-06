"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  FileText,
  Loader2,
  Search,
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  pageId: string;
  pageTitle: string;
  notebookTitle: string;
  sectionTitle: string;
  notebookId: string;
  sectionId: string;
  snippet: string;
  score: number;
}

interface SemanticSearchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  onPageSelect: (notebookId: string, sectionId: string, pageId: string) => void;
}

export function SemanticSearchModal({
  open,
  onClose,
  initialQuery = "",
  onPageSelect,
}: SemanticSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialQuery.trim().length >= 2) {
        void doSearch(initialQuery);
      } else {
        setResults([]);
        setSearched(false);
      }
      return;
    }

    setQuery("");
    setResults([]);
    setSearched(false);
  }, [doSearch, initialQuery, open]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 600);
    },
    [doSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        doSearch(query);
      }
    },
    [doSearch, onClose, query],
  );

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onPageSelect(result.notebookId, result.sectionId, result.pageId);
      onClose();
    },
    [onPageSelect, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-gradient-to-b from-[#fffaf3] to-[#f8f1e7] rounded-2xl shadow-2xl border border-[#d8c6b2]/60 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6ac8f]/30 to-[#8a7559]/20 shadow-inner">
              <Brain className="w-4.5 h-4.5 text-[#6f5b43]" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-[#5d4a34]">
                Semantic Search
              </h2>
              <p className="text-[10px] text-[#8a7559]">
                Find notes by meaning, not just keywords
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#ede1d1] text-[#8a7559] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0896f]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search by meaning... e.g. "explain backpropagation"'
              className="w-full pl-10 pr-10 py-3 bg-white border border-[#d8c6b2] rounded-xl text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b] focus:ring-2 focus:ring-[#c6ac8f]/20 transition-all placeholder:text-[#b39b7f]"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7559] animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto px-5 pb-5">
          {loading && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#e7d6c2] flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-[#8a7559]" />
              </div>
              <p className="text-xs text-[#8a7559]">
                Searching through your notes by meaning...
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#f2e6d8] flex items-center justify-center">
                <Search className="w-5 h-5 text-[#a0896f]" />
              </div>
              <div>
                <p className="text-sm text-[#7b664d] font-medium">
                  No matching notes found
                </p>
                <p className="text-[11px] text-[#8a7559] mt-1">
                  Try different wording or make sure your notes have been indexed.
                </p>
              </div>
            </div>
          )}

          {!searched && !loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#f2e6d8] flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#a0896f]" />
              </div>
              <div>
                <p className="text-sm text-[#7b664d] font-medium">
                  Search by concept, not keywords
                </p>
                <p className="text-[11px] text-[#8a7559] mt-1 max-w-xs">
                  Type what you&apos;re looking for in natural language. Finds notes
                  even when they use different words for the same idea.
                </p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-[#8a7559] uppercase tracking-wider mb-2">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              {results.map((result, i) => (
                <button
                  key={`${result.pageId}-${i}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3.5 rounded-xl border border-[#e4d7c8] bg-white/70 hover:bg-[#f5eadc] hover:border-[#cfb899] hover:shadow-sm transition-all duration-150 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#e7d6c2] to-[#d8c6b2] flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-[#7b664d]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[#5d4a34] truncate">
                          {result.pageTitle}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#a0896f] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen className="w-3 h-3 text-[#a0896f] flex-shrink-0" />
                        <span className="text-[10px] text-[#8a7559] truncate">
                          {result.notebookTitle} / {result.sectionTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7b664d]/80 line-clamp-2 leading-relaxed">
                        {result.snippet}
                      </p>
                      {/* Relevance bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#e7d6c2] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#c6ac8f] to-[#8a7559] transition-all duration-300"
                            style={{ width: `${Math.round(result.score * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-medium text-[#8a7559] tabular-nums">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#e4d7c8] bg-[#f5efe5]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-[#a0896f]">
              <Sparkles className="w-3 h-3" />
              <span>Powered by all-MiniLM-L6-v2 embeddings</span>
            </div>
            <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-[#d8c6b2] bg-[#f2e6d8] text-[#8a7559]">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
