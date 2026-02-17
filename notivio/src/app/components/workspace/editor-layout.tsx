"use client";

import React, { useState, ReactNode } from "react";
import { EditorTopBar } from "./editor-top-bar";
import { EditorSidebar } from "./editor-sidebar";
import { EditorCanvas } from "./editor-canvas";
import { AdvancedRichTextEditor } from "./advanced-rich-text-editor";
import { AIPanelContainer } from "./ai-panel-container";

interface EditorLayoutProps {
  noteTitle: string;
  onTitleChange: (title: string) => void;
  children?: ReactNode;
  content: string;
  onContentChange: (content: string) => void;
  selectedText: string;
  onTextSelect: (text: string) => void;
  onAIResponse?: (response: string) => void;
  darkMode?: boolean;
}

export function EditorLayout({
  noteTitle,
  onTitleChange,
  children,
  content,
  onContentChange,
  selectedText,
  onTextSelect,
  onAIResponse,
  darkMode = false,
}: EditorLayoutProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: "base",
    fontFamily: "inter",
    textColor: "#000000",
  });

  return (
    <div
      className={`flex flex-col w-screen h-screen overflow-hidden ${
        darkMode ? "dark bg-slate-950" : "bg-white"
      }`}
    >
      {/* Top Navigation Bar */}
      <EditorTopBar
        noteTitle={noteTitle}
        onTitleChange={onTitleChange}
        onAIPanelToggle={() => setAiPanelOpen(!aiPanelOpen)}
        aiPanelOpen={aiPanelOpen}
        darkMode={darkMode}
      />

      {/* Main Content Area with Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0 pt-16">
        {/* Left Sidebar */}
        <EditorSidebar
          content={content}
          onContentChange={onContentChange}
          selectedText={selectedText}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          onTextSelect={onTextSelect}
          darkMode={darkMode}
        />

        {/* Center Canvas - Full remaining space (Advanced Editor) */}
        <div className="flex-1 min-w-0">
          <AdvancedRichTextEditor
            content={content}
            onChange={onContentChange}
            onTextSelect={onTextSelect}
            placeholder="Start writing your notes..."
            className="h-full"
          />
        </div>

        {/* Right AI Panel */}
        <AIPanelContainer
          isOpen={aiPanelOpen}
          onToggle={() => setAiPanelOpen(!aiPanelOpen)}
          selectedText={selectedText}
          content={content}
          onContentUpdate={onContentChange}
          onAIResponse={onAIResponse}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
