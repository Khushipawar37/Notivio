"use client";

import { useState, useEffect } from "react";
import { Search, LogOut, Heart, Folder, Tag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";
import { useFirebaseNotes } from "../hooks/use-firebase-notes";
import AuthGuard from "../components/dashboard/auth-guard";
import CreateNoteDialog from "../components/dashboard/create-note";
import CreateFolderDialog from "../components/dashboard/create-folder";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Notes");
  const router = useRouter();

  const {
    user,
    notes,
    folders,
    tags,
    loading,
    updateNote,
    deleteNote,
    toggleFavorite,
  } = useFirebaseNotes();

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("notivio-dark-mode");
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true");
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("notivio-dark-mode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filter notes based on search and category
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategory === "All Notes") return matchesSearch;
    if (activeCategory === "Favorites") return matchesSearch && note.isFavorite;

    // Check if it's a folder category
    const folder = folders.find((f) => f.name === activeCategory);
    if (folder) return matchesSearch && note.folderId === folder.id;

    // Check if it's a tag category
    const tag = tags.find((t) => t.name === activeCategory);
    if (tag) return matchesSearch && note.tags?.includes(tag.id);

    return matchesSearch;
  });

  const handleToggleFavorite = async (
    noteId: string,
    currentFavorite: boolean
  ) => {
    try {
      await toggleFavorite(noteId, !currentFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c6ac8f] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-[#f5f0e8] text-gray-800"
          } transition-colors duration-300`}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.displayName || user?.email}
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={toggleDarkMode}
                className={darkMode ? "border-gray-700" : "border-[#c6ac8f]/30"}
              >
                {darkMode ? "☀️" : "🌙"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className={darkMode ? "border-gray-700" : "border-[#c6ac8f]/30"}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search your notes..."
                className={`pl-10 ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-[#c6ac8f]/30"
                  } focus:border-[#c6ac8f] transition-all duration-300`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <CreateNoteDialog darkMode={darkMode} />
              <CreateFolderDialog darkMode={darkMode} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div
              className={`w-full lg:w-64 ${darkMode ? "bg-gray-800" : "bg-white"
                } rounded-lg p-6 h-fit`}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Categories</h3>
                  <div className="space-y-1">
                    {["All Notes", "Favorites"].map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${activeCategory === category
                            ? darkMode
                              ? "bg-gray-700"
                              : "bg-[#c6ac8f]/20"
                            : darkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }`}
                      >
                        {category === "Favorites" && (
                          <Heart className="h-4 w-4" />
                        )}
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {folders.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Folders</h3>
                    <div className="space-y-1">
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => setActiveCategory(folder.name)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${activeCategory === folder.name
                              ? darkMode
                                ? "bg-gray-700"
                                : "bg-[#c6ac8f]/20"
                              : darkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                        >
                          <Folder
                            className="h-4 w-4"
                            style={{ color: folder.color }}
                          />
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="space-y-1">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => setActiveCategory(tag.name)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${activeCategory === tag.name
                              ? darkMode
                                ? "bg-gray-700"
                                : "bg-[#c6ac8f]/20"
                              : darkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                        >
                          <Tag
                            className="h-4 w-4"
                            style={{ color: tag.color }}
                          />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">{activeCategory}</h2>
                <p className="text-gray-600">{filteredNotes.length} notes</p>
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                      } hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold truncate flex-1">
                          {note.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleFavorite(note.id, note.isFavorite)
                          }
                          className="p-1 h-auto"
                        >
                          <Heart
                            className={`h-4 w-4 ${note.isFavorite
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                              }`}
                          />
                        </Button>
                      </div>

                      <p
                        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"
                          } mb-4 line-clamp-3`}
                      >
                        {note.content || "No content"}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }
                        >
                          {note.createdAt.toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            return tag ? (
                              <span
                                key={tag.id}
                                className="px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: tag.color + "20",
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredNotes.length === 0 && (
                <div className="text-center py-12">
                  <p
                    className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    {searchQuery
                      ? "No notes found matching your search."
                      : "No notes found. Create your first note to get started!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
