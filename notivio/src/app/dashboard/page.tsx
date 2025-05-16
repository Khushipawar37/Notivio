"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import ProfileSection from "../components/dashboard/profile-section"
import NotesGrid from "../components/dashboard/notes-grid"
import SideNavigation from "../components/dashboard/side-navigation"
import RecentActivity from "../components/dashboard/recent-activity"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { NoteProvider } from "../components/dashboard/note-context"
import CreateNoteDialog from "../components/dashboard/create-note"
import CreateFolderDialog from "../components/dashboard/create-folder"
import CreateTagDialog from "../components/dashboard/create-tag"

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Notes")
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false)

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("notivio-dark-mode")
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === "true")
    }
  }, [])

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("notivio-dark-mode", darkMode.toString())
  }, [darkMode])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <NoteProvider>
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-[#f5f0e8] text-gray-800"} transition-colors duration-300`}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Top section with search and profile */}
          <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search your notes..."
                className={`pl-10 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#c6ac8f]/30"} focus:border-[#c6ac8f] transition-all duration-300`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 flex justify-end">
              <Button
                className={`${darkMode ? "bg-[#8a7559] hover:bg-[#8a7559]/90" : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"} text-white`}
                onClick={() => setIsCreateNoteOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <SideNavigation
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />

            {/* Main Content */}
            <div className="flex-1 space-y-8">
              <ProfileSection darkMode={darkMode} />

              {/* Category Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{activeCategory}</h2>
                </div>
              </div>

              {/* Notes Grid */}
              <NotesGrid darkMode={darkMode} searchQuery={searchQuery} activeCategory={activeCategory} />
            </div>

            {/* Right Sidebar - Recent Activity */}
            <RecentActivity darkMode={darkMode} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateNoteDialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen} darkMode={darkMode} />
      <CreateFolderDialog darkMode={darkMode} />
      <CreateTagDialog darkMode={darkMode} />
    </NoteProvider>
  )
}
