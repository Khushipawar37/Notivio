"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Sparkles, FileText, Brain, Target, Layers, Loader2, Zap } from "lucide-react"

interface AIAssistantPanelProps {
  content: string
  selectedText: string
  onContentUpdate: (content: string) => void
}

interface AIFeature {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  action: () => void
  loading?: boolean
}

interface Flashcard {
  id: string
  question: string
  answer: string
  created: Date
}

export function AIAssistantPanel({ content, selectedText, onContentUpdate }: AIAssistantPanelProps) {
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [summary, setSummary] = useState("")
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [showStructureDialog, setShowStructureDialog] = useState(false)
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false)
  const [structureSuggestions, setStructureSuggestions] = useState<string[]>([])
  const [enhancedText, setEnhancedText] = useState("")

  const handleSummarizeNotes = useCallback(async () => {
    if (!content.trim()) return

    setAiLoading("summarize")
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockSummary = `This comprehensive note covers several key areas: fundamental concepts and definitions, practical applications with real-world examples, detailed analysis of methodologies, and conclusions with actionable insights. The content demonstrates a thorough understanding of the subject matter with clear explanations and supporting evidence.`

      setSummary(mockSummary)
      setShowSummaryDialog(true)
    } catch (error) {
      console.error("Error summarizing notes:", error)
    } finally {
      setAiLoading(null)
    }
  }, [content])

  const handleGenerateFlashcards = useCallback(async () => {
    if (!selectedText && !content.trim()) return

    setAiLoading("flashcards")
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockFlashcards = [
        {
          id: Date.now().toString(),
          question: "What are the main concepts discussed in this section?",
          answer:
            "The main concepts include fundamental principles, practical applications, and methodological approaches that form the foundation of the subject matter.",
          created: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          question: "How do these concepts relate to real-world applications?",
          answer:
            "These concepts provide a framework for understanding practical scenarios and can be applied to solve complex problems in various domains.",
          created: new Date(),
        },
        {
          id: (Date.now() + 2).toString(),
          question: "What are the key takeaways from this material?",
          answer:
            "The key takeaways emphasize the importance of understanding core principles, applying methodical approaches, and connecting theory to practice.",
          created: new Date(),
        },
      ]

      setFlashcards((prev) => [...prev, ...mockFlashcards])
      setShowFlashcardDialog(true)
    } catch (error) {
      console.error("Error generating flashcards:", error)
    } finally {
      setAiLoading(null)
    }
  }, [selectedText, content])

  const handleSmartStructuring = useCallback(async () => {
    if (!content.trim()) return

    setAiLoading("structure")
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockSuggestions = [
        "Executive Summary",
        "Introduction and Background",
        "Key Concepts and Definitions",
        "Methodology and Approach",
        "Practical Applications and Examples",
        "Analysis and Discussion",
        "Conclusions and Recommendations",
        "Future Considerations",
      ]

      setStructureSuggestions(mockSuggestions)
      setShowStructureDialog(true)
    } catch (error) {
      console.error("Error generating structure:", error)
    } finally {
      setAiLoading(null)
    }
  }, [content])

  const handleEnhanceText = useCallback(async () => {
    if (!selectedText && !content.trim()) return

    setAiLoading("enhance")
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const textToEnhance = selectedText || content.slice(0, 200) + "..."
      const mockEnhanced = `Enhanced version: ${textToEnhance}\n\nThis enhanced text provides greater clarity, improved structure, and more comprehensive explanations. Key improvements include better flow, clearer terminology, and additional context that helps readers understand the concepts more effectively.`

      setEnhancedText(mockEnhanced)
      setShowEnhanceDialog(true)
    } catch (error) {
      console.error("Error enhancing text:", error)
    } finally {
      setAiLoading(null)
    }
  }, [selectedText, content])

  const handleGenerateQuestions = useCallback(async () => {
    if (!content.trim()) return

    setAiLoading("questions")
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const questions = [
        "What are the fundamental principles discussed in this material?",
        "How can these concepts be applied in practical scenarios?",
        "What are the potential challenges in implementing these ideas?",
        "How do these concepts relate to other areas of study?",
        "What are the implications for future research or development?",
      ]

      const questionsHTML = `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #d9c6b8; border-radius: 8px; background: #f5f0e8;">
          <h3 style="color: #8a7559; margin-bottom: 10px;">Review Questions</h3>
          <ol style="color: #333; line-height: 1.6;">
            ${questions.map((q) => `<li style="margin-bottom: 8px;">${q}</li>`).join("")}
          </ol>
        </div>
      `

      onContentUpdate(content + questionsHTML)
    } catch (error) {
      console.error("Error generating questions:", error)
    } finally {
      setAiLoading(null)
    }
  }, [content, onContentUpdate])

  const aiFeatures: AIFeature[] = [
    {
      id: "summarize",
      name: "AI Summarize",
      description: "Create a concise summary of your notes",
      icon: <FileText className="h-4 w-4" />,
      action: handleSummarizeNotes,
      loading: aiLoading === "summarize",
    },
    {
      id: "flashcards",
      name: "Generate Flashcards",
      description: "Convert content into study flashcards",
      icon: <Brain className="h-4 w-4" />,
      action: handleGenerateFlashcards,
      loading: aiLoading === "flashcards",
    },
    {
      id: "structure",
      name: "Smart Structure",
      description: "AI suggests headings and organization",
      icon: <Layers className="h-4 w-4" />,
      action: handleSmartStructuring,
      loading: aiLoading === "structure",
    },
    {
      id: "questions",
      name: "Review Questions",
      description: "Generate quiz-style questions from content",
      icon: <Target className="h-4 w-4" />,
      action: handleGenerateQuestions,
      loading: aiLoading === "questions",
    },
    {
      id: "enhance",
      name: "Enhance Text",
      description: "Improve clarity and readability",
      icon: <Zap className="h-4 w-4" />,
      action: handleEnhanceText,
      loading: aiLoading === "enhance",
    },
  ]

  return (
    <>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Assistant
          </CardTitle>
          <CardDescription>Enhance your notes with AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiFeatures.map((feature) => (
            <Button
              key={feature.id}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left bg-transparent hover:bg-muted/50"
              onClick={feature.action}
              disabled={feature.loading || !!aiLoading}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {feature.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : feature.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{feature.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{feature.description}</div>
                </div>
              </div>
            </Button>
          ))}

          <Separator className="my-4" />

          {/* Quick Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Words</span>
              <span className="font-medium">{content.split(/\s+/).filter((word) => word.length > 0).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Characters</span>
              <span className="font-medium">{content.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flashcards</span>
              <span className="font-medium">{flashcards.length}</span>
            </div>
            {selectedText && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Selected</span>
                <span className="font-medium">{selectedText.length} chars</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              AI Generated Summary
            </DialogTitle>
            <DialogDescription>Here's a concise summary of your notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const summaryHTML = `<div style="margin: 20px 0; padding: 15px; border: 1px solid #d9c6b8; border-radius: 8px; background: #f5f0e8;"><h3 style="color: #8a7559; margin-bottom: 10px;">Summary</h3><p style="color: #333; line-height: 1.6;">${summary}</p></div>`
                  onContentUpdate(content + summaryHTML)
                  setShowSummaryDialog(false)
                }}
              >
                Add to Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flashcards Dialog */}
      <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Generated Flashcards
            </DialogTitle>
            <DialogDescription>Review and edit your AI-generated flashcards</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {flashcards.slice(-3).map((flashcard, index) => (
              <Card key={flashcard.id} className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Question {index + 1}</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{flashcard.question}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Answer</Label>
                    <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{flashcard.answer}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowFlashcardDialog(false)}>
              Close
            </Button>
            <Button>Save Flashcards</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Structure Suggestions Dialog */}
      <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Smart Structure Suggestions
            </DialogTitle>
            <DialogDescription>AI suggests these headings to organize your content</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {structureSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">{suggestion}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const heading = `<h2 style="color: #8a7559; margin: 20px 0 10px 0; font-weight: bold;">${suggestion}</h2><p><br></p>`
                    onContentUpdate(content + heading)
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowStructureDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                const allHeadings = structureSuggestions
                  .map(
                    (s) => `<h2 style="color: #8a7559; margin: 20px 0 10px 0; font-weight: bold;">${s}</h2><p><br></p>`,
                  )
                  .join("")
                onContentUpdate(content + allHeadings)
                setShowStructureDialog(false)
              }}
            >
              Add All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhance Text Dialog */}
      <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Enhanced Text
            </DialogTitle>
            <DialogDescription>AI has improved the clarity and readability of your text</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{enhancedText}</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEnhanceDialog(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const enhancedHTML = `<div style="margin: 20px 0; padding: 15px; border: 1px solid #d9c6b8; border-radius: 8px; background: #f5f0e8;"><h3 style="color: #8a7559; margin-bottom: 10px;">Enhanced Text</h3><p style="color: #333; line-height: 1.6;">${enhancedText.replace(/\n/g, "<br>")}</p></div>`
                  onContentUpdate(content + enhancedHTML)
                  setShowEnhanceDialog(false)
                }}
              >
                Replace Text
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
