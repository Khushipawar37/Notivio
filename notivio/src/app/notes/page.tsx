"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Download, PenTool, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { AdvancedRichTextEditor } from "../components/workspace/advanced-rich-text-editor";
import { AIAssistantPanel } from "../components/workspace/ai-assistant-panel";

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
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "1",
    title: "Untitled Note",
    content: "",
    flashcards: [],
    created: new Date(),
    modified: new Date(),
  });

  const saveNote = () => {
    const updatedNote = {
      ...currentNote,
      content,
      modified: new Date(),
    };
    setCurrentNote(updatedNote);
    console.log("Note saved:", updatedNote);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setCurrentNote((prev) => ({ ...prev, modified: new Date() }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <PenTool className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Notivio Smart Editor
                </h1>
                <p className="text-muted-foreground">
                  Complete note-taking solution with AI assistance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={saveNote}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Last modified: {currentNote.modified.toLocaleString()}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{content.length} characters</span>
            <Separator orientation="vertical" className="h-4" />
            <span>
              {content.split(/\s+/).filter((word) => word.length > 0).length}{" "}
              words
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={currentNote.title}
                    onChange={(e) =>
                      setCurrentNote((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                    placeholder="Enter note title..."
                  />
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Enhanced
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <AdvancedRichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  onTextSelect={setSelectedText}
                  placeholder="Start creating your comprehensive notes... Use the toolbar for rich formatting, insert tables, drawings, charts, and more!"
                />
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Sidebar */}
          <div className="lg:col-span-1">
            <AIAssistantPanel
              content={content}
              selectedText={selectedText}
              onContentUpdate={handleContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
