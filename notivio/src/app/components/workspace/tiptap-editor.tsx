"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import { all, createLowlight } from "lowlight";
import { Callout } from "./extensions/callout-extension";
import { SlashCommandMenu, type SlashCommandItem } from "./slash-command";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  CodeSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
  Highlighter,
  Palette,
  Info,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react";

const lowlight = createLowlight(all);

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTextSelect?: (text: string) => void;
  placeholder?: string;
}

const HIGHLIGHT_COLORS = [
  { name: "Amber", color: "#facc15", label: "Important" },
  { name: "Mint", color: "#86efac", label: "Definition" },
  { name: "Rose", color: "#f9a8d4", label: "Exam-Likely" },
  { name: "Sky", color: "#7dd3fc", label: "Reference" },
  { name: "Peach", color: "#fdba74", label: "Example" },
  { name: "Lavender", color: "#c4b5fd", label: "Formula" },
];

const TEXT_COLORS = [
  "#1f2937", "#6f5b43", "#b91c1c", "#c2410c", "#92400e",
  "#166534", "#0f766e", "#1d4ed8", "#7c3aed", "#be185d",
  "#0f172a", "#334155", "#525252", "#78350f", "#14532d",
];

const FONT_SIZE_OPTIONS = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
];
const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Classic Serif", value: "Georgia, Cambria, 'Times New Roman', serif" },
  { label: "Modern Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Academic", value: "'Trebuchet MS', Verdana, sans-serif" },
  { label: "Notebook", value: "'Segoe UI', Tahoma, sans-serif" },
  { label: "Code", value: "'Courier New', monospace" },
];
const SYMBOLS = ["•", "→", "⇒", "✓", "★", "∞", "±", "≠", "≤", "≥", "∑", "√", "π", "Ω"];

const TextStyleAttributes = Extension.create({
  name: "textStyleAttributes",
  addGlobalAttributes() {
    const buildStyle = (attributes: Record<string, string | null | undefined>) => {
      const chunks: string[] = [];
      if (attributes.fontSize) chunks.push(`font-size: ${attributes.fontSize}`);
      if (attributes.fontFamily) chunks.push(`font-family: ${attributes.fontFamily}`);
      return chunks.join("; ");
    };

    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              const style = buildStyle(attributes as Record<string, string | null | undefined>);
              if (!style) return {};
              return { style };
            },
          },
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              const style = buildStyle(attributes as Record<string, string | null | undefined>);
              if (!style) return {};
              return { style };
            },
          },
        },
      },
    ];
  },
});

export function TipTapEditor({
  content,
  onChange,
  onTextSelect,
  placeholder = "Start writing your notes...",
}: TipTapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }),
      TextStyle,
      TextStyleAttributes,
      Color,
      Image.configure({ inline: false, allowBase64: true }),
      Callout,
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "/" && !showSlashMenu) {
          setTimeout(() => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const editorEl = document.querySelector(".tiptap-editor-content");
              if (editorEl) {
                const editorRect = editorEl.getBoundingClientRect();
                setSlashMenuPos({
                  top: rect.bottom - editorRect.top + 4,
                  left: rect.left - editorRect.left,
                });
              }
            }
            setSlashFilter("");
            setSelectedSlashIndex(0);
            setShowSlashMenu(true);
          }, 10);
        }
        if (showSlashMenu) {
          if (event.key === "Escape") {
            setShowSlashMenu(false);
            return true;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedSlashIndex((prev) =>
              Math.min(prev + 1, filteredSlashItems.length - 1)
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedSlashIndex((prev) => Math.max(prev - 1, 0));
            return true;
          }
          if (event.key === "Enter" && filteredSlashItems.length > 0) {
            event.preventDefault();
            executeSlashCommand(filteredSlashItems[selectedSlashIndex]);
            return true;
          }
          if (event.key === "Backspace") {
            if (slashFilter === "") {
              setShowSlashMenu(false);
            } else {
              setSlashFilter((prev) => prev.slice(0, -1));
            }
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            setSlashFilter((prev) => prev + event.key);
            setSelectedSlashIndex(0);
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        onTextSelect?.(text);
      } else {
        onTextSelect?.("");
      }
    },
  });

  const slashItems: SlashCommandItem[] = [
    { label: "Heading 1", icon: <Heading1 className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run(), category: "Headings" },
    { label: "Heading 2", icon: <Heading2 className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run(), category: "Headings" },
    { label: "Heading 3", icon: <Heading3 className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run(), category: "Headings" },
    { label: "Heading 4", icon: <Heading4 className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleHeading({ level: 4 }).run(), category: "Headings" },
    { label: "Bullet List", icon: <List className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleBulletList().run(), category: "Lists" },
    { label: "Numbered List", icon: <ListOrdered className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleOrderedList().run(), category: "Lists" },
    { label: "To-do List", icon: <CheckSquare className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleTaskList().run(), category: "Lists" },
    { label: "Blockquote", icon: <Quote className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleBlockquote().run(), category: "Blocks" },
    { label: "Code Block", icon: <CodeSquare className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).toggleCodeBlock().run(), category: "Blocks" },
    { label: "Table", icon: <TableIcon className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), category: "Blocks" },
    { label: "Divider", icon: <Minus className="w-4 h-4" />, command: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).setHorizontalRule().run(), category: "Blocks" },
    { label: "Info Callout", icon: <Info className="w-4 h-4" />, command: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).setCallout({ type: "info" }).run(); }, category: "Callouts" },
    { label: "Warning Callout", icon: <AlertTriangle className="w-4 h-4" />, command: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).setCallout({ type: "warning" }).run(); }, category: "Callouts" },
    { label: "Tip Callout", icon: <Lightbulb className="w-4 h-4" />, command: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).setCallout({ type: "tip" }).run(); }, category: "Callouts" },
    { label: "Definition Callout", icon: <BookOpen className="w-4 h-4" />, command: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).setCallout({ type: "definition" }).run(); }, category: "Callouts" },
    { label: "Image", icon: <ImageIcon className="w-4 h-4" />, command: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1 - slashFilter.length, to: editor.state.selection.from }).run(); fileInputRef.current?.click(); }, category: "Media" },
  ];

  const filteredSlashItems = slashItems.filter((item) =>
    item.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const executeSlashCommand = (item: SlashCommandItem) => {
    item.command();
    setShowSlashMenu(false);
    setSlashFilter("");
  };

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          editor.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    },
    [editor]
  );

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content && !editor.isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-150 hover:bg-[#ede1d1] ${
        active ? "bg-[#e7d6c2] text-[#5d4a34]" : "text-[#8a7559] hover:text-[#5d4a34]"
      }`}
    >
      {children}
    </button>
  );

  const ToolbarSep = () => <div className="w-px h-5 bg-[#ede1d1] mx-1" />;

  return (
    <div className="tiptap-editor-wrapper flex flex-col h-full">
      {/* Toolbar */}
      <div className="tiptap-toolbar flex items-center gap-0.5 gap-y-1 px-3 py-2 bg-[#f8f1e7] border-b border-[#e4d7c8] flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
          <Code className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        <select
          value={editor.getAttributes("textStyle").fontFamily || ""}
          onChange={(event) => {
            const fontFamily = event.target.value;
            if (!fontFamily) {
              editor.chain().focus().setMark("textStyle", { fontFamily: null }).run();
            } else {
              editor.chain().focus().setMark("textStyle", { fontFamily }).run();
            }
          }}
          className="h-8 px-2 rounded-md border border-[#d8c6b2] bg-[#fff8ee] text-[#6f5b43] text-xs outline-none"
          title="Font Style"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <select
          value={editor.getAttributes("textStyle").fontSize || ""}
          onChange={(event) => {
            const size = event.target.value;
            if (!size) {
              editor.chain().focus().setMark("textStyle", { fontSize: null }).run();
            } else {
              editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
            }
          }}
          className="h-8 px-2 rounded-md border border-[#d8c6b2] bg-[#fff8ee] text-[#6f5b43] text-xs outline-none"
          title="Font Size"
        >
          <option value="">Auto</option>
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size.label} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <ToolbarBtn onClick={() => setShowSymbols((prev) => !prev)} title="Insert Symbol">
            <span className="text-xs font-semibold">Ω</span>
          </ToolbarBtn>
          {showSymbols && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#fff8ee] border border-[#d8c6b2] rounded-lg p-2 shadow-xl grid grid-cols-7 gap-1">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  className="w-7 h-7 rounded hover:bg-[#ede1d1] text-[#6f5b43] text-sm"
                  onClick={() => {
                    editor.chain().focus().insertContent(symbol).run();
                    setShowSymbols(false);
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
          )}
        </div>
        <ToolbarSep />

        {/* Highlight picker */}
        <div className="relative">
          <ToolbarBtn onClick={() => setShowHighlightPicker(!showHighlightPicker)} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter className="w-4 h-4" />
          </ToolbarBtn>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#fff8ee] border border-[#d8c6b2] rounded-lg p-2 shadow-xl flex gap-1.5">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.color}
                  title={h.label}
                  className="w-6 h-6 rounded-md border border-[#d8c6b2] hover:scale-110 transition-transform"
                  style={{ backgroundColor: h.color }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: h.color }).run();
                    setShowHighlightPicker(false);
                  }}
                />
              ))}
              <button
                title="Remove highlight"
                className="w-6 h-6 rounded-md border border-[#d8c6b2] bg-transparent hover:bg-[#ede1d1] flex items-center justify-center text-[#8a7559] text-xs"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPicker(false);
                }}
              >
                x
              </button>
            </div>
          )}
        </div>

        {/* Text color */}
        <div className="relative">
          <ToolbarBtn onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color">
            <Palette className="w-4 h-4" />
          </ToolbarBtn>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#fff8ee] border border-[#d8c6b2] rounded-lg p-2 shadow-xl grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-md border border-[#d8c6b2] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist">
          <CheckSquare className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <CodeSquare className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        {/* Table controls */}
        <div className="relative">
          <ToolbarBtn onClick={() => setShowTableMenu(!showTableMenu)} active={editor.isActive("table")} title="Table">
            <TableIcon className="w-4 h-4" />
          </ToolbarBtn>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#fff8ee] border border-[#d8c6b2] rounded-lg p-1 shadow-xl min-w-[180px]">
              {!editor.isActive("table") ? (
                <button
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-[#7b664d] hover:bg-[#ede1d1] rounded flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Insert 3x3 Table
                </button>
              ) : (
                <>
                  <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[#7b664d] hover:bg-[#ede1d1] rounded">Add Column</button>
                  <button onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[#7b664d] hover:bg-[#ede1d1] rounded">Add Row</button>
                  <button onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-400/70 hover:bg-[#ede1d1] rounded">Delete Column</button>
                  <button onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-400/70 hover:bg-[#ede1d1] rounded">Delete Row</button>
                  <button onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-400/70 hover:bg-[#ede1d1] rounded flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete Table</button>
                </>
              )}
            </div>
          )}
        </div>

        <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* Bubble Menu for inline formatting on selection */}
      {editor && (
        <BubbleMenu editor={editor} className="bubble-menu bg-[#fff8ee] border border-[#d8c6b2] rounded-lg shadow-xl flex items-center gap-0.5 px-1.5 py-1">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-[#ede1d1] mx-0.5" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code">
            <Code className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </BubbleMenu>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto relative" onClick={() => { setShowColorPicker(false); setShowHighlightPicker(false); setShowTableMenu(false); setShowSymbols(false); }}>
        <EditorContent editor={editor} className="min-h-full" />

        {/* Slash command menu */}
        {showSlashMenu && filteredSlashItems.length > 0 && (
          <SlashCommandMenu
            items={filteredSlashItems}
            selectedIndex={selectedSlashIndex}
            filter={slashFilter}
            position={slashMenuPos}
            onSelect={executeSlashCommand}
            onHover={setSelectedSlashIndex}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}


