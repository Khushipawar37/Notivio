"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useFirebaseNotes } from "../../hooks/use-firebase-notes"

interface CreateNoteDialogProps {
  darkMode: boolean
}

export default function CreateNoteDialog({ darkMode }: CreateNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string>("none")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { createNote, folders, tags } = useFirebaseNotes()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await createNote({
        title: title.trim(),
        content: content.trim(),
        folderId: selectedFolder === "none" ? undefined : selectedFolder,
        tags: selectedTags,
      })

      // Reset form
      setTitle("")
      setContent("")
      setSelectedFolder("none")
      setSelectedTags([])
      setOpen(false)
    } catch (error) {
      console.error("Error creating note:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`${darkMode ? "bg-[#8a7559] hover:bg-[#8a7559]/90" : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"} text-white`}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white"}`}>
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your collection. You can organize it with folders and tags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title..."
                className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content..."
                className={`min-h-[100px] ${darkMode ? "bg-gray-700 border-gray-600" : ""}`}
              />
            </div>

            {folders.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="folder">Folder (Optional)</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        📁 {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className={darkMode ? "border-gray-600" : ""}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className={`${darkMode ? "bg-[#8a7559] hover:bg-[#8a7559]/90" : "bg-[#c6ac8f] hover:bg-[#c6ac8f]/90"} text-white`}
            >
              {loading ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
