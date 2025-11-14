"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { useNotes } from "./note-context";
import { useToast } from "../../components/ui/use-toast";
import { FileText, Video, Music } from "lucide-react";

interface EditNoteDialogProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  darkMode: boolean;
}

// Default colors for notes
const NOTE_COLORS = ["#c6ac8f", "#8a7559", "#d8c0a5"];

export default function EditNoteDialog({
  noteId,
  open,
  onOpenChange,
  darkMode,
}: EditNoteDialogProps) {
  const { notes, updateNote, folders, tags } = useNotes();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<
    "document" | "video" | "audio"
  >("document");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  // Load note data when dialog opens
  useEffect(() => {
    if (open && noteId) {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedFolder(note.folder);
        setSelectedTags(note.tags);
        setSelectedType(note.type);
        setSelectedColor(note.color);
      }
    }
  }, [open, noteId, notes]);

  // Handle tag toggle
  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Handle note update
  const handleUpdateNote = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    updateNote(noteId, {
      title: title.trim(),
      content: content.trim(),
      excerpt:
        content.trim().substring(0, 150) + (content.length > 150 ? "..." : ""),
      tags: selectedTags,
      folder: selectedFolder,
      color: selectedColor,
      type: selectedType,
    });

    toast({
      title: "Note updated",
      description: "Your note has been updated successfully.",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[600px] ${
          darkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className={`w-full p-2 rounded border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={6}
              className={`w-full p-2 rounded border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Note Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedType("document")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  selectedType === "document"
                    ? darkMode
                      ? "bg-[#8a7559] text-white"
                      : "bg-[#c6ac8f] text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Document</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("video")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  selectedType === "video"
                    ? darkMode
                      ? "bg-[#8a7559] text-white"
                      : "bg-[#c6ac8f] text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType("audio")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  selectedType === "audio"
                    ? darkMode
                      ? "bg-[#8a7559] text-white"
                      : "bg-[#c6ac8f] text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Music className="h-4 w-4" />
                <span>Audio</span>
              </button>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${
                    selectedColor === color ? "ring-2 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-medium mb-1">Folder</label>
            <select
              value={selectedFolder || ""}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
              className={`w-full p-2 rounded border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-2 py-1 text-sm rounded-full ${
                    selectedTags.includes(tag.name)
                      ? darkMode
                        ? "bg-[#8a7559] text-white"
                        : "bg-[#c6ac8f] text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No tags available. Create tags in the sidebar.
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className={`${
                darkMode
                  ? "bg-[#8a7559] hover:bg-[#8a7559]/90"
                  : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"
              } text-white`}
              onClick={handleUpdateNote}
            >
              Update Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
