"use client";

import { useState, useEffect } from "react";
import { EditorLayout } from "../components/workspace/editor-layout";

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  flashcards: Array<{
    id: string;
    question: string;
    answer: string;
    created: Date;
  }>;
  created: Date;
  modified: Date;
}

export default function NotivioEditor() {
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "1",
    title: "Untitled Note",
    content: "",
    flashcards: [],
    created: new Date(),
    modified: new Date(),
  });

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("notivio-dark-mode");
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true");
    }
  }, []);

  const handleTitleChange = (title: string) => {
    setCurrentNote((prev) => ({ ...prev, title }));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setCurrentNote((prev) => ({ ...prev, modified: new Date() }));
  };

  const handleTextSelect = (text: string) => {
    setSelectedText(text);
  };

  return (
    <EditorLayout
      noteTitle={currentNote.title}
      onTitleChange={handleTitleChange}
      content={content}
      onContentChange={handleContentChange}
      selectedText={selectedText}
      onTextSelect={handleTextSelect}
      darkMode={darkMode}
    />
  );
}
