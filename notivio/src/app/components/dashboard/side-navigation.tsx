"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Clock, Star, Folder, Tag, Trash, Plus, ChevronRight, ChevronDown, Moon, Sun } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useNotes } from "./note-context"
import { Dialog, DialogTrigger } from "../../components/ui/dialog"
import { useToast } from "../../components/ui/use-toast"

interface SideNavigationProps {
  activeCategory: string
  setActiveCategory: (category: string) => void
  darkMode: boolean
  toggleDarkMode: () => void
}

export default function SideNavigation({
  activeCategory,
  setActiveCategory,
  darkMode,
  toggleDarkMode,
}: SideNavigationProps) {
  const { notes, folders, tags, addFolder, addTag } = useNotes()
  const { toast } = useToast()

  const [expandedSections, setExpandedSections] = useState({
    folders: true,
    tags: false,
  })

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newTagName, setNewTagName] = useState("")

  // Toggle section expansion
  const toggleSection = (section: "folders" | "tags") => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // Handle folder creation
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)

      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" has been created.`,
      })
    }
  }

  // Handle tag creation
  const handleCreateTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim())
      setNewTagName("")
      setIsCreateTagOpen(false)

      toast({
        title: "Tag created",
        description: `Tag "${newTagName}" has been created.`,
      })
    }
  }

  // Count notes for each category
  const getNotesCount = (category: string) => {
    if (category === "All Notes") return notes.length
    if (category === "Starred") return notes.filter((note) => note.starred).length
    if (category === "Recent") return Math.min(notes.length, 10) // We show max 10 recent notes

    // Check if it's a folder
    const folder = folders.find((f) => f.name === category)
    if (folder) {
      return notes.filter((note) => note.folder === folder.id).length
    }

    // Check if it's a tag
    const tag = tags.find((t) => t.name === category)
    if (tag) {
      return notes.filter((note) => note.tags.includes(tag.name)).length
    }

    return 0
  }

  const categories = [
    { name: "All Notes", icon: BookOpen },
    { name: "Recent", icon: Clock },
    { name: "Starred", icon: Star },
    { name: "Trash", icon: Trash },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full lg:w-64 h-fit lg:sticky lg:top-24 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#c6ac8f]/30"} rounded-xl border p-4 shadow-sm`}
    >
      <div className="space-y-6">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className={`w-full justify-start ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-[#c6ac8f]/10 text-gray-700"}`}
        >
          {darkMode ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              <span>Dark Mode</span>
            </>
          )}
        </Button>

        {/* Main Categories */}
        <div className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon
            const count = getNotesCount(category.name)

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.name
                    ? darkMode
                      ? "bg-[#8a7559] text-white"
                      : "bg-[#c6ac8f] text-white"
                    : darkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-[#c6ac8f]/10 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </div>

                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeCategory === category.name
                        ? "bg-white/20 text-white"
                        : darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-[#c6ac8f]/20 text-[#8a7559]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Folders Section */}
        <div>
          <button
            onClick={() => toggleSection("folders")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-[#c6ac8f]/10 text-gray-700"}`}
          >
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4" />
              <span>Folders</span>
            </div>
            {expandedSections.folders ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.folders && (
            <div className="mt-1 ml-9 space-y-1">
              {folders.map((folder) => {
                const count = notes.filter((note) => note.folder === folder.id).length

                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveCategory(folder.name)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeCategory === folder.name
                        ? darkMode
                          ? "bg-[#8a7559] text-white"
                          : "bg-[#c6ac8f] text-white"
                        : darkMode
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-[#c6ac8f]/10 text-gray-700"
                    }`}
                  >
                    <span>{folder.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeCategory === folder.name
                            ? "bg-white/20 text-white"
                            : darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-[#c6ac8f]/20 text-[#8a7559]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Create Folder Dialog Trigger */}
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <button
                    className={`w-full flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Folder</span>
                  </button>
                </DialogTrigger>
                <div
                  className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isCreateFolderOpen ? "block" : "hidden"}`}
                >
                  <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateFolderOpen(false)}></div>
                  <div
                    className={`relative z-10 w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className={`w-full p-2 mb-4 rounded border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className={`${darkMode ? "bg-[#8a7559] hover:bg-[#8a7559]/90" : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"} text-white`}
                        onClick={handleCreateFolder}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <button
            onClick={() => toggleSection("tags")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-[#c6ac8f]/10 text-gray-700"}`}
          >
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4" />
              <span>Tags</span>
            </div>
            {expandedSections.tags ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.tags && (
            <div className="mt-1 ml-9 space-y-1">
              {tags.map((tag) => {
                const count = notes.filter((note) => note.tags.includes(tag.name)).length

                return (
                  <button
                    key={tag.id}
                    onClick={() => setActiveCategory(tag.name)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeCategory === tag.name
                        ? darkMode
                          ? "bg-[#8a7559] text-white"
                          : "bg-[#c6ac8f] text-white"
                        : darkMode
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-[#c6ac8f]/10 text-gray-700"
                    }`}
                  >
                    <span>{tag.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeCategory === tag.name
                            ? "bg-white/20 text-white"
                            : darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-[#c6ac8f]/20 text-[#8a7559]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Create Tag Dialog Trigger */}
              <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
                <DialogTrigger asChild>
                  <button
                    className={`w-full flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Tag</span>
                  </button>
                </DialogTrigger>
                <div
                  className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isCreateTagOpen ? "block" : "hidden"}`}
                >
                  <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateTagOpen(false)}></div>
                  <div
                    className={`relative z-10 w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <h3 className="text-lg font-medium mb-4">Create New Tag</h3>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                      className={`w-full p-2 mb-4 rounded border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateTagOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        className={`${darkMode ? "bg-[#8a7559] hover:bg-[#8a7559]/90" : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"} text-white`}
                        onClick={handleCreateTag}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
