"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Star,
  Clock,
  Download,
  Trash,
  Edit,
  BookOpen,
  FileText,
  Video,
  Music,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useNotes, type Note } from "./note-context";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "../../components/ui/use-toast";
import EditNoteDialog from "./edit-note";

interface NotesGridProps {
  darkMode: boolean;
  searchQuery: string;
  activeCategory: string;
}

export default function NotesGrid({
  darkMode,
  searchQuery,
  activeCategory,
}: NotesGridProps) {
  const { notes, folders, tags, toggleStarred, deleteNote, logActivity } =
    useNotes();
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter notes based on search query and active category
  useEffect(() => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply category filter
    if (activeCategory !== "All Notes") {
      if (activeCategory === "Starred") {
        filtered = filtered.filter((note) => note.starred);
      } else if (activeCategory === "Recent") {
        // Sort by last modified date
        filtered = [...filtered]
          .sort(
            (a, b) =>
              new Date(b.lastModified).getTime() -
              new Date(a.lastModified).getTime()
          )
          .slice(0, 10); // Show only 10 most recent
      } else if (activeCategory === "Trash") {
        // In a real app, you'd have a "deleted" flag or a separate trash collection
        filtered = [];
      } else {
        // Check if it's a folder
        const folder = folders.find((f) => f.name === activeCategory);
        if (folder) {
          filtered = filtered.filter((note) => note.folder === folder.id);
        } else {
          // Check if it's a tag
          const tag = tags.find((t) => t.name === activeCategory);
          if (tag) {
            filtered = filtered.filter((note) => note.tags.includes(tag.name));
          }
        }
      }
    }

    setFilteredNotes(filtered);
  }, [notes, searchQuery, activeCategory, folders, tags]);

  // Handle note open
  const handleOpenNote = (noteId: string) => {
    logActivity("view", noteId);
    setEditingNote(noteId);
  };

  // Handle note download
  const handleDownload = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();

    // Create a blob with the note content
    const blob = new Blob([note.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title}.txt`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity("download", note.id);

    toast({
      title: "Note downloaded",
      description: `${note.title} has been downloaded as a text file.`,
    });
  };

  // Handle note deletion
  const handleDelete = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    deleteNote(noteId);

    toast({
      title: "Note deleted",
      description: "The note has been deleted.",
    });
  };

  // Get icon based on note type
  const getNoteIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <>
      {filteredNotes.length === 0 ? (
        <div
          className={`text-center py-12 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p>
            {searchQuery
              ? "No notes match your search query."
              : activeCategory === "All Notes"
              ? "You haven't created any notes yet."
              : `No notes in ${activeCategory}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`relative rounded-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                  : "bg-white border-[#c6ac8f]/30 hover:border-[#c6ac8f]"
              } p-5 shadow-sm transition-all duration-300 cursor-pointer`}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: note.color,
              }}
              onMouseEnter={() => setHoveredNote(note.id)}
              onMouseLeave={() => setHoveredNote(null)}
              onClick={() => handleOpenNote(note.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-md ${
                      darkMode ? "bg-gray-700" : "bg-[#c6ac8f]/10"
                    }`}
                  >
                    {getNoteIcon(note.type)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-medium line-clamp-1">{note.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(note.lastModified)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarred(note.id);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      note.starred
                        ? "text-amber-400"
                        : "text-gray-400 hover:text-amber-400"
                    }`}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={note.starred ? "currentColor" : "none"}
                    />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={
                        darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                      }
                    >
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(note.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={(e) => handleDownload(e, note)}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-500"
                        onClick={(e) => handleDelete(e, note.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                } line-clamp-2 mb-4`}
              >
                {note.excerpt}
              </p>

              <div className="flex flex-wrap gap-1 mt-auto">
                {note.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      darkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-[#c6ac8f]/20 text-[#8a7559]"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hover effect */}
              {hoveredNote === note.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl flex items-end justify-center p-4"
                >
                  <Button className="bg-white text-gray-800 hover:bg-gray-100">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Open Note
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Note Dialog */}
      {editingNote && (
        <EditNoteDialog
          noteId={editingNote}
          open={!!editingNote}
          onOpenChange={(open) => {
            if (!open) setEditingNote(null);
          }}
          darkMode={darkMode}
        />
      )}
    </>
  );
}
