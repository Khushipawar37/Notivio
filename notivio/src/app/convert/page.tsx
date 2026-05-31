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
  learningObjectives: string[]
  keyInsights: string[]
}

type Notes = {
  title: string
  transcript: string
  sections: NoteSection[]
  summary: string
  keyPoints: string[]
  duration: string
  contentType: string
  difficulty: string
  estimatedStudyTime: string
  prerequisites: string[]
  nextSteps: string[]
  studyGuide: {
    reviewQuestions: string[]
    practiceExercises: string[]
    memoryAids: string[]
    connections: string[]
    advancedTopics: string[]
  }
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
  const [chunkingProgress, setChunkingProgress] = useState({
    currentChunk: 0,
    totalChunks: 0,
    stage: "preparing" as "preparing" | "chunking" | "processing" | "combining",
    message: "",
    isChunked: false,
  })

  const formRef = useRef<HTMLFormElement>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)

  const getErrorMessage = (err: unknown, fallback: string) => {
    return err instanceof Error ? err.message : fallback
  }

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

  useEffect(() => {
    if (loading) {
      if (chunkingProgress.isChunked) {
        // For chunked processing, show real progress
        const totalProgress =
          chunkingProgress.totalChunks > 0
            ? Math.round((chunkingProgress.currentChunk / chunkingProgress.totalChunks) * 100)
            : 0
        setProcessingProgress(totalProgress)
        setProcessingStage(0) // Use first stage for chunked processing display
      } else {
        // Original simulation for non-chunked processing
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
      }
    } else {
      setProcessingStage(0)
      setProcessingProgress(0)
      setChunkingProgress({
        currentChunk: 0,
        totalChunks: 0,
        stage: "preparing",
        message: "",
        isChunked: false,
      })
    }
  }, [loading, chunkingProgress.currentChunk, chunkingProgress.totalChunks, chunkingProgress.isChunked])

  // Scroll to notes when generated
  useEffect(() => {
    if (notes && notesContainerRef.current) {
      notesContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
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
    setChunkingProgress({
      currentChunk: 0,
      totalChunks: 0,
      stage: "preparing",
      message: "Preparing to process video...",
      isChunked: false,
    })

    try {
      const videoId = extractVideoId(url)

      if (!videoId) {
        throw new Error("Invalid YouTube URL")
      }

      console.log("Fetching transcript for video ID:", videoId)
      setChunkingProgress((prev) => ({
        ...prev,
        stage: "preparing",
        message: "Fetching video transcript...",
      }))

      // Fetch video transcript and metadata
      const transcriptResponse = await fetch(`/api/video-transcript?videoId=${videoId}`)

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text()
        console.error("Transcript API error:", errorText)

        // Try to parse the error response for better user feedback
        let errorMessage = "Failed to fetch video transcript. Please check if the video has captions enabled."
        let suggestions: string[] = []

        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.suggestions && Array.isArray(errorData.suggestions)) {
            suggestions = errorData.suggestions
          }
        } catch (parseErr) {
          // If we can't parse the error, use the default message
          console.warn("Could not parse error response:", parseErr)
        }

        // Create a more helpful error message
        if (suggestions.length > 0) {
          errorMessage += "\n\nSuggestions:\n" + suggestions.map((s) => `• ${s}`).join("\n")
        }

        throw new Error(errorMessage)
      }

      const transcriptData = await transcriptResponse.json()
      console.log("Transcript data received:", transcriptData)

      const transcriptLength = transcriptData.transcript?.length || 0
      const willUseChunking = transcriptLength > 8000 // Threshold for chunking

      if (willUseChunking) {
        const estimatedChunks = Math.ceil(transcriptLength / 8000)
        setChunkingProgress((prev) => ({
          ...prev,
          totalChunks: estimatedChunks,
          isChunked: true,
          stage: "chunking",
          message: `Processing large transcript in ${estimatedChunks} chunks...`,
        }))
      } else {
        setChunkingProgress((prev) => ({
          ...prev,
          stage: "processing",
          message: "Generating comprehensive notes...",
          isChunked: false,
        }))
      }

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

      if (chunkingProgress.isChunked) {
        setChunkingProgress((prev) => ({
          ...prev,
          stage: "combining",
          message: "Combining results into final notes...",
        }))
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
    } catch (err: unknown) {
      console.error("Error in handleSubmit:", err)
      setError(getErrorMessage(err, "An error occurred while processing the video"))
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An error occurred while generating PDF"))
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

  const getCurrentProcessingMessage = () => {
    if (chunkingProgress.isChunked) {
      return chunkingProgress.message
    }
    return processingStages[processingStage]
  }

  const getProcessingStageDescription = () => {
    if (chunkingProgress.isChunked) {
      switch (chunkingProgress.stage) {
        case "preparing":
          return "Preparing transcript for processing..."
        case "chunking":
          return `Breaking down content into manageable sections...`
        case "processing":
          return `Processing chunk ${chunkingProgress.currentChunk + 1} of ${chunkingProgress.totalChunks}...`
        case "combining":
          return "Combining all sections into comprehensive notes..."
        default:
          return "Processing your video..."
      }
    }
    return "AI is analyzing your video content..."
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#f5f0e8] via-[#f8f4ed] to-[#f5f0e8] pt-28 sm:pt-36 lg:pt-[12rem]">
      <div className="container mx-auto mb-20 max-w-6xl px-3 sm:mb-[12rem] sm:px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center sm:mb-16"
        >
          <h1 className="mb-4 text-4xl font-bold leading-tight text-black sm:mb-6 sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-[#8a7559] to-[#a68b5b] bg-clip-text text-transparent">Notivio</span>{" "}
            Video Notes
          </h1>

          <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-700 sm:text-xl">
            Transform any YouTube video into comprehensive, structured notes with our AI-powered tool. Perfect for
            students, researchers, and lifelong learners.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10 grid grid-cols-1 gap-4 sm:mb-16 md:grid-cols-3 md:gap-6"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center sm:p-6">
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
            <CardContent className="p-4 text-center sm:p-6">
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
            <CardContent className="p-4 text-center sm:p-6">
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
          <Card className="mb-10 overflow-hidden border-0 bg-white/90 shadow-xl backdrop-blur-sm sm:mb-12">
            <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white pb-5 sm:pb-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-gradient-to-r from-[#8a7559] to-[#a68b5b] p-2">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl leading-tight text-[#8a7559] sm:text-2xl">Enter YouTube Video URL</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Paste any YouTube video URL to automatically generate structured notes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8">
              {/* Helpful Tips */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`h-12 border-2 pr-11 text-sm transition-all duration-200 focus:border-[#c6ac8f] focus:ring-[#c6ac8f] sm:h-14 sm:text-lg ${url && !isUrlValid ? "border-red-300 bg-red-50" : "border-[#c6ac8f]/30"
                      } ${url && isUrlValid ? "border-[#c6ac8f] bg-[#f5f1eb]" : ""}`}
                    required
                  />
                  {url && !isUrlValid && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                  )}
                  {url && isUrlValid && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8b7355]">
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
                        className="h-12 w-full bg-gradient-to-r from-[#8a7559] to-[#a68b5b] text-sm text-white shadow-lg transition-all duration-300 hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 hover:shadow-xl sm:h-14 sm:text-lg"
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
                  className="mt-8 rounded-xl border border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white p-4 sm:p-6"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-lg bg-gradient-to-r from-[#8a7559] to-[#a68b5b] p-2">
                        <Brain className="h-5 w-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#8a7559]">{getCurrentProcessingMessage()}</h3>
                        <p className="text-sm text-gray-600">{getProcessingStageDescription()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-[#8a7559]/10 text-[#8a7559]">
                      {chunkingProgress.isChunked
                        ? `${chunkingProgress.stage.charAt(0).toUpperCase() + chunkingProgress.stage.slice(1)}`
                        : `Step ${processingStage + 1} of ${processingStages.length}`}
                    </Badge>
                  </div>

                  <Progress value={processingProgress} className="h-2 bg-[#c6ac8f]/20" />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-gray-600">{Math.round(processingProgress)}% complete</span>
                    {chunkingProgress.isChunked && chunkingProgress.totalChunks > 0 && (
                      <span className="text-sm text-gray-600">
                        {chunkingProgress.stage === "processing"
                          ? `Chunk ${chunkingProgress.currentChunk + 1}/${chunkingProgress.totalChunks}`
                          : `${chunkingProgress.totalChunks} chunks total`}
                      </span>
                    )}
                  </div>

                  {chunkingProgress.isChunked && chunkingProgress.totalChunks > 1 && (
                    <div className="mt-3 p-3 bg-[#f5f1eb] rounded-lg border border-[#c6ac8f]/30">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#8b7355]" />
                        <span className="text-sm text-[#8b7355] font-medium">
                          Large video detected - Processing in chunks for better quality
                        </span>
                      </div>
                      <p className="text-xs text-[#8b7355]/80 mt-1">
                        Estimated time: {Math.ceil(chunkingProgress.totalChunks * 0.5)}-
                        {Math.ceil(chunkingProgress.totalChunks * 1)} minutes
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm"
                >
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium mb-2">{error.split("\n\n")[0]}</div>
                    {error.includes("Suggestions:") && (
                      <div className="text-sm text-red-600 mt-2">
                        {error
                          .split("Suggestions:")[1]
                          ?.split("\n")
                          .filter((line) => line.trim().startsWith("•"))
                          .map((suggestion, index) => (
                            <div key={index} className="ml-4">
                              {suggestion.trim()}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
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
              className="fixed left-3 right-3 top-20 z-50 flex items-center rounded-xl border border-[#c6ac8f] bg-white px-4 py-3 text-[#8b7355] shadow-xl sm:left-auto sm:right-6 sm:top-6 sm:px-6 sm:py-4"
            >
              <CheckCircle2 className="h-6 w-6 mr-3 text-[#8b7355]" />
              <div>
                <p className="font-semibold">
                  {editMode ? "Changes saved successfully!" : "Notes generated successfully!"}
                </p>
                <p className="text-sm text-[#8b7355]/80">Your notes are ready for review</p>
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
            className="mt-8 min-w-0"
          >
            {/* Notes Header */}
            <div className="mb-6 flex min-w-0 flex-col items-start justify-between gap-5 lg:mb-8 lg:flex-row lg:items-center lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-gradient-to-r from-[#8a7559] to-[#a68b5b] p-2">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="min-w-0 text-2xl font-bold leading-tight text-black sm:text-3xl">Generated Notes</h2>
                </div>
                <h3 className="mb-3 max-w-full break-words text-base font-semibold leading-snug text-[#8a7559] sm:text-xl">{notes.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{notes.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{notes.sections.length} sections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>AI Generated</span>
                  </div>
                  {notes.contentType && (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-[#f5f1eb] text-[#8b7355] text-xs">
                        {notes.contentType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </div>
                  )}
                  {notes.difficulty && (
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${notes.difficulty === "beginner"
                          ? "bg-green-100 text-green-700"
                          : notes.difficulty === "intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {notes.difficulty.charAt(0).toUpperCase() + notes.difficulty.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {notes.estimatedStudyTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{notes.estimatedStudyTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 sm:gap-3">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false)
                        setEditableNotes(JSON.parse(JSON.stringify(notes)))
                      }}
                      className="w-full border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559] sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdits}
                      className="w-full bg-gradient-to-r from-[#8a7559] to-[#a68b5b] text-white shadow-lg hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 sm:w-auto"
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
                            className="w-full border-[#c6ac8f]/30 hover:bg-[#f5f0e8] hover:text-[#8a7559] sm:w-auto"
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
                            className="w-full bg-gradient-to-r from-[#8a7559] to-[#a68b5b] text-white shadow-lg hover:from-[#8a7559]/90 hover:to-[#a68b5b]/90 sm:w-auto"
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 min-w-0">
              <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 rounded-xl border border-[#c6ac8f]/30 bg-white p-1 shadow-lg sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <TabsTrigger
                  value="structured"
                  className="min-w-0 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md sm:px-4 sm:py-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Structured Notes
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="min-w-0 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md sm:px-4 sm:py-3"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Summary & Key Points
                </TabsTrigger>
                <TabsTrigger
                  value="study"
                  className="min-w-0 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md sm:px-4 sm:py-3"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Study Guide
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="min-w-0 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8a7559] data-[state=active]:to-[#a68b5b] data-[state=active]:text-white data-[state=active]:shadow-md sm:px-4 sm:py-3"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Raw Transcript
                </TabsTrigger>
              </TabsList>

              <TabsContent value="structured">
                <Card className="border-0 bg-white/90 shadow-xl backdrop-blur-sm">
                  <CardContent className="px-4 pt-5 sm:px-6 sm:pt-8">
                    {(editMode ? editableNotes : notes)?.sections.map((section, sIndex) => (
                      <motion.div
                        key={sIndex}
                        className="mb-5 overflow-hidden rounded-xl border border-[#c6ac8f]/20 bg-white shadow-lg sm:mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: sIndex * 0.1 }}
                      >
                        <div
                          className="flex cursor-pointer items-center justify-between gap-3 bg-gradient-to-r from-[#f5f0e8] to-white p-4 transition-all duration-200 hover:from-[#f0e9d8] hover:to-[#f8f4ed] sm:p-6"
                          onClick={() => toggleSection(sIndex)}
                        >
                          {editMode ? (
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleEditSectionTitle(sIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full rounded-lg border border-[#c6ac8f]/30 bg-white p-3 text-base font-bold shadow-sm focus:border-[#c6ac8f] focus:ring-[#c6ac8f] sm:text-xl"
                            />
                          ) : (
                            <h3 className="flex min-w-0 items-start text-base font-bold leading-snug text-[#8a7559] sm:items-center sm:text-xl">
                              <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#8a7559] to-[#a68b5b] text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
                                {sIndex + 1}
                              </span>
                              <span className="min-w-0 break-words">{section.title}</span>
                            </h3>
                          )}
                          <div className="ml-2 shrink-0 text-[#8a7559] sm:ml-4">
                            {expandedSections[sIndex] ? (
                              <ChevronUp className="h-6 w-6" />
                            ) : (
                              <ChevronDown className="h-6 w-6" />
                            )}
                          </div>
                        </div>

                        {expandedSections[sIndex] && (
                          <div className="p-4 sm:p-6">
                            {editMode ? (
                              <div className="space-y-4">
                                {section.content.map((point, pIndex) => (
                                  <motion.div
                                    key={pIndex}
                                    className="flex items-start gap-2 sm:gap-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: pIndex * 0.05,
                                    }}
                                  >
                                    <textarea
                                      value={point}
                                      onChange={(e) => {
                                        const newContent = [...section.content]
                                        newContent[pIndex] = e.target.value
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="min-h-[100px] min-w-0 flex-1 resize-none rounded-lg border border-[#c6ac8f]/30 p-3 shadow-sm focus:border-[#c6ac8f] focus:ring-[#c6ac8f] sm:p-4"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newContent = section.content.filter((_, i) => i !== pIndex)
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="shrink-0 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
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
                                  className="mt-4 rounded-lg border-[#c6ac8f]/30 text-[#8a7559] hover:bg-[#f5f0e8]"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Point
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <ul className="space-y-4">
                                  {section.content.map((point, pIndex) => (
                                    <motion.li
                                      key={pIndex}
                                    className="flex items-start gap-3 text-sm leading-relaxed text-gray-700 sm:text-base"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        duration: 0.3,
                                        delay: pIndex * 0.05,
                                      }}
                                    >
                                      <div className="w-2 h-2 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full mt-2 flex-shrink-0"></div>
                                      <span>{point}</span>
                                    </motion.li>
                                  ))}
                                </ul>

                                {/* Learning Objectives */}
                                {section.learningObjectives && section.learningObjectives.length > 0 && (
                                  <div className="mt-6 rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:p-4">
                                    <h4 className="mb-3 flex items-center text-sm font-semibold text-[#8b7355] sm:text-base">
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Learning Objectives
                                    </h4>
                                    <ul className="space-y-2">
                                      {section.learningObjectives.map((objective, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-[#8b7355]">
                                          <div className="w-2 h-2 bg-[#c6ac8f] rounded-full mt-2 flex-shrink-0"></div>
                                          <span>{objective}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Key Insights */}
                                {section.keyInsights && section.keyInsights.length > 0 && (
                                  <div className="mt-4 rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:p-4">
                                    <h4 className="mb-3 flex items-center text-sm font-semibold text-[#8b7355] sm:text-base">
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Key Insights
                                    </h4>
                                    <ul className="space-y-2">
                                      {section.keyInsights.map((insight, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-[#8b7355]">
                                          <div className="w-2 h-2 bg-[#c6ac8f] rounded-full mt-2 flex-shrink-0"></div>
                                          <span>{insight}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2 border-t border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
                    <div className="flex items-center gap-2 text-xs text-[#8a7559] sm:text-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#8a7559] to-[#a68b5b]">
                        <Brain className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium">Notivio</span>
                      <span className="break-words">- AI-powered notes from video content</span>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
                  {/* Summary */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Video Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      {editMode ? (
                        <textarea
                          value={editableNotes?.summary || ""}
                          onChange={(e) => handleEditSummary(e.target.value)}
                          className="min-h-[240px] w-full resize-none rounded-lg border border-[#c6ac8f]/30 p-3 shadow-sm focus:border-[#c6ac8f] focus:ring-[#c6ac8f] sm:min-h-[300px] sm:p-4"
                        />
                      ) : (
                        <div className="prose prose-gray max-w-none">
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 sm:text-base">{notes.summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Key Points */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Key Takeaways
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <ul className="space-y-4">
                        {notes.keyPoints.map((point, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <span className="break-words text-sm leading-relaxed text-gray-700 sm:text-base">{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Prerequisites & Next Steps */}
                {(notes.prerequisites?.length > 0 || notes.nextSteps?.length > 0) && (
                  <div className="mt-5 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-2 lg:gap-8">
                    {notes.prerequisites?.length > 0 && (
                      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                          <CardTitle className="text-xl text-[#8a7559] flex items-center">
                            <BookOpen className="h-5 w-4 mr-2" />
                            Prerequisites
                          </CardTitle>
                          <CardDescription>
                            Knowledge and skills you should have before studying this material
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ul className="space-y-3">
                            {notes.prerequisites.map((prereq, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start space-x-3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <div className="w-5 h-5 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                  ✓
                                </div>
                                <span className="text-gray-700 leading-relaxed">{prereq}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {notes.nextSteps?.length > 0 && (
                      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
                          <CardTitle className="text-xl text-[#8a7559] flex items-center">
                            <Zap className="h-5 w-4 mr-2" />
                            Next Steps
                          </CardTitle>
                          <CardDescription>Recommended actions to continue your learning journey</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ul className="space-y-3">
                            {notes.nextSteps.map((step, index) => (
                              <motion.li
                                key={index}
                                className="flex items-start space-x-3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <div className="w-5 h-5 bg-gradient-to-r from-[#8a7559] to-[#a68b5b] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                  →
                                </div>
                                <span className="text-gray-700 leading-relaxed">{step}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="study">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-8">
                  {/* Review Questions */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Review Questions
                      </CardTitle>
                      <CardDescription>Test your understanding with these thought-provoking questions</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <div className="space-y-4">
                        {notes.studyGuide?.reviewQuestions?.map((question, index) => (
                          <motion.div
                            key={index}
                            className="rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:p-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c6ac8f] text-sm font-bold text-white">
                                Q{index + 1}
                              </div>
                              <p className="break-words text-sm leading-relaxed text-gray-700 sm:text-base">{question}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Practice Exercises */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <Zap className="h-5 w-5 mr-2" />
                        Practice Exercises
                      </CardTitle>
                      <CardDescription>Apply your knowledge with these hands-on activities</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <div className="space-y-4">
                        {notes.studyGuide?.practiceExercises?.map((exercise, index) => (
                          <motion.div
                            key={index}
                            className="rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:p-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c6ac8f] text-sm font-bold text-white">
                                {index + 1}
                              </div>
                              <p className="break-words text-sm leading-relaxed text-gray-700 sm:text-base">{exercise}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Memory Aids */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <Brain className="h-5 w-5 mr-2" />
                        Memory Aids
                      </CardTitle>
                      <CardDescription>Mnemonics and strategies to help you remember key concepts</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <div className="space-y-3">
                        {notes.studyGuide?.memoryAids?.map((aid, index) => (
                          <motion.div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c6ac8f]">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <p className="break-words text-sm font-medium text-gray-700 sm:text-base">{aid}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connections */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <FileSearch className="h-5 w-5 mr-2" />
                        Real-World Connections
                      </CardTitle>
                      <CardDescription>How this knowledge connects to other subjects and applications</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <div className="space-y-3">
                        {notes.studyGuide?.connections?.map((connection, index) => (
                          <motion.div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c6ac8f]">
                              <Plus className="h-4 w-4 text-white" />
                            </div>
                            <p className="break-words text-sm text-gray-700 sm:text-base">{connection}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Topics */}
                  <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                      <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                        <Brain className="h-5 w-5 mr-2" />
                        Advanced Topics
                      </CardTitle>
                      <CardDescription>Areas for further study and deeper exploration</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                      <div className="space-y-3">
                        {notes.studyGuide?.advancedTopics?.map((topic, index) => (
                          <motion.div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-[#c6ac8f]/30 bg-[#f5f1eb] p-3 sm:items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c6ac8f]">
                              <Brain className="h-4 w-4 text-white" />
                            </div>
                            <p className="break-words text-sm text-gray-700 sm:text-base">{topic}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white">
                    <CardTitle className="flex items-center text-lg text-[#8a7559] sm:text-xl">
                      <Youtube className="h-5 w-5 mr-2" />
                      Raw Transcript
                    </CardTitle>
                    <CardDescription>Original transcript extracted from the video</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
                    <div className="max-h-[600px] overflow-y-auto rounded-xl border border-[#c6ac8f]/20 bg-gradient-to-r from-[#f5f0e8] to-white p-3 shadow-inner sm:p-6">
                      <div className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-700 sm:text-sm">
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
      <Footer />
    </div>
  )
}
