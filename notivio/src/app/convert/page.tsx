"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  FileDown,
  Edit,
  Save,
  Trash2,
  AlertCircle,
  Youtube,
  FileText,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Brain,
  Sparkles,
  FileSearch,
  Clock,
  BookOpen,
  Zap,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import Footer from "../components/home/Footer"

type NoteSection = {
  title: string
  content: string[]
  subsections?: { title: string; content: string[] }[]
}

type Notes = {
  title: string
  transcript: string
  sections: NoteSection[]
  summary: string
  keyPoints: string[]
  duration: string
}

export default function VideoNotesPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notes, setNotes] = useState<Notes | null>(null)
  const [activeTab, setActiveTab] = useState("structured")
  const [editMode, setEditMode] = useState(false)
  const [editableNotes, setEditableNotes] = useState<Notes | null>(null)
  const [processingStage, setProcessingStage] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  // Validate YouTube URL
  useEffect(() => {
    const videoId = extractVideoId(url)
    setIsUrlValid(!!videoId)
  }, [url])

  // Simulate processing stages with progress
  useEffect(() => {
    if (loading) {
      const stages = [
        "Extracting video information",
        "Fetching transcript data",
        "Processing with AI",
        "Structuring notes",
      ]
      let currentStage = 0
      let progress = 0

      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5

        if (progress >= 100) {
          if (currentStage < stages.length - 1) {
            currentStage++
            setProcessingStage(currentStage)
            progress = 0
          } else {
            clearInterval(interval)
            setProcessingProgress(100)
            return
          }
        }

        setProcessingProgress(Math.min(progress, 100))
      }, 300)

      return () => clearInterval(interval)
    } else {
      setProcessingStage(0)
      setProcessingProgress(0)
    }
  }, [loading])

  // Scroll to notes when generated
  useEffect(() => {
    if (notes && notesContainerRef.current) {
      notesContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [notes])

  // Initialize expanded sections
  useEffect(() => {
    if (notes) {
      const initialExpandedState: Record<number, boolean> = {}
      notes.sections.forEach((_, index) => {
        initialExpandedState[index] = true
      })
      setExpandedSections(initialExpandedState)
    }
  }, [notes])

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setNotes(null)
    setShowSuccessAnimation(false)

    try {
      const videoId = extractVideoId(url)

      if (!videoId) {
        throw new Error("Invalid YouTube URL")
      }

      console.log("Fetching transcript for video ID:", videoId)

      // Fetch video transcript and metadata
      const transcriptResponse = await fetch(`/api/video-transcript?videoId=${videoId}`)

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text()
        console.error("Transcript API error:", errorText)
        throw new Error("Failed to fetch video transcript. Please check if the video has captions enabled.")
      }

      const transcriptData = await transcriptResponse.json()
      console.log("Transcript data received:", transcriptData)

      // Process transcript into structured notes using AI
      console.log("Generating notes...")
      const notesResponse = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcriptData.transcript,
          title: transcriptData.title,
          duration: transcriptData.duration,
        }),
      })

      if (!notesResponse.ok) {
        const errorText = await notesResponse.text()
        console.error("Notes generation error:", errorText)
        throw new Error("Failed to generate notes. Please try again.")
      }

      const generatedNotes = await notesResponse.json()
      console.log("Notes generated successfully:", generatedNotes)

      setNotes(generatedNotes)
      setEditableNotes(JSON.parse(JSON.stringify(generatedNotes)))
      setShowSuccessAnimation(true)

      // Hide success animation after 3 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false)
      }, 3000)
    } catch (err: any) {
      console.error("Error in handleSubmit:", err)
      setError(err.message || "An error occurred while processing the video")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: editMode ? editableNotes : notes }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${notes?.title || "notes"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || "An error occurred while generating PDF")
    }
  }

  const handleSaveEdits = () => {
    if (editableNotes) {
      setNotes(editableNotes)
      setEditMode(false)
      setShowSuccessAnimation(true)

      setTimeout(() => {
        setShowSuccessAnimation(false)
      }, 3000)
    }
  }

  const handleEditSection = (sectionIndex: number, content: string[]) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    updatedNotes.sections[sectionIndex].content = content
    setEditableNotes(updatedNotes)
  }

  const handleEditSectionTitle = (sectionIndex: number, title: string) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    updatedNotes.sections[sectionIndex].title = title
    setEditableNotes(updatedNotes)
  }

  const handleEditSummary = (summary: string) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    updatedNotes.summary = summary
    setEditableNotes(updatedNotes)
  }

  const processingStages = [
    "Extracting video information",
    "Fetching transcript data",
    "Processing with AI",
    "Structuring notes",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0e8] via-[#f8f4ed] to-[#f5f0e8] pt-[12rem]">
      <div className="container mx-auto max-w-6xl mb-[12rem]">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
            <span className="bg-gradient-to-r from-[#8a7559] to-[#a68b5b] bg-clip-text text-transparent">Notivio</span>{" "}
            Video Notes
          </h1>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Transform any YouTube video into comprehensive, structured notes with our AI-powered tool. Perfect for
            students, researchers, and lifelong learners.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#8a7559] mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">
                Generate comprehensive notes in seconds using advanced AI processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#8a7559] mb-2">Study Ready</h3>
              <p className="text-gray-600 text-sm">
                Organized sections, key points, and summaries perfect for learning
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg mb-4">
                <FileSearch className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#8a7559] mb-2">Fully Editable</h3>
              <p className="text-gray-600 text-sm">
                Customize, edit, and organize your notes to fit your specific needs
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-12 border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20 pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-[#8a7559]">Enter YouTube Video URL</CardTitle>
                  <CardDescription className="text-base">
                    Paste any YouTube video URL to automatically generate structured notes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 pb-8">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`h-14 text-lg border-2 focus:ring-[#c6ac8f] focus:border-[#c6ac8f] transition-all duration-200 ${
                      url && !isUrlValid ? "border-red-300 bg-red-50" : "border-[#c6ac8f]/30"
                    } ${url && isUrlValid ? "border-[#c6ac8f] bg-green-50" : ""}`}
                    required
                  />
                  {url && !isUrlValid && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                  )}
                  {url && isUrlValid && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={loading || !isUrlValid}
                        className="w-full h-14 text-lg bg-gradient-to-r from-[#8a7559] to-[#a68b5b] hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Processing Video...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-3 h-5 w-5" />
                            Generate AI Notes
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extract and organize notes from this video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </form>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-gradient-to-r from-[#f5f0e8] to-white rounded-xl border border-[#c6ac8f]/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg">
                        <Brain className="h-5 w-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#8a7559]">{processingStages[processingStage]}</h3>
                        <p className="text-sm text-gray-600">AI is analyzing your video content...</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-[#8a7559]/10 text-[#8a7559]">
                      Step {processingStage + 1} of {processingStages.length}
                    </Badge>
                  </div>

                  <Progress value={processingProgress} className="h-2 bg-[#c6ac8f]/20" />

                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-600">{Math.round(processingProgress)}% complete</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 shadow-sm"
                >
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccessAnimation && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-6 right-6 bg-white border border-green-300 text-green-700 px-6 py-4 rounded-xl shadow-xl flex items-center z-50"
            >
              <CheckCircle2 className="h-6 w-6 mr-3 text-green-500" />
              <div>
                <p className="font-semibold">
                  {editMode ? "Changes saved successfully!" : "Notes generated successfully!"}
                </p>
                <p className="text-sm text-green-600">Your notes are ready for review</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Generated Notes */}
        {notes && (
          <motion.div
            ref={notesContainerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8"
          >
            {/* Notes Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-black">Generated Notes</h2>
                </div>
                <h3 className="text-xl text-[#8a7559] font-semibold mb-2">{notes.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{notes.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{notes.sections.length} sections</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="h-4 w-4" />
                    <span>AI Generated</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false)
                        setEditableNotes(JSON.parse(JSON.stringify(notes)))
                      }}
                      className="border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdits}
                      className="bg-gradient-to-r from-[#8a7559] to-[#a68b5b] hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 text-white shadow-lg"
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
                            onClick={() => setEditMode(true)}
                            className="border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559]"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Notes
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Customize and edit your notes</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleDownloadPDF}
                            className="bg-gradient-to-r from-[#8a7559] to-[#a68b5b] hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 text-white shadow-lg"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save your notes as a PDF file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>

            {/* Notes Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="mb-8 bg-white p-1 border border-[#c6ac8f]/30 shadow-lg rounded-xl">
                <TabsTrigger
                  value="structured"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Structured Notes
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Summary & Key Points
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Raw Transcript
                </TabsTrigger>
              </TabsList>


              <TabsContent value="structured">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-8">
                    {(editMode ? editableNotes : notes)?.sections.map((section, sIndex) => (
                      <motion.div
                        key={sIndex}
                        className="mb-8 border border-[#c6ac8f]/20 rounded-xl overflow-hidden shadow-lg bg-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: sIndex * 0.1 }}
                      >
                        <div
                          className="flex justify-between items-center p-6 bg-gradient-to-r from-[#f5f0e8] to-white cursor-pointer hover:from-[#f0e9d8] hover:to-[#f8f4ed] transition-all duration-200"
                          onClick={() => toggleSection(sIndex)}
                        >
                          {editMode ? (
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleEditSectionTitle(sIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xl font-bold w-full p-3 bg-white border border-[#c6ac8f]/30 rounded-lg focus:ring-[#c6ac8f] focus:border-[#c6ac8f] shadow-sm"
                            />
                          ) : (
                            <h3 className="text-xl font-bold text-[#8a7559] flex items-center">
                              <span className="w-8 h-8 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                {sIndex + 1}
                              </span>
                              {section.title}
                            </h3>
                          )}
                          <div className="text-[#8a7559] ml-4">
                            {expandedSections[sIndex] ? (
                              <ChevronUp className="h-6 w-6" />
                            ) : (
                              <ChevronDown className="h-6 w-6" />
                            )}
                          </div>
                        </div>

                        {expandedSections[sIndex] && (
                          <div className="p-6">
                            {editMode ? (
                              <div className="space-y-4">
                                {section.content.map((point, pIndex) => (
                                  <motion.div
                                    key={pIndex}
                                    className="flex items-start space-x-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                  >
                                    <textarea
                                      value={point}
                                      onChange={(e) => {
                                        const newContent = [...section.content]
                                        newContent[pIndex] = e.target.value
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="flex-1 p-4 border border-[#c6ac8f]/30 rounded-lg min-h-[100px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f] shadow-sm resize-none"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newContent = section.content.filter((_, i) => i !== pIndex)
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newContent = [...section.content, "New point"]
                                    handleEditSection(sIndex, newContent)
                                  }}
                                  className="mt-4 border-[#c6ac8f]/30 text-[#8a7559] hover:bg-[#f5f0e8] rounded-lg"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Point
                                </Button>
                              </div>
                            ) : (
                              <ul className="space-y-4">
                                {section.content.map((point, pIndex) => (
                                  <motion.li
                                    key={pIndex}
                                    className="flex items-start space-x-3 text-gray-700 leading-relaxed"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                  >
                                    <div className="w-2 h-2 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{point}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white py-6">
                    <div className="text-sm text-[#8a7559] flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center">
                        <Brain className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium">Notivio</span>
                      <span>- AI-powered notes from video content</span>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Summary */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                      <CardTitle className="text-xl text-[#8a7559] flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Video Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {editMode ? (
                        <textarea
                          value={editableNotes?.summary || ""}
                          onChange={(e) => handleEditSummary(e.target.value)}
                          className="w-full p-4 border border-[#c6ac8f]/30 rounded-lg min-h-[300px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f] shadow-sm resize-none"
                        />
                      ) : (
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{notes.summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Key Points */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                      <CardTitle className="text-xl text-[#8a7559] flex items-center">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Key Takeaways
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-4">
                        {notes.keyPoints.map((point, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start space-x-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span className="text-gray-700 leading-relaxed">{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                    <CardTitle className="text-xl text-[#8a7559] flex items-center">
                      <Youtube className="h-5 w-5 mr-2" />
                      Raw Transcript
                    </CardTitle>
                    <CardDescription>Original transcript extracted from the video</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="bg-gradient-to-r from-[#f5f0e8] to-white p-6 rounded-xl max-h-[600px] overflow-y-auto border border-[#c6ac8f]/30 shadow-inner">
                      <div className="whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
                        {notes.transcript}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
      <Footer/>
    </div>
  )
}
