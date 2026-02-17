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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ColorPicker } from "./color-picker";
import { DrawingCanvas } from "./drawing-canvas";
import { ChartBuilder } from "./chart-builder";
import { FlowchartBuilder } from "./flowchart-builder";
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

        {/* INSERT & ADVANCED CONTROLS */}
        <div>
          <div className={`text-xs font-semibold mb-2 px-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Editor Controls
          </div>

          <div className={`space-y-3 p-2 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-slate-100/50"}`}>
            {/* Headings */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-full justify-center text-sm" onClick={() => executeCommand("formatBlock", "<h1>")}>H1</Button>
              <Button variant="ghost" size="sm" className="h-9 w-full justify-center text-sm" onClick={() => executeCommand("formatBlock", "<h2>")}>H2</Button>
              <Button variant="ghost" size="sm" className="h-9 w-full justify-center text-sm" onClick={() => executeCommand("formatBlock", "<h3>")}>H3</Button>
            </div>

            {/* Lists & Align */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("insertUnorderedList")}><List className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("formatBlock", "<blockquote>")}><Quote className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("justifyLeft")}><AlignLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("justifyCenter")}><AlignCenter className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("justifyRight")}><AlignRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => executeCommand("justifyFull")}><AlignCenter className="h-4 w-4 rotate-90" /></Button>
            </div>

            {/* Color pickers */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex-1 justify-start text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`}>
                    <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: textColor }} />
                    Text Color
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <ColorPicker color={textColor} onChange={(c) => { setTextColor(c); executeCommand("foreColor", c); }} label="Text Color" />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`flex-1 justify-start text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`}>
                    <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: "#ffffff" }} />
                    Background
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <ColorPicker color={"#ffffff"} onChange={(c) => { executeCommand("backColor", c); }} label="Background Color" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Inserts */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className={`w-full justify-start text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`} onClick={() => { const url = prompt('Enter URL:'); if (url) executeCommand('createLink', url); }}>
                <Plus className="h-4 w-4 mr-2" /> Insert Link
              </Button>

              <Button variant="outline" size="sm" className={`w-full justify-start text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`} onClick={() => { document.querySelector<HTMLInputElement>('input[type=file].sidebar-image')?.click(); }}>
                <Plus className="h-4 w-4 mr-2" /> Insert Image
              </Button>

              <input type="file" accept="image/*" className="hidden sidebar-image" onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const res = ev.target?.result as string;
                    document.execCommand('insertHTML', false, `<img src="${res}" style="max-width:100%; margin:8px 0;"/>`);
                    onContentChange(document.querySelector('.editor')?.innerHTML || '');
                  };
                  reader.readAsDataURL(file);
                }
              }} />

              <Button variant="outline" size="sm" className={`w-full justify-start text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-50" : ""}`} onClick={() => { const rows = prompt('Rows'); const cols = prompt('Cols'); if (rows && cols) { let table = '<table style="width:100%; border-collapse:collapse; margin:8px 0;">'; for (let r=0;r<parseInt(rows);r++){ table += '<tr>'; for (let c=0;c<parseInt(cols);c++){ table += `<td style="border:1px solid #e2e8f0;padding:8px">${r===0? 'Header': '&nbsp;'}</td>` } table += '</tr>'; } table += '</table><br/>'; document.execCommand('insertHTML', false, table); onContentChange(document.querySelector('.editor')?.innerHTML || ''); } }}>
                <Plus className="h-4 w-4 mr-2" /> Insert Table
              </Button>
            </div>

            {/* Shapes & Advanced */}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => document.execCommand('insertHTML', false, '<div style="width:80px;height:80px;background:#8a7559;display:inline-block;margin:6px"></div>')}><svg className="h-4 w-4" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /></svg></Button>
              <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => document.execCommand('insertHTML', false, '<div style="width:80px;height:80px;background:#8a7559;border-radius:50%;display:inline-block;margin:6px"></div>')}><svg className="h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg></Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9"><Plus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Advanced Inserts</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => { document.execCommand('insertHTML', false, '<blockquote style="border-left:4px solid #e2e8f0;padding-left:12px">Blockquote</blockquote>'); onContentChange(document.querySelector('.editor')?.innerHTML || ''); }}>Insert Callout</Button>
                    <Button variant="outline" onClick={() => { document.execCommand('insertHTML', false, '<pre><code>Code block</code></pre>'); onContentChange(document.querySelector('.editor')?.innerHTML || ''); }}>Insert Code</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Drawing / Charts / Flowcharts */}
            <div className="flex flex-col gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start"> <Plus className="h-4 w-4 mr-2" />Drawing Canvas</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Drawing Canvas</DialogTitle></DialogHeader>
                  <DrawingCanvas onSave={(d) => { document.execCommand('insertHTML', false, `<img src="${d}" style="max-width:100%"/>`); onContentChange(document.querySelector('.editor')?.innerHTML || ''); }} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start"> <Plus className="h-4 w-4 mr-2" />Chart Builder</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Chart Builder</DialogTitle></DialogHeader>
                  <ChartBuilder onInsert={(h) => { document.execCommand('insertHTML', false, h); onContentChange(document.querySelector('.editor')?.innerHTML || ''); }} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start"> <Plus className="h-4 w-4 mr-2" />Flowchart Builder</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Flowchart Builder</DialogTitle></DialogHeader>
                  <FlowchartBuilder onInsert={(h) => { document.execCommand('insertHTML', false, h); onContentChange(document.querySelector('.editor')?.innerHTML || ''); }} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => executeCommand('undo')}><svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.86 0 7 3.14 7 7 0 1.38-.38 2.67-1.04 3.77L19 18c.62-1.03 1-2.22 1-3.5 0-4.97-4.03-9-9-9z"/></svg></Button>
              <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => executeCommand('redo')}><svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M12 5v4l5-5-5-5v4C8.14 3 5 6.14 5 10c0 1.38.38 2.67 1.04 3.77L5 14c-.62-1.03-1-2.22-1-3.5 0-4.97 4.03-9 9-9z"/></svg></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorSidebar;
