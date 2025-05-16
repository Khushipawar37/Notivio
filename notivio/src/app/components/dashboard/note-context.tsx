"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

// Types
export type NoteType = "document" | "video" | "audio"

export interface Note {
  id: string
  title: string
  content: string
  excerpt: string
  date: string
  lastModified: string
  tags: string[]
  folder: string | null
  color: string
  starred: boolean
  type: NoteType
  size: number // in bytes
}

export interface Folder {
  id: string
  name: string
}

export interface Tag {
  id: string
  name: string
}

export interface Activity {
  id: string
  type: "create" | "edit" | "view" | "delete" | "download"
  noteId: string
  noteTitle: string
  timestamp: number
  noteType: NoteType
}

interface NoteContextType {
  notes: Note[]
  folders: Folder[]
  tags: Tag[]
  activities: Activity[]
  addNote: (note: Omit<Note, "id" | "date" | "lastModified" | "size">) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleStarred: (id: string) => void
  addFolder: (name: string) => void
  deleteFolder: (id: string) => void
  addTag: (name: string) => void
  deleteTag: (id: string) => void
  logActivity: (type: Activity["type"], noteId: string) => void
  getTotalStorage: () => number
  getMaxStorage: () => number
}

const NoteContext = createContext<NoteContextType | undefined>(undefined)

// Default colors for notes
const NOTE_COLORS = ["#c6ac8f", "#8a7559", "#d8c0a5"]

// Provider component
export const NoteProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedNotes = localStorage.getItem("notivio-notes")
    const savedFolders = localStorage.getItem("notivio-folders")
    const savedTags = localStorage.getItem("notivio-tags")
    const savedActivities = localStorage.getItem("notivio-activities")

    if (savedNotes) setNotes(JSON.parse(savedNotes))
    if (savedFolders) setFolders(JSON.parse(savedFolders))
    if (savedTags) setTags(JSON.parse(savedTags))
    if (savedActivities) setActivities(JSON.parse(savedActivities))

    // Initialize with sample data if empty
    if (!savedNotes || JSON.parse(savedNotes).length === 0) {
      const sampleNotes: Note[] = [
        {
          id: uuidv4(),
          title: "Getting Started with Notivio",
          content: "Welcome to Notivio! This is your first note. You can edit it, delete it, or create new notes.",
          excerpt: "Welcome to Notivio! This is your first note. You can edit it, delete it, or create new notes.",
          date: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          tags: ["Welcome"],
          folder: null,
          color: NOTE_COLORS[0],
          starred: false,
          type: "document",
          size: 120,
        },
      ]
      setNotes(sampleNotes)
      localStorage.setItem("notivio-notes", JSON.stringify(sampleNotes))
    }

    if (!savedFolders || JSON.parse(savedFolders).length === 0) {
      const sampleFolders: Folder[] = [
        { id: uuidv4(), name: "Personal" },
        { id: uuidv4(), name: "Work" },
      ]
      setFolders(sampleFolders)
      localStorage.setItem("notivio-folders", JSON.stringify(sampleFolders))
    }

    if (!savedTags || JSON.parse(savedTags).length === 0) {
      const sampleTags: Tag[] = [
        { id: uuidv4(), name: "Important" },
        { id: uuidv4(), name: "Welcome" },
      ]
      setTags(sampleTags)
      localStorage.setItem("notivio-tags", JSON.stringify(sampleTags))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("notivio-notes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("notivio-folders", JSON.stringify(folders))
  }, [folders])

  useEffect(() => {
    localStorage.setItem("notivio-tags", JSON.stringify(tags))
  }, [tags])

  useEffect(() => {
    localStorage.setItem("notivio-activities", JSON.stringify(activities))
  }, [activities])

  // Add a new note
  const addNote = (note: Omit<Note, "id" | "date" | "lastModified" | "size">) => {
    const now = new Date().toISOString()
    const newNote: Note = {
      id: uuidv4(),
      ...note,
      date: now,
      lastModified: now,
      size: note.content.length * 2, // Rough estimate of size in bytes
    }

    setNotes((prevNotes) => [...prevNotes, newNote])
    logActivity("create", newNote.id)
    return newNote.id
  }

  // Update an existing note
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === id) {
          const updatedNote = {
            ...note,
            ...updates,
            lastModified: new Date().toISOString(),
            size: updates.content ? updates.content.length * 2 : note.size,
          }
          return updatedNote
        }
        return note
      }),
    )
    logActivity("edit", id)
  }

  // Delete a note
  const deleteNote = (id: string) => {
    const noteToDelete = notes.find((note) => note.id === id)
    if (noteToDelete) {
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id))
      logActivity("delete", id)
    }
  }

  // Toggle starred status
  const toggleStarred = (id: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === id) {
          return { ...note, starred: !note.starred }
        }
        return note
      }),
    )
  }

  // Add a new folder
  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
    }
    setFolders((prevFolders) => [...prevFolders, newFolder])
    return newFolder.id
  }

  // Delete a folder
  const deleteFolder = (id: string) => {
    setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== id))

    // Update notes that were in this folder
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.folder === id) {
          return { ...note, folder: null }
        }
        return note
      }),
    )
  }

  // Add a new tag
  const addTag = (name: string) => {
    const newTag: Tag = {
      id: uuidv4(),
      name,
    }
    setTags((prevTags) => [...prevTags, newTag])
    return newTag.id
  }

  // Delete a tag
  const deleteTag = (id: string) => {
    setTags((prevTags) => prevTags.filter((tag) => tag.id !== id))

    // Remove this tag from all notes
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        const tagName = tags.find((t) => t.id === id)?.name
        if (tagName && note.tags.includes(tagName)) {
          return { ...note, tags: note.tags.filter((t) => t !== tagName) }
        }
        return note
      }),
    )
  }

  // Log user activity
  const logActivity = (type: Activity["type"], noteId: string) => {
    const note = notes.find((n) => n.id === noteId)

    if (note) {
      const newActivity: Activity = {
        id: uuidv4(),
        type,
        noteId,
        noteTitle: note.title,
        timestamp: Date.now(),
        noteType: note.type,
      }

      setActivities((prevActivities) => {
        // Keep only the most recent 20 activities
        const updatedActivities = [newActivity, ...prevActivities]
        return updatedActivities.slice(0, 20)
      })
    }
  }

  // Calculate total storage used
  const getTotalStorage = () => {
    return notes.reduce((total, note) => total + note.size, 0)
  }

  // Get maximum storage (5MB for free users)
  const getMaxStorage = () => {
    return 5 * 1024 * 1024 // 5MB in bytes
  }

  const value = {
    notes,
    folders,
    tags,
    activities,
    addNote,
    updateNote,
    deleteNote,
    toggleStarred,
    addFolder,
    deleteFolder,
    addTag,
    deleteTag,
    logActivity,
    getTotalStorage,
    getMaxStorage,
  }

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>
}

// Custom hook to use the note context
export const useNotes = () => {
  const context = useContext(NoteContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NoteProvider")
  }
  return context
}
