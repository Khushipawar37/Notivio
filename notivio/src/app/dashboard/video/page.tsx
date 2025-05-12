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
  BookOpen,
  Youtube,
  FileText,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { extractVideoId, generateNotesFromTranscript } from "../../lib/videoUtils"

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
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const notesContainerRef = useRef<HTMLDivElement>(null)

  // Validate YouTube URL
  useEffect(() => {
    try {
      const videoId = extractVideoId(url)
      setIsUrlValid(!!videoId)
    } catch (e) {
      setIsUrlValid(false)
    }
  }, [url])

  // Simulate processing stages
  useEffect(() => {
    if (loading) {
      const stages = ["Fetching video data", "Extracting transcript", "Analyzing content", "Generating notes"]
      let currentStage = 0

      const interval = setInterval(() => {
        if (currentStage < stages.length - 1) {
          currentStage++
          setProcessingStage(currentStage)
        } else {
          clearInterval(interval)
        }
      }, 1500)

      return () => clearInterval(interval)
    } else {
      setProcessingStage(0)
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

      // Fetch video transcript and metadata
      const response = await fetch(`/api/video-transcription?videoId=${videoId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch video transcript")
      }

      const data = await response.json()

      // Process transcript into structured notes
      const generatedNotes = await generateNotesFromTranscript(data.transcript, data.title)
      setNotes(generatedNotes)
      setEditableNotes(JSON.parse(JSON.stringify(generatedNotes)))
      setShowSuccessAnimation(true)

      // Hide success animation after 3 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "An error occurred while processing the video")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/pdf/generate", {
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

      // Hide success animation after 3 seconds
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

  const handleEditSubsection = (sectionIndex: number, subsectionIndex: number, content: string[]) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    if (updatedNotes.sections[sectionIndex].subsections) {
      updatedNotes.sections[sectionIndex].subsections![subsectionIndex].content = content
      setEditableNotes(updatedNotes)
    }
  }

  const handleEditSectionTitle = (sectionIndex: number, title: string) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    updatedNotes.sections[sectionIndex].title = title
    setEditableNotes(updatedNotes)
  }

  const handleEditSubsectionTitle = (sectionIndex: number, subsectionIndex: number, title: string) => {
    if (!editableNotes) return

    const updatedNotes = { ...editableNotes }
    if (updatedNotes.sections[sectionIndex].subsections) {
      updatedNotes.sections[sectionIndex].subsections![subsectionIndex].title = title
      setEditableNotes(updatedNotes)
    }
  }

  const processingStages = ["Fetching video data", "Extracting transcript", "Analyzing content", "Generating notes"]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e8] via-[#f5f0e8] to-[#f5f0e8]  py-[12rem] px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            <span className="text-[#8a7559]">Notivio</span> Video Notes
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Transform any YouTube video into structured, editable notes with our AI-powered tool
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-12 border border-[#c6ac8f]/30 shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-[#f5f0e8] to-white border-b border-[#c6ac8f]/20">
              <CardTitle className="text-2xl text-[#8a7559] flex items-center">
                <Youtube className="mr-2 h-5 w-5" />
                Enter YouTube Video URL
              </CardTitle>
              <CardDescription>Paste a YouTube video URL to automatically generate structured notes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`flex-1 border-2 focus:ring-[#c6ac8f] focus:border-[#c6ac8f] ${
                      url && !isUrlValid ? "border-red-300" : "border-[#c6ac8f]/30"
                    } ${url && isUrlValid ? "border-[#c6ac8f]" : ""}`}
                    required
                  />
                  {url && !isUrlValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                  {url && isUrlValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        disabled={loading || !isUrlValid}
                        className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Generate Notes
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 bg-[#f5f0e8] rounded-lg p-4 border border-[#c6ac8f]/30"
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#8a7559] font-medium">Processing your video</h3>
                      <div className="text-sm text-gray-500">
                        Stage {processingStage + 1}/{processingStages.length}
                      </div>
                    </div>

                    <div className="w-full bg-white rounded-full h-2.5">
                      <motion.div
                        className="bg-[#8a7559] h-2.5 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((processingStage + 1) / processingStages.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    <div className="text-sm text-gray-700">{processingStages[processingStage]}...</div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 text-red-600 rounded-md flex items-center border border-red-200"
                >
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {showSuccessAnimation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md shadow-md flex items-center z-50"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {editMode ? "Changes saved successfully!" : "Notes generated successfully!"}
            </motion.div>
          )}
        </AnimatePresence>

        {notes && (
          <motion.div
            ref={notesContainerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-black">
                  <span className="text-[#8a7559]">Notes:</span> {notes.title}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {editMode ? "Editing mode - Make changes to your notes" : "AI-generated notes from your video"}
                </p>
              </div>
              <div className="flex gap-2">
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
                    <Button onClick={handleSaveEdits} className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white">
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
                          <Button onClick={handleDownloadPDF} className="bg-[#8a7559] hover:bg-[#8a7559]/90 text-white">
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="mb-6 bg-[#f5f0e8] p-1 border border-[#c6ac8f]/30">
                <TabsTrigger
                  value="structured"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#8a7559] data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Structured Notes
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#8a7559] data-[state=active]:shadow-sm"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Raw Transcript
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
                <Card className="border border-[#c6ac8f]/30 shadow-md bg-white">
                  <CardContent className="pt-6">
                    {(editMode ? editableNotes : notes)?.sections.map((section, sIndex) => (
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
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleEditSectionTitle(sIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xl font-bold w-full p-2 bg-white border border-[#c6ac8f]/30 rounded-md focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                            />
                          ) : (
                            <h3 className="text-xl font-bold text-[#8a7559]">{section.title}</h3>
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
                                    transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                  >
                                    <textarea
                                      value={point}
                                      onChange={(e) => {
                                        const newContent = [...section.content]
                                        newContent[pIndex] = e.target.value
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="w-full p-3 border border-[#c6ac8f]/30 rounded-md min-h-[80px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newContent = section.content.filter((_, i) => i !== pIndex)
                                        handleEditSection(sIndex, newContent)
                                      }}
                                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                                    transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                  >
                                    {point}
                                  </motion.li>
                                ))}
                              </ul>
                            )}

                            {section.subsections &&
                              section.subsections.map((subsection, ssIndex) => (
                                <motion.div
                                  key={ssIndex}
                                  className="ml-6 mb-4 p-3 border-l-2 border-[#c6ac8f]/30"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, delay: 0.2 + ssIndex * 0.1 }}
                                >
                                  {editMode ? (
                                    <input
                                      type="text"
                                      value={subsection.title}
                                      onChange={(e) => handleEditSubsectionTitle(sIndex, ssIndex, e.target.value)}
                                      className="text-lg font-semibold mb-3 w-full p-2 border border-[#c6ac8f]/30 rounded-md focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                                    />
                                  ) : (
                                    <h4 className="text-lg font-semibold mb-3 text-[#8a7559]">{subsection.title}</h4>
                                  )}

                                  {editMode ? (
                                    <div className="pl-4 space-y-3">
                                      {subsection.content.map((point, pIndex) => (
                                        <motion.div
                                          key={pIndex}
                                          className="flex items-start"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                        >
                                          <textarea
                                            value={point}
                                            onChange={(e) => {
                                              const newContent = [...subsection.content]
                                              newContent[pIndex] = e.target.value
                                              handleEditSubsection(sIndex, ssIndex, newContent)
                                            }}
                                            className="w-full p-3 border border-[#c6ac8f]/30 rounded-md min-h-[80px] focus:ring-[#c6ac8f] focus:border-[#c6ac8f]"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const newContent = subsection.content.filter((_, i) => i !== pIndex)
                                              handleEditSubsection(sIndex, ssIndex, newContent)
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </motion.div>
                                      ))}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newContent = [...subsection.content, "New point"]
                                          handleEditSubsection(sIndex, ssIndex, newContent)
                                        }}
                                        className="mt-2 border-[#c6ac8f]/30 text-[#8a7559] hover:bg-[#f5f0e8]"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Point
                                      </Button>
                                    </div>
                                  ) : (
                                    <ul className="list-disc pl-8 space-y-3">
                                      {subsection.content.map((point, pIndex) => (
                                        <motion.li
                                          key={pIndex}
                                          className="text-gray-700"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3, delay: pIndex * 0.05 }}
                                        >
                                          {point}
                                        </motion.li>
                                      ))}
                                    </ul>
                                  )}
                                </motion.div>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-[#c6ac8f]/20 bg-[#f5f0e8]/50 py-4">
                    <div className="text-sm text-[#8a7559]">
                      <span className="font-medium">Notivio</span> - AI-powered notes from video content
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="border border-[#c6ac8f]/30 shadow-md bg-white">
                  <CardContent className="pt-6">
                    <motion.div
                      className="bg-[#f5f0e8] p-6 rounded-md max-h-[600px] overflow-y-auto border border-[#c6ac8f]/30 shadow-inner"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-[#8a7559]">Raw Transcript</h3>
                      <div className="whitespace-pre-wrap text-gray-700 font-mono text-sm">{notes.transcript}</div>
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <Card className="border border-[#c6ac8f]/30 shadow-md bg-white">
                  <CardContent className="pt-6">
                    <motion.div
                      className="bg-[#f5f0e8] p-6 rounded-md border border-[#c6ac8f]/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-[#8a7559]">Summary</h3>
                      <div className="p-4 bg-white rounded-md border border-[#c6ac8f]/20 shadow-inner">
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{notes.summary}</p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  )
}
