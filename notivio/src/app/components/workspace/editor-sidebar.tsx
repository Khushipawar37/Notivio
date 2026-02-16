"use client";

import React, { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Zap,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from "../ui/badge";

interface EditorSidebarProps {
  content: string;
  onContentChange: (content: string) => void;
  selectedText: string;
  selectedFormat: any;
  onFormatChange: (format: any) => void;
  onTextSelect: (text: string) => void;
  darkMode?: boolean;
}

interface FormatGroup {
  name: string;
  buttons: FormatButton[];
}

interface FormatButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
  action: () => void;
}

export function EditorSidebar({
  content,
  onContentChange,
  selectedText,
  selectedFormat,
  onFormatChange,
  onTextSelect,
  darkMode = false,
}: EditorSidebarProps) {
  const [fontSize, setFontSize] = useState("base");
  const [fontFamily, setFontFamily] = useState("inter");
  const [textColor, setTextColor] = useState("#000000");
  const [searchQuery, setSearchQuery] = useState("");

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const formatGroups: FormatGroup[] = [
    {
      name: "Text Styling",
      buttons: [
        {
          id: "bold",
          label: "B",
          icon: <Bold className="h-4 w-4" />,
          tooltip: "Bold (Cmd+B)",
          shortcut: "Cmd+B",
          action: () => executeCommand("bold"),
        },
        {
          id: "italic",
          label: "I",
          icon: <Italic className="h-4 w-4" />,
          tooltip: "Italic (Cmd+I)",
          shortcut: "Cmd+I",
          action: () => executeCommand("italic"),
        },
        {
          id: "underline",
          label: "U",
          icon: <Underline className="h-4 w-4" />,
          tooltip: "Underline (Cmd+U)",
          shortcut: "Cmd+U",
          action: () => executeCommand("underline"),
        },
        {
          id: "strikethrough",
          label: "S",
          icon: <Strikethrough className="h-4 w-4" />,
          tooltip: "Strikethrough",
          action: () => executeCommand("strikethrough"),
        },
      ],
    },
    {
      name: "Headings & Structure",
      buttons: [
        {
          id: "h1",
          label: "H1",
          icon: <Heading1 className="h-4 w-4" />,
          tooltip: "Heading 1",
          action: () => executeCommand("formatBlock", "<h1>"),
        },
        {
          id: "h2",
          label: "H2",
          icon: <Heading2 className="h-4 w-4" />,
          tooltip: "Heading 2",
          action: () => executeCommand("formatBlock", "<h2>"),
        },
        {
          id: "h3",
          label: "H3",
          icon: <Heading3 className="h-4 w-4" />,
          tooltip: "Heading 3",
          action: () => executeCommand("formatBlock", "<h3>"),
        },
        {
          id: "bullet",
          label: "•",
          icon: <List className="h-4 w-4" />,
          tooltip: "Bullet List",
          action: () => executeCommand("insertUnorderedList"),
        },
        {
          id: "numbered",
          label: "1.",
          icon: <ListOrdered className="h-4 w-4" />,
          tooltip: "Numbered List",
          action: () => executeCommand("insertOrderedList"),
        },
        {
          id: "quote",
          label: "\"",
          icon: <Quote className="h-4 w-4" />,
          tooltip: "Quote Block",
          action: () => executeCommand("formatBlock", "<blockquote>"),
        },
      ],
    },
    {
      name: "Alignment",
      buttons: [
        {
          id: "left",
          label: "Left",
          icon: <AlignLeft className="h-4 w-4" />,
          tooltip: "Align Left",
          action: () => executeCommand("justifyLeft"),
        },
        {
          id: "center",
          label: "Center",
          icon: <AlignCenter className="h-4 w-4" />,
          tooltip: "Align Center",
          action: () => executeCommand("justifyCenter"),
        },
        {
          id: "right",
          label: "Right",
          icon: <AlignRight className="h-4 w-4" />,
          tooltip: "Align Right",
          action: () => executeCommand("justifyRight"),
        },
      ],
    },
  ];

  return (
    <div
      className={`w-70 border-r flex flex-col overflow-y-auto transition-colors ${
        darkMode
          ? "bg-slate-900/50 border-slate-800 backdrop-blur-sm"
          : "bg-slate-50 border-slate-200 backdrop-blur-sm"
      }`}
    >
      {/* SEARCH SECTION */}
      <div className={`p-4 border-b ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
        <div className="relative">
          <Search className={`absolute left-2 top-2.5 h-4 w-4 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-8 h-9 text-sm ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-50"
                : "bg-white border-slate-200"
            }`}
          />
        </div>
      </div>

      {/* FORMAT TOOLBAR GROUPS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {formatGroups.map((group) => (
          <div key={group.name}>
            <div className={`text-xs font-semibold mb-2 px-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {group.name}
            </div>
            <div
              className={`grid grid-cols-3 gap-1.5 p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-800/50"
                  : "bg-slate-100/50"
              }`}
            >
              <TooltipProvider>
                {group.buttons.map((button) => (
                  <Tooltip key={button.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={button.action}
                        className={`h-8 w-8 p-0 transition-all duration-150 ${
                          darkMode
                            ? "text-slate-200 hover:bg-slate-700"
                            : "text-slate-700 hover:bg-slate-200/50"
                        }`}
                      >
                        {button.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {button.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        ))}

        {/* TEXT PROPERTIES */}
        <div>
          <div className={`text-xs font-semibold mb-2 px-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Text Properties
          </div>
          <div className={`space-y-3 p-2 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-slate-100/50"}`}>
            {/* Font Family */}
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className={`h-9 text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`}>
                <SelectValue placeholder="Font" />
              </SelectTrigger>
              <SelectContent className={darkMode ? "bg-slate-800 border-slate-700" : ""}>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="mono">Mono</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            {/* Font Size */}
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className={`h-9 text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`}>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className={darkMode ? "bg-slate-800 border-slate-700" : ""}>
                <SelectItem value="sm">Small (14px)</SelectItem>
                <SelectItem value="base">Normal (16px)</SelectItem>
                <SelectItem value="lg">Large (18px)</SelectItem>
                <SelectItem value="xl">XL (20px)</SelectItem>
              </SelectContent>
            </Select>

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full h-9 justify-start text-sm ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-slate-50"
                      : ""
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded mr-2"
                    style={{ backgroundColor: textColor }}
                  />
                  Color
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="grid grid-cols-6 gap-2">
                  {[
                    "#000000",
                    "#DC2626",
                    "#2563EB",
                    "#16A34A",
                    "#CA8A04",
                    "#7C3AED",
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-slate-200"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setTextColor(color);
                        executeCommand("foreColor", color);
                      }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* DIVIDER */}
        <Separator className={darkMode ? "bg-slate-800" : "bg-slate-200"} />

        {/* INSERT ELEMENTS */}
        <div>
          <div className={`text-xs font-semibold mb-2 px-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Insert Elements
          </div>
          <div className={`space-y-2 ${darkMode ? "bg-slate-800/50" : "bg-slate-100/50"} p-2 rounded-lg`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full justify-start text-sm ${
                      darkMode
                        ? "bg-slate-700 border-slate-600 text-slate-50 hover:bg-slate-600"
                        : ""
                    }`}
                  >
                    <Zap className="h-4 w-4 mr-2 text-indigo-600" />
                    <span className="flex-1 text-left">AI Concept</span>
                    <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-300">
                      AI
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Add an AI-powered concept explanation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="sm"
              className={`w-full justify-start text-sm ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-50 hover:bg-slate-600"
                  : ""
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Code Block
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`w-full justify-start text-sm ${
                darkMode
                  ? "bg-slate-700 border-slate-600 text-slate-50 hover:bg-slate-600"
                  : ""
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
