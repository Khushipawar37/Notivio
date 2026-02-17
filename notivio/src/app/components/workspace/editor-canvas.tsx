"use client";

import React, { useRef, useEffect, ReactNode } from "react";
import { Separator } from "../ui/separator";

interface EditorCanvasProps {
  content: string;
  onContentChange: (content: string) => void;
  onTextSelect: (text: string) => void;
  placeholder?: string;
  selectedFormat?: any;
  darkMode?: boolean;
  children?: ReactNode;
}

export function EditorCanvas({
  content,
  onContentChange,
  onTextSelect,
  placeholder = "Start typing...",
  selectedFormat,
  darkMode = false,
  children,
}: EditorCanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onContentChange(newContent);
    }
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      onTextSelect(selection.toString());
    }
  };

  // Professional typography system with Tailwind CSS
  const typographyStyles = `
    /* H1 - Main Title */
    .editor h1 {
      @apply text-3xl font-bold tracking-tight mb-6 leading-tight;
    }

    /* H2 - Section Headers */
    .editor h2 {
      @apply text-2xl font-semibold mt-8 mb-4 leading-snug;
    }

    /* H3 - Subsections */
    .editor h3 {
      @apply text-xl font-medium mt-6 mb-3 leading-snug;
    }

    /* Body Text */
    .editor p, .editor li {
      @apply text-base font-normal leading-7 mb-4;
    }

    /* Lists */
    .editor ul, .editor ol {
      @apply ml-6 mb-4;
    }

    .editor li {
      @apply mb-2;
    }

    /* Code Inline */
    .editor code {
      @apply font-mono text-sm px-1.5 py-0.5 rounded;
    }

    /* Block Code */
    .editor pre {
      @apply bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4 overflow-x-auto;
    }

    .editor pre code {
      @apply p-0;
    }

    /* Blockquote */
    .editor blockquote {
      @apply border-l-4 pl-4 italic my-4;
    }

    /* Focus state */
    .editor:focus {
      @apply outline-none ring-2 ring-indigo-500/20;
    }
  `;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-white min-w-0">
      <style>{typographyStyles}</style>

      {/* Main Editor Canvas */}
      <div
        className={`flex-1 w-full px-12 py-12 transition-colors ${
          darkMode
            ? "bg-slate-950"
            : "bg-white"
        }`}
      >
        {/* Editable Content Area - Full width */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className={`editor min-h-full max-w-4xl mx-auto outline-none transition-all duration-200 rounded-lg focus:ring-1 focus:ring-indigo-500/20 ${
            darkMode
              ? "text-slate-50"
              : "text-slate-600"
          }`}
          onInput={handleInput}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          style={{
            fontSize: "16px",
            fontFamily: "'Inter', system-ui, sans-serif",
            lineHeight: "1.75",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            minHeight: "calc(100vh - 200px)",
          }}
          data-placeholder={placeholder}
        >
          {children}
        </div>

        {/* Status Bar */}
        <div
          className={`mt-12 pt-6 border-t max-w-4xl mx-auto flex gap-6 text-xs ${
            darkMode
              ? "border-slate-800 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          <span>
            {content.length} characters
          </span>
          <span>
            {content
              .split(/\s+/)
              .filter((word) => word.length > 0).length}{" "}
            words
          </span>
          <span className="ml-auto">
            Updated just now
          </span>
        </div>
      </div>

      {/* CSS for empty state placeholder */}
      <style>{`
        .editor[data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: ${darkMode ? "rgb(100, 116, 139)" : "rgb(148, 163, 184)"};
          pointer-events: none;
        }

        /* Typography color adjustments for dark mode */
        ${darkMode ? `
          .editor h1, .editor h2, .editor h3 {
            color: rgb(248, 250, 252);
          }
          .editor p, .editor li {
            color: rgb(203, 213, 225);
          }
          .editor code {
            background-color: rgb(30, 41, 59);
            color: rgb(248, 113, 113);
          }
          .editor blockquote {
            color: rgb(203, 213, 225);
            border-left-color: rgb(100, 116, 139);
          }
        ` : `
          .editor h1, .editor h2, .editor h3 {
            color: rgb(15, 23, 42);
          }
          .editor p, .editor li {
            color: rgb(71, 85, 105);
          }
          .editor code {
            background-color: rgb(241, 245, 249);
            color: rgb(240, 63, 97);
          }
          .editor blockquote {
            color: rgb(51, 65, 85);
            border-left-color: rgb(226, 232, 240);
          }
        `}
      `}</style>
    </div>
  );
}
