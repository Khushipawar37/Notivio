"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  ImageIcon,
  Table,
  Undo,
  Redo,
  Palette,
  Video,
  BarChart3,
  Pencil,
  Square,
  Circle,
  Triangle,
  FileBarChart as FlowChart,
  Code,
  Quote,
  Minus,
} from "lucide-react";
import { DrawingCanvas } from "./drawing-canvas";
import { ChartBuilder } from "./chart-builder";
import { FlowchartBuilder } from "./flowchart-builder";
import { ColorPicker } from "./color-picker";

interface AdvancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTextSelect?: (selectedText: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdvancedRichTextEditor({
  content,
  onChange,
  onTextSelect,
  placeholder = "Start writing...",
  className = "",
}: AdvancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [currentFontSize, setCurrentFontSize] = useState("16");
  const [currentFontFamily, setCurrentFontFamily] = useState("Inter");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("#ffffff");
  const [showColorPicker, setShowColorPicker] = useState<"text" | "bg" | null>(null);
  const [showDrawingDialog, setShowDrawingDialog] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showFlowchartDialog, setShowFlowchartDialog] = useState(false);

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      setSelectedText(text);
      onTextSelect?.(text);
    } else {
      setSelectedText("");
      onTextSelect?.("");
    }
  }, [onTextSelect]);

  const insertHeading = (level: number) => {
    executeCommand("formatBlock", `h${level}`);
  };

  const insertList = (ordered = false) => {
    executeCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
  };

  const setAlignment = (alignment: "left" | "center" | "right" | "justify") => {
    const commands = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
      justify: "justifyFull",
    };
    executeCommand(commands[alignment]);
  };

  const changeFontSize = (size: string) => {
    setCurrentFontSize(size);
    // Use HTML span with style instead of deprecated fontSize command
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString()) {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      const range = selection.getRangeAt(0);
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      onChange(editorRef.current?.innerHTML || "");
    }
  };

  const changeFontFamily = (family: string) => {
    setCurrentFontFamily(family);
    executeCommand("fontName", family);
  };

  const changeTextColor = (color: string) => {
    setCurrentTextColor(color);
    executeCommand("foreColor", color);
    setShowColorPicker(null);
  };

  const changeBackgroundColor = (color: string) => {
    setCurrentBgColor(color);
    executeCommand("backColor", color);
    setShowColorPicker(null);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const insertImage = () => {
    fileInputRef.current?.click();
  };

  const insertVideo = () => {
    videoInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (file.type.startsWith("image/")) {
          executeCommand(
            "insertHTML",
            `<img src="${result}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Uploaded image" />`
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        executeCommand(
          "insertHTML",
          `<video controls style="max-width: 100%; margin: 10px 0;"><source src="${result}" type="${file.type}">Your browser does not support the video tag.</video>`
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const insertTable = () => {
    const rows = prompt("Number of rows:");
    const cols = prompt("Number of columns:");
    if (rows && cols) {
      let tableHTML =
        '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 2px solid #8a7559;">';
      for (let i = 0; i < Number.parseInt(rows); i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < Number.parseInt(cols); j++) {
          tableHTML += `<td style="padding: 12px; border: 1px solid #d9c6b8; background: ${
            i === 0 ? "#f5f0e8" : "#ffffff"
          }; ${i === 0 ? "font-weight: bold;" : ""}">${
            i === 0 ? `Header ${j + 1}` : "&nbsp;"
          }</td>`;
        }
        tableHTML += "</tr>";
      }
      tableHTML += "</table><br>";
      executeCommand("insertHTML", tableHTML);
    }
  };

  const insertShape = (shape: string) => {
    const shapes = {
      square:
        '<div style="width: 100px; height: 100px; background: #8a7559; margin: 10px; display: inline-block;"></div>',
      circle:
        '<div style="width: 100px; height: 100px; background: #8a7559; border-radius: 50%; margin: 10px; display: inline-block;"></div>',
      triangle:
        '<div style="width: 0; height: 0; border-left: 50px solid transparent; border-right: 50px solid transparent; border-bottom: 100px solid #8a7559; margin: 10px; display: inline-block;"></div>',
    };
    executeCommand("insertHTML", shapes[shape as keyof typeof shapes]);
  };

  const insertDrawing = (drawingData: string) => {
    executeCommand(
      "insertHTML",
      `<img src="${drawingData}" style="max-width: 100%; margin: 10px 0;" alt="Hand drawing" />`
    );
    setShowDrawingDialog(false);
  };

  const insertChart = (chartHTML: string) => {
    executeCommand("insertHTML", chartHTML);
    setShowChartDialog(false);
  };

  const insertFlowchart = (flowchartHTML: string) => {
    executeCommand("insertHTML", flowchartHTML);
    setShowFlowchartDialog(false);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div className={`flex flex-col h-full border rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Premium Toolbar - Multi-row */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <TooltipProvider>
          {/* First Row: Font Controls */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-200 flex-wrap">
            <Select value={currentFontFamily} onValueChange={changeFontFamily}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currentFontSize} onValueChange={changeFontSize}>
              <SelectTrigger className="w-20 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="14">14</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="18">18</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="28">28</SelectItem>
                <SelectItem value="32">32</SelectItem>
                <SelectItem value="36">36</SelectItem>
                <SelectItem value="42">42</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting Buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("bold")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("italic")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("underline")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline (Ctrl+U)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("strikeThrough")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Color Pickers */}
            <Popover open={showColorPicker === "text"} onOpenChange={(open) => setShowColorPicker(open ? "text" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-slate-200 relative"
                  title="Text Color"
                >
                  <Palette className="h-4 w-4" />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-gray-400"
                    style={{ backgroundColor: currentTextColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <ColorPicker
                  color={currentTextColor}
                  onChange={changeTextColor}
                  label="Text Color"
                />
              </PopoverContent>
            </Popover>

            <Popover open={showColorPicker === "bg"} onOpenChange={(open) => setShowColorPicker(open ? "bg" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-slate-200 relative"
                  title="Background Color"
                >
                  <div className="h-4 w-4 border border-gray-400 rounded" style={{ backgroundColor: currentBgColor }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <ColorPicker
                  color={currentBgColor}
                  onChange={changeBackgroundColor}
                  label="Background Color"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Second Row: Structure & Formatting */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-200 flex-wrap">
            {/* Headings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(1)}
                  className="h-9 px-2 hover:bg-slate-200 text-xs"
                >
                  <Heading1 className="h-4 w-4 mr-1" /> H1
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 1</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(2)}
                  className="h-9 px-2 hover:bg-slate-200 text-xs"
                >
                  <Heading2 className="h-4 w-4 mr-1" /> H2
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 2</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(3)}
                  className="h-9 px-2 hover:bg-slate-200 text-xs"
                >
                  <Heading3 className="h-4 w-4 mr-1" /> H3
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertList(false)}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertList(true)}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("formatBlock", "blockquote")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quote</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("formatBlock", "pre")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Block</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alignment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment("left")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment("center")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment("right")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment("justify")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justify</TooltipContent>
            </Tooltip>
          </div>

          {/* Third Row: Insert Elements & Advanced Features */}
          <div className="flex items-center gap-2 p-3 flex-wrap">
            {/* Insert Elements */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertLink}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertImage}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertVideo}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertTable}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Table</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Shapes */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertShape("square")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Square</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertShape("circle")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Circle</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertShape("triangle")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Triangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Triangle</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Advanced Features */}
            <Dialog open={showDrawingDialog} onOpenChange={setShowDrawingDialog}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-slate-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Drawing Canvas</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Drawing Canvas</DialogTitle>
                </DialogHeader>
                <DrawingCanvas onSave={insertDrawing} />
              </DialogContent>
            </Dialog>

            <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-slate-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chart Builder</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Chart Builder</DialogTitle>
                </DialogHeader>
                <ChartBuilder onInsert={insertChart} />
              </DialogContent>
            </Dialog>

            <Dialog open={showFlowchartDialog} onOpenChange={setShowFlowchartDialog}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-slate-200"
                    >
                      <FlowChart className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Flowchart Builder</TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Flowchart Builder</DialogTitle>
                </DialogHeader>
                <FlowchartBuilder onInsert={insertFlowchart} />
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("undo")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("redo")}
                  className="h-9 w-9 p-0 hover:bg-slate-200"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        className="flex-1 overflow-y-auto p-8 focus:outline-none prose prose-sm max-w-none text-base"
        style={{
          lineHeight: "1.8",
          fontSize: "16px",
          fontFamily: "Inter, system-ui, sans-serif",
          minHeight: "600px",
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        className="hidden"
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-size: 16px;
        }

        [contenteditable] {
          word-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
        }

        /* Link styling */
        [contenteditable] a {
          color: #0066cc;
          text-decoration: underline;
          cursor: pointer;
        }

        [contenteditable] a:hover {
          color: #0052a3;
        }

        /* Code styling */
        [contenteditable] code {
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          color: #c7254e;
        }

        /* Blockquote styling */
        [contenteditable] blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 16px;
          margin-left: 0;
          color: #475569;
          font-style: italic;
        }

        /* List styling */
        [contenteditable] ul, [contenteditable] ol {
          margin-left: 24px;
        }

        [contenteditable] li {
          margin-bottom: 8px;
        }

        /* Table styling */
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }

        [contenteditable] table td,
        [contenteditable] table th {
          border: 1px solid #e2e8f0;
          padding: 12px;
        }

        [contenteditable] table th {
          background-color: #f1f5f9;
          font-weight: 600;
        }

        /* Heading styling */
        [contenteditable] h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        [contenteditable] h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        [contenteditable] h3 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
