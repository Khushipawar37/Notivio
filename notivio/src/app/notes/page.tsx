"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown,
  Edit,
  Save,
  Trash2,
  FileText,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  ImageIcon,
  BookOpen,
  MoreHorizontal,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Bookmark,
  BookmarkCheck,
  Scan,
  Wand2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Progress } from "../components/ui/progress";
import Footer from "../components/home/Footer";

type Note = {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  source: string;
  sourceType: "video" | "document" | "manual" | "image";
  lastUpdated: string;
  isFavorite: boolean;
  sections?: {
    title: string;
    content: string[];
  }[];
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Introduction to Machine Learning",
      content: "Machine learning is a subset of artificial intelligence...",
      summary: "Overview of machine learning concepts and applications",
      tags: ["AI", "Technology", "Education"],
      source: "YouTube: Tech Explained",
      sourceType: "video",
      lastUpdated: "2023-05-15T14:30:00Z",
      isFavorite: true,
      sections: [
        {
          title: "What is Machine Learning?",
          content: [
            "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
            "It focuses on developing algorithms that can access data and use it to learn for themselves.",
          ],
        },
        {
          title: "Types of Machine Learning",
          content: [
            "Supervised Learning: Training with labeled data",
            "Unsupervised Learning: Finding patterns in unlabeled data",
            "Reinforcement Learning: Learning through trial and error with rewards",
          ],
        },
      ],
    },
    {
      id: "2",
      title: "Modern Web Development Frameworks",
      content:
        "Comparing React, Vue, and Angular for modern web applications...",
      summary: "Analysis of popular frontend frameworks and their use cases",
      tags: ["Web Development", "Programming", "JavaScript"],
      source: "Manual Notes",
      sourceType: "manual",
      lastUpdated: "2023-06-20T09:15:00Z",
      isFavorite: false,
      sections: [
        {
          title: "React",
          content: [
            "Component-based library for building user interfaces",
            "Virtual DOM for efficient rendering",
            "Large ecosystem and community support",
          ],
        },
        {
          title: "Vue",
          content: [
            "Progressive framework for building UIs",
            "Easy to integrate with existing projects",
            "Gentle learning curve for beginners",
          ],
        },
      ],
    },
    {
      id: "3",
      title: "Climate Change: Global Impact",
      content:
        "Examining the effects of climate change on ecosystems worldwide...",
      summary:
        "Overview of climate change causes, effects, and potential solutions",
      tags: ["Environment", "Science", "Global Issues"],
      source: "Document: IPCC Report Summary",
      sourceType: "document",
      lastUpdated: "2023-04-10T11:45:00Z",
      isFavorite: true,
      sections: [
        {
          title: "Causes of Climate Change",
          content: [
            "Greenhouse gas emissions from human activities",
            "Deforestation and land use changes",
            "Industrial processes and fossil fuel consumption",
          ],
        },
        {
          title: "Environmental Impacts",
          content: [
            "Rising global temperatures and extreme weather events",
            "Sea level rise and coastal flooding",
            "Biodiversity loss and ecosystem disruption",
          ],
        },
      ],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableNote, setEditableNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isImageScanModalOpen, setIsImageScanModalOpen] = useState(false);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  // Filter notes based on search term, tags, and active tab
  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
    .filter(
      (note) =>
        selectedTags.length === 0 ||
        selectedTags.some((tag) => note.tags.includes(tag))
    )
    .filter((note) => {
      if (activeTab === "all") return true;
      if (activeTab === "favorites") return note.isFavorite;
      if (activeTab === "video") return note.sourceType === "video";
      if (activeTab === "document") return note.sourceType === "document";
      if (activeTab === "manual") return note.sourceType === "manual";
      if (activeTab === "image") return note.sourceType === "image";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.lastUpdated).getTime() -
              new Date(b.lastUpdated).getTime()
          : new Date(b.lastUpdated).getTime() -
              new Date(a.lastUpdated).getTime();
      } else {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

  // Get all unique tags from notes
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  // Initialize expanded sections when a note is selected
  useEffect(() => {
    if (selectedNote && selectedNote.sections) {
      const initialExpandedState: Record<number, boolean> = {};
      selectedNote.sections.forEach((_, index) => {
        initialExpandedState[index] = true;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [selectedNote]);

  // Scroll to notes when selected
  useEffect(() => {
    if (selectedNote && notesContainerRef.current) {
      notesContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedNote]);

  // Simulate image scanning process
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);

            // Add a new note from the scanned image
            if (isImageScanModalOpen) {
              const newNote: Note = {
                id: (notes.length + 1).toString(),
                title: "Scanned Notes: Physics Lecture",
                content:
                  "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles...",
                summary:
                  "Notes on quantum mechanics principles and applications",
                tags: ["Physics", "Science", "Quantum"],
                source: "Image Scan",
                sourceType: "image",
                lastUpdated: new Date().toISOString(),
                isFavorite: false,
                sections: [
                  {
                    title: "Quantum Mechanics Principles",
                    content: [
                      "Wave-particle duality: Matter and light exhibit both wave and particle properties",
                      "Uncertainty principle: Cannot simultaneously know position and momentum precisely",
                      "Quantum superposition: Particles exist in multiple states until measured",
                    ],
                  },
                  {
                    title: "Applications",
                    content: [
                      "Quantum computing: Using quantum bits for exponentially faster computation",
                      "Quantum cryptography: Secure communication using quantum properties",
                      "Quantum sensors: Ultra-precise measurements using quantum effects",
                    ],
                  },
                ],
              };

              setNotes((prev) => [...prev, newNote]);
              setSelectedNote(newNote);
              setIsImageScanModalOpen(false);
              showSuccess("Image successfully scanned and converted to notes!");
            }

            // Enhance the selected note
            if (isEnhanceModalOpen) {
              if (selectedNote) {
                // Create enhanced flashcards from the note
                const enhancedNote = { ...selectedNote };
                enhancedNote.title = `${enhancedNote.title} (Enhanced)`;
                enhancedNote.lastUpdated = new Date().toISOString();

                setIsEnhanceModalOpen(false);
                showSuccess(
                  "Note successfully enhanced and flashcards created!"
                );
              }
            }

            return 100;
          }
          return prev + 5;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [
    isProcessing,
    isImageScanModalOpen,
    isEnhanceModalOpen,
    selectedNote,
    notes.length,
  ]);

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditMode(false);
    setEditableNote(null);
  };

  const startEditMode = () => {
    if (selectedNote) {
      setEditMode(true);
      setEditableNote(JSON.parse(JSON.stringify(selectedNote)));
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditableNote(null);
  };

  const saveEdit = () => {
    if (editableNote) {
      // Update the note in the notes array
      setNotes((prev) =>
        prev.map((note) =>
          note.id === editableNote.id
            ? { ...editableNote, lastUpdated: new Date().toISOString() }
            : note
        )
      );

      // Update the selected note
      setSelectedNote({
        ...editableNote,
        lastUpdated: new Date().toISOString(),
      });
      setEditMode(false);
      showSuccess("Note updated successfully!");
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
      setEditMode(false);
      setEditableNote(null);
    }
    showSuccess("Note deleted successfully!");
  };

  const toggleFavorite = (noteId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
      )
    );

    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
  };

  const handleEditSectionTitle = (sectionIndex: number, title: string) => {
    if (!editableNote || !editableNote.sections) return;

    const updatedNote = { ...editableNote };
    updatedNote.sections[sectionIndex].title = title;
    setEditableNote(updatedNote);
  };

  const handleEditSectionContent = (
    sectionIndex: number,
    contentIndex: number,
    content: string
  ) => {
    if (!editableNote || !editableNote.sections) return;

    const updatedNote = { ...editableNote };
    updatedNote.sections[sectionIndex].content[contentIndex] = content;
    setEditableNote(updatedNote);
  };

  const addSectionPoint = (sectionIndex: number) => {
    if (!editableNote || !editableNote.sections) return;

    const updatedNote = { ...editableNote };
    updatedNote.sections[sectionIndex].content.push("New point");
    setEditableNote(updatedNote);
  };

  const removeSectionPoint = (sectionIndex: number, contentIndex: number) => {
    if (!editableNote || !editableNote.sections) return;

    const updatedNote = { ...editableNote };
    updatedNote.sections[sectionIndex].content = updatedNote.sections[
      sectionIndex
    ].content.filter((_, i) => i !== contentIndex);
    setEditableNote(updatedNote);
  };

  const addNewSection = () => {
    if (!editableNote) return;

    const updatedNote = { ...editableNote };
    if (!updatedNote.sections) {
      updatedNote.sections = [];
    }

    updatedNote.sections.push({
      title: "New Section",
      content: ["Add your content here"],
    });

    setEditableNote(updatedNote);

    // Expand the newly added section
    const newSectionIndex = updatedNote.sections.length - 1;
    setExpandedSections((prev) => ({
      ...prev,
      [newSectionIndex]: true,
    }));
  };

  const removeSection = (sectionIndex: number) => {
    if (!editableNote || !editableNote.sections) return;

    const updatedNote = { ...editableNote };
    updatedNote.sections = updatedNote.sections.filter(
      (_, i) => i !== sectionIndex
    );
    setEditableNote(updatedNote);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const triggerImageScan = () => {
    setIsImageScanModalOpen(true);
    setIsProcessing(true);
    setProcessingProgress(0);
  };

  const triggerEnhance = () => {
    if (!selectedNote) return;
    setIsEnhanceModalOpen(true);
    setIsProcessing(true);
    setProcessingProgress(0);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAnimation(true);
    setTimeout(() => {
      setShowSuccessAnimation(false);
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "video":
        return <BookOpen className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "manual":
        return <Edit className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e8] via-[#f5f0e8] to-[#f5f0e8] py-[10rem] px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            <span className="text-[#8a7559]">Notivio</span> Notes
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Manage, update, and enhance your notes with our powerful tools
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-14 gap-4">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-4 xl:col-span-4"
          >
            <Card className="border border-[#c6ac8f]/30 shadow-md overflow-hidden bg-white sticky top-24">
              <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-[#8a7559]">
                    My Notes
                  </CardTitle>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#8a7559]"
                        >
                          <Scan className="h-4 w-4" />
                          <span className="sr-only">Scan Image</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Scan Image to Notes</DialogTitle>
                          <DialogDescription>
                            Upload an image of handwritten or printed notes to
                            convert to digital format
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div
                            className="border-2 border-dashed border-[#c6ac8f]/40 rounded-lg p-8 text-center cursor-pointer hover:bg-[#f5f0e8]/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={() => triggerImageScan()}
                            />
                            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[#8a7559]" />
                            <p className="text-sm text-gray-600 mb-2">
                              Drag and drop an image here or click to browse
                            </p>
                            <p className="text-xs text-gray-500">
                              Supports JPG, PNG, and PDF files
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsImageScanModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={triggerImageScan}
                            className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white"
                          >
                            Scan Image
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Filter className="h-4 w-4" />
                          <span className="sr-only">Filter</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSortBy("date")}
                          className={sortBy === "date" ? "bg-[#f5f0e8]" : ""}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Date</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("title")}
                          className={sortBy === "title" ? "bg-[#f5f0e8]" : ""}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Title</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSortOrder("asc")}
                          className={sortOrder === "asc" ? "bg-[#f5f0e8]" : ""}
                        >
                          <SortAsc className="mr-2 h-4 w-4" />
                          <span>Ascending</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortOrder("desc")}
                          className={sortOrder === "desc" ? "bg-[#f5f0e8]" : ""}
                        >
                          <SortDesc className="mr-2 h-4 w-4" />
                          <span>Descending</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-2 focus:ring-[#c6ac8f] focus:border-[#c6ac8f] border-[#c6ac8f]/30"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs
                  defaultValue="all"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full justify-start rounded-none border-b border-[#c6ac8f]/20 bg-[#f5f0e8]/50 p-0">
                    <TabsTrigger
                      value="all"
                      className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#8a7559]"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="favorites"
                      className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#8a7559]"
                    >
                      Favorites
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-3 border-b border-[#c6ac8f]/20 bg-[#f5f0e8]/30">
                    <ScrollArea className="whitespace-nowrap pb-2 max-w-full">
                      <div className="flex gap-2">
                        {allTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={
                              selectedTags.includes(tag) ? "default" : "outline"
                            }
                            className={`cursor-pointer ${
                              selectedTags.includes(tag)
                                ? "bg-[#8a7559] hover:bg-[#8a7559]/80"
                                : "border-[#c6ac8f]/40 hover:bg-[#f5f0e8]"
                            }`}
                            onClick={() => handleTagChange(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <ScrollArea className="h-[calc(100vh-24rem)]">
                    {filteredNotes.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notes found</p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    ) : (
                      <div>
                        {filteredNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div
                              className={`p-4 border-b border-[#c6ac8f]/20 cursor-pointer transition-colors ${
                                selectedNote?.id === note.id
                                  ? "bg-[#f5f0e8]"
                                  : "hover:bg-[#f5f0e8]/50"
                              }`}
                              onClick={() => selectNote(note)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-[#8a7559] line-clamp-1">
                                  {note.title}
                                </h3>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(note.id);
                                    }}
                                  >
                                    {note.isFavorite ? (
                                      <BookmarkCheck className="h-4 w-4 text-[#8a7559]" />
                                    ) : (
                                      <Bookmark className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="sr-only">
                                      {note.isFavorite
                                        ? "Remove from favorites"
                                        : "Add to favorites"}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {note.summary}
                              </p>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center text-xs text-gray-500">
                                  {getSourceIcon(note.sourceType)}
                                  <span className="ml-1">
                                    {formatDate(note.lastUpdated)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {note.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs py-0 h-5 border-[#c6ac8f]/30"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0 h-5 border-[#c6ac8f]/30"
                                    >
                                      +{note.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            ref={notesContainerRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-8 xl:col-span-9"
          >
            {selectedNote ? (
              <Card className="border border-[#c6ac8f]/30 shadow-md overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      {editMode ? (
                        <Input
                          value={editableNote?.title || ""}
                          onChange={(e) =>
                            setEditableNote((prev) =>
                              prev ? { ...prev, title: e.target.value } : null
                            )
                          }
                          className="text-xl font-bold border-2 focus:ring-[#c6ac8f] focus:border-[#c6ac8f] border-[#c6ac8f]/30"
                        />
                      ) : (
                        <CardTitle className="text-2xl text-[#8a7559]">
                          {selectedNote.title}
                        </CardTitle>
                      )}

                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          {getSourceIcon(selectedNote.sourceType)}
                          <span className="ml-1">{selectedNote.source}</span>
                        </div>
                        <span className="mx-2">•</span>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDate(selectedNote.lastUpdated)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {editMode ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={cancelEdit}
                            className="border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveEdit}
                            className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  onClick={startEditMode}
                                  className="border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559]"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit this note</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white">
                                <Wand2 className="h-4 w-4 mr-2" />
                                Enhance
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Enhance Your Notes</DialogTitle>
                                <DialogDescription>
                                  Choose how you want to enhance your notes
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card className="border border-[#c6ac8f]/30 cursor-pointer hover:bg-[#f5f0e8]/50 transition-colors">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">
                                        Flashcards
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-gray-600">
                                        Convert your notes into interactive
                                        flashcards for better memorization
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card className="border border-[#c6ac8f]/30 cursor-pointer hover:bg-[#f5f0e8]/50 transition-colors">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">
                                        Mind Map
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-gray-600">
                                        Visualize connections between concepts
                                        in your notes
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card className="border border-[#c6ac8f]/30 cursor-pointer hover:bg-[#f5f0e8]/50 transition-colors">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">
                                        Quiz
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-gray-600">
                                        Generate practice questions based on
                                        your notes
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card className="border border-[#c6ac8f]/30 cursor-pointer hover:bg-[#f5f0e8]/50 transition-colors">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">
                                        Summary
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-gray-600">
                                        Create a concise summary of your notes
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsEnhanceModalOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={triggerEnhance}
                                  className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white"
                                >
                                  Create Flashcards
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => toggleFavorite(selectedNote.id)}
                              >
                                {selectedNote.isFavorite ? (
                                  <>
                                    <Bookmark className="mr-2 h-4 w-4" />
                                    <span>Remove from favorites</span>
                                  </>
                                ) : (
                                  <>
                                    <BookmarkCheck className="mr-2 h-4 w-4" />
                                    <span>Add to favorites</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileDown className="mr-2 h-4 w-4" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => deleteNote(selectedNote.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete note</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>

                  {editMode ? (
                    <div className="mt-2">
                      <Label htmlFor="tags" className="text-sm font-medium">
                        Tags
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {editableNote?.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            className="bg-[#8a7559] hover:bg-[#8a7559]/80 flex items-center gap-1"
                          >
                            {tag}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 text-white hover:text-white hover:bg-transparent"
                              onClick={() => {
                                if (editableNote) {
                                  const updatedTags = editableNote.tags.filter(
                                    (_, i) => i !== index
                                  );
                                  setEditableNote({
                                    ...editableNote,
                                    tags: updatedTags,
                                  });
                                }
                              }}
                            >
                              <XIcon className="h-3 w-3" />
                              <span className="sr-only">Remove tag</span>
                            </Button>
                          </Badge>
                        ))}
                        <Input
                          id="new-tag"
                          placeholder="Add tag..."
                          className="w-24 h-6 text-xs"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              e.currentTarget.value.trim() !== ""
                            ) {
                              if (editableNote) {
                                const newTag = e.currentTarget.value.trim();
                                if (!editableNote.tags.includes(newTag)) {
                                  setEditableNote({
                                    ...editableNote,
                                    tags: [...editableNote.tags, newTag],
                                  });
                                }
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedNote.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-[#8a7559] hover:bg-[#8a7559]/80"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-6">
                  <Tabs defaultValue="structured" className="mt-2">
                    <TabsList className="mb-6 bg-[#f5f0e8] p-1 border border-[#c6ac8f]/30">
                      <TabsTrigger
                        value="structured"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#8a7559] data-[state=active]:shadow-sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Structured Notes
                      </TabsTrigger>
                      <TabsTrigger
                        value="summary"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#8a7559] data-[state=active]:shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Summary
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="structured">
                      {editMode && (
                        <div className="mb-6 flex justify-end">
                          <Button
                            onClick={addNewSection}
                            className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                          </Button>
                        </div>
                      )}

                      {(editMode ? editableNote : selectedNote)?.sections?.map(
                        (section, sIndex) => (
                          <motion.div
                            key={sIndex}
                            className="mb-8 border border-[#c6ac8f]/20 rounded-lg overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: sIndex * 0.1 }}
                          >
                            <div
                              className="flex justify-between items-center p-3 bg-[#f5f0e8] cursor-pointer"
                              onClick={() => toggleSection(sIndex)}
                            >
                              {editMode ? (
                                <div className="flex-1 flex items-center">
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) =>
                                      handleEditSectionTitle(
                                        sIndex,
                                        e.target.value
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xl font-bold w-full p-2 bg-white border border-[#c6ac8f]/30 rounded-md focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSection(sIndex);
                                    }}
                                    className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <h3 className="text-xl font-bold text-[#8a7559]">
                                  {section.title}
                                </h3>
                              )}
                              <div className="text-[#8a7559]">
                                {expandedSections[sIndex] ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>

                            {expandedSections[sIndex] && (
                              <div className="p-4">
                                {editMode ? (
                                  <div className="pl-4 mb-4 space-y-3">
                                    {section.content.map((point, pIndex) => (
                                      <motion.div
                                        key={pIndex}
                                        className="flex items-start"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          duration: 0.3,
                                          delay: pIndex * 0.05,
                                        }}
                                      >
                                        <textarea
                                          value={point}
                                          onChange={(e) =>
                                            handleEditSectionContent(
                                              sIndex,
                                              pIndex,
                                              e.target.value
                                            )
                                          }
                                          className="w-full p-3 border border-[#c6ac8f]/30 rounded-md min-h-[80px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            removeSectionPoint(sIndex, pIndex)
                                          }
                                          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addSectionPoint(sIndex)}
                                      className="mt-2 border-[#c6ac8f]/30 text-[#8a7559] hover:bg-[#f5f0e8]"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Point
                                    </Button>
                                  </div>
                                ) : (
                                  <ul className="list-disc pl-8 mb-4 space-y-3">
                                    {section.content.map((point, pIndex) => (
                                      <motion.li
                                        key={pIndex}
                                        className="text-gray-700"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          duration: 0.3,
                                          delay: pIndex * 0.05,
                                        }}
                                      >
                                        {point}
                                      </motion.li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )
                      )}

                      {(!selectedNote.sections ||
                        selectedNote.sections.length === 0) &&
                        !editMode && (
                          <div className="text-center p-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="mb-2">
                              No structured content available
                            </p>
                            <p className="text-sm">
                              Click the Edit button to add sections to this note
                            </p>
                          </div>
                        )}
                    </TabsContent>

                    <TabsContent value="summary">
                      <div className="bg-[#f5f0e8] p-6 rounded-md border border-[#c6ac8f]/30">
                        <h3 className="text-xl font-bold mb-4 text-[#8a7559]">
                          Summary
                        </h3>
                        {editMode ? (
                          <div className="p-4 bg-white rounded-md border border-[#c6ac8f]/20 shadow-inner">
                            <textarea
                              value={editableNote?.summary || ""}
                              onChange={(e) =>
                                setEditableNote((prev) =>
                                  prev
                                    ? { ...prev, summary: e.target.value }
                                    : null
                                )
                              }
                              className="w-full p-3 border border-[#c6ac8f]/30 rounded-md min-h-[200px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-md border border-[#c6ac8f]/20 shadow-inner">
                            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {selectedNote.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>

                <CardFooter className="flex justify-between border-t border-[#c6ac8f]/20 bg-[#f5f0e8]/50 py-4">
                  <div className="text-sm text-[#8a7559]">
                    <span className="font-medium">Notivio</span> - Smart
                    note-taking and organization
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card className="border border-[#c6ac8f]/30 shadow-md overflow-hidden bg-white h-[calc(100vh-16rem)]">
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="h-16 w-16 text-[#c6ac8f]/50 mb-6" />
                  <h3 className="text-2xl font-bold text-[#8a7559] mb-2">
                    Select a Note
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    Choose a note from the sidebar to view, edit, or enhance it
                    with our AI-powered tools
                  </p>
                  <p className="text-sm text-gray-500">
                    You can also scan an image to create a new note
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Processing Dialog */}
      <Dialog
        open={isProcessing}
        onOpenChange={(open) => !open && setIsProcessing(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isImageScanModalOpen ? "Processing Image" : "Enhancing Note"}
            </DialogTitle>
            <DialogDescription>
              {isImageScanModalOpen
                ? "Converting your image to structured notes..."
                : "Creating flashcards from your notes..."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <Progress value={processingProgress} className="h-2 w-full" />
              <p className="text-center text-sm text-gray-500">
                {processingProgress < 30
                  ? "Analyzing content..."
                  : processingProgress < 60
                  ? "Extracting key information..."
                  : processingProgress < 90
                  ? "Organizing data..."
                  : "Finalizing..."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md shadow-md flex items-center z-50"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component for X icon
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
