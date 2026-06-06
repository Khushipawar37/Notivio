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
} from "lucide-react";
import { DrawingCanvas } from "./drawing-canvas";
import { ChartBuilder } from "./chart-builder";
import { FlowchartBuilder } from "./flowchart-builder";

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
  const [currentFontSize, setCurrentFontSize] = useState("14");
  const [currentFontFamily, setCurrentFontFamily] = useState("Arial");
  const [showColorPicker, setShowColorPicker] = useState(false);
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
    executeCommand("fontSize", "7");
    // Apply custom font size via CSS
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      try {
        range.surroundContents(span);
      } catch (e) {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
    }
  };

  const changeFontFamily = (family: string) => {
    setCurrentFontFamily(family);
    executeCommand("fontName", family);
  };

  const changeTextColor = (color: string) => {
    executeCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const changeBackgroundColor = (color: string) => {
    executeCommand("backColor", color);
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

  const colors = [
    "#000000",
    "#8a7559",
    "#a68b5b",
    "#d9c6b8",
    "#f5f0e8",
    "#e53e3e",
    "#38a169",
    "#3182ce",
    "#805ad5",
    "#d69e2e",
    "#ed8936",
    "#e53e3e",
    "#38b2ac",
    "#4299e1",
    "#9f7aea",
  ];

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Advanced Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/20">
        <TooltipProvider>
          {/* Font Controls */}
          <div className="flex items-center space-x-2 mr-3">
            <Select value={currentFontFamily} onValueChange={changeFontFamily}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Courier New">Courier</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currentFontSize} onValueChange={changeFontSize}>
              <SelectTrigger className="w-16 h-8">
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
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("bold")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("italic")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("underline")}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("strikeThrough")}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Color Controls */}
          <div className="flex items-center space-x-1">
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <Label>Text Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                        style={{ backgroundColor: color }}
                        onClick={() => changeTextColor(color)}
                      />
                    ))}
                  </div>
                  <Label>Background Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={`bg-${color}`}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                        style={{ backgroundColor: color }}
                        onClick={() => changeBackgroundColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertHeading(1)}
                >
                  <Heading1 className="h-4 w-4" />
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
                >
                  <Heading2 className="h-4 w-4" />
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
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlignment("left")}
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
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justify</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertList(false)}
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
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Insert Elements */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={insertLink}>
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={insertImage}>
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={insertVideo}>
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={insertTable}>
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Table</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Shapes */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertShape("square")}
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
                >
                  <Triangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Triangle</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Advanced Features */}
          <div className="flex items-center space-x-1">
            <Dialog
              open={showDrawingDialog}
              onOpenChange={setShowDrawingDialog}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
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
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Chart Builder</DialogTitle>
                </DialogHeader>
                <ChartBuilder onInsert={insertChart} />
              </DialogContent>
            </Dialog>

            <Dialog
              open={showFlowchartDialog}
              onOpenChange={setShowFlowchartDialog}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FlowChart className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Flowchart Builder</DialogTitle>
                </DialogHeader>
                <FlowchartBuilder onInsert={insertFlowchart} />
              </DialogContent>
            </Dialog>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("undo")}
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
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        className="min-h-[600px] p-6 focus:outline-none prose prose-sm max-w-none"
        style={{
          minHeight: "600px",
          lineHeight: "1.6",
          fontSize: "14px",
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
        }
      `}</style>
    </div>
  );
}
