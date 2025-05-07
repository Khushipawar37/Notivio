"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Sparkles, BookOpen, Brain, Zap, FileText, Lightbulb, Pencil } from "lucide-react"

// Interactive typing effect with optimized performance
const TypingEffect = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeleting && currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1))
          setCurrentIndex((prev) => prev + 1)
        } else if (isDeleting && currentIndex > 0) {
          setDisplayText(text.substring(0, currentIndex - 1))
          setCurrentIndex((prev) => prev - 1)
        } else if (currentIndex === text.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        } else if (currentIndex === 0) {
          setIsDeleting(false)
        }
      },
      isDeleting ? 50 : 100,
    )

    return () => clearTimeout(timeout)
  }, [currentIndex, isDeleting, text])

  return (
    <span className="relative">
      {displayText}
      <span className="absolute right-[-4px] top-0 h-full w-[2px] bg-white animate-blink"></span>
    </span>
  )
}

// Feature card component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: any
  title: string
  description: string
  delay: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300 group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-black border border-gray-800 text-white">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-medium text-lg">{title}</h3>
          <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-300 transition-colors">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced notebook component with pencil animation
const EnhancedNotebook = () => {
  const notebookRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [writtenText, setWrittenText] = useState("")
  const fullText = "Notivio"

  // Handle the writing animation when hovered
  useEffect(() => {
    if (isHovered && !isWriting) {
      setIsWriting(true)
      setWrittenText("")

      let index = 0
      const writeInterval = setInterval(() => {
        if (index < fullText.length) {
          setWrittenText((prev) => prev + fullText[index])
          index++
        } else {
          clearInterval(writeInterval)
        }
      }, 150)

      return () => clearInterval(writeInterval)
    }

    if (!isHovered) {
      setIsWriting(false)
      setWrittenText("")
    }
  }, [isHovered])

  return (
    <div
      ref={notebookRef}
      className="relative w-full max-w-md transition-all duration-300 ease-out group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Notebook container with enhanced hover effect */}
      <div className="relative h-80 transform transition-all duration-500 ease-out group-hover:translate-y-[-10px] group-hover:rotate-1">
        {/* Notebook cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-lg shadow-lg border border-gray-800 transition-all duration-300 group-hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-2xl font-bold opacity-30">Notivio</div>
          </div>

          {/* Notebook binding */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-l-lg"></div>

          {/* Notebook pages */}
          <div className="absolute top-2 right-2 bottom-2 left-8 bg-gray-100 rounded-r-lg shadow-inner overflow-hidden">
            <div className="p-4 text-gray-800 relative">
              <div className="text-lg font-semibold mb-2">Physics Notes</div>
              <div className="h-1 w-full bg-gray-200 mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
                <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-2 w-4/5 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
              </div>

              <div className="mt-6 text-lg font-semibold mb-2">Key Concepts</div>
              <div className="h-1 w-full bg-gray-200 mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
                <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
              </div>

              {/* Handwritten text that appears on hover */}
              <div className="absolute bottom-16 right-4 font-handwriting text-2xl text-blue-600 transform -rotate-6">
                {writtenText}
              </div>

              <div className="absolute bottom-4 right-4 text-xs text-gray-400">Generated by Notivio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pencil animation */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -50, y: 50, rotate: 0 }}
            animate={{
              opacity: 1,
              x: isWriting ? [50, 60, 70, 80, 90, 100, 110, 120] : 50,
              y: isWriting ? [100, 100, 100, 100, 100, 100, 100, 100] : 100,
              rotate: isWriting ? [30, 32, 30, 28, 30, 32, 30, 28] : 30,
            }}
            exit={{ opacity: 0, x: -50, y: 50 }}
            transition={{
              duration: isWriting ? 1.2 : 0.3,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 right-1/2 z-20"
          >
            <div className="relative">
              <Pencil className="w-10 h-10 text-yellow-600" />
              <div className="absolute top-0 left-0 w-2 h-2 bg-gray-800 rounded-full"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky notes */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute -left-20 top-10 bg-yellow-300 p-3 w-24 h-24 shadow-md transform -rotate-6"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">Remember to review quantum mechanics</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20, rotate: 5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -20 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute -right-16 top-5 bg-blue-200 p-3 w-20 h-20 shadow-md transform rotate-3"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">Quiz tomorrow!</div>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="absolute -right-36 bottom-20 bg-black border border-gray-800 rounded-lg p-3 text-white text-sm shadow-lg w-32"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span>AI-generated summaries</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="absolute -bottom-16 left-10 bg-black border border-gray-800 rounded-lg p-3 text-white text-sm shadow-lg w-36"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-400" />
          <span>Export to PDF, Markdown</span>
        </div>
      </motion.div>

      {/* Highlighter marker */}
      <motion.div
        initial={{ opacity: 0, x: -50, rotate: -30 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? [-30, -20, -10, 0, 10, 20] : -50,
          y: isHovered ? [30, 30, 30, 30, 30, 30] : 30,
        }}
        transition={{
          duration: 1,
          delay: 0.5,
          repeat: isHovered ? 0 : 0,
          repeatType: "reverse",
        }}
        className="absolute top-1/4 left-1/4 z-20"
      >
        <div className="w-12 h-3 bg-yellow-300 rounded-sm transform -rotate-12"></div>
      </motion.div>
    </div>
  )
}

// Optimized floating note component
const FloatingNote = ({ index, text }: { index: number; text: string }) => {
  const positions = [
    { top: "20%", left: "10%", delay: 0 },
    { top: "30%", right: "15%", delay: 0.5 },
    { top: "60%", left: "5%", delay: 1 },
    { top: "70%", right: "10%", delay: 1.5 },
    { bottom: "10%", left: "20%", delay: 2 },
  ]

  const pos = positions[index % positions.length]

  return (
    <motion.div
      className="absolute bg-black border border-gray-800 rounded-lg shadow-lg p-3 w-40 flex items-center justify-center text-center text-sm text-white"
      style={{
        ...pos,
        zIndex: 10 - index,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: pos.delay }}
    >
      {text}
    </motion.div>
  )
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100])

  const floatingNotes = [
    "Automated notes from YouTube videos",
    "Generate flashcards for better retention",
    "AI-powered summaries",
    "Important questions highlighted",
    "Download notes as PDF",
  ]

  const features = [
    {
      icon: BookOpen,
      title: "Smart Notes",
      description: "Automatically extract key concepts and create structured notes",
      delay: 0.3,
    },
    {
      icon: Brain,
      title: "AI Summaries",
      description: "Get concise summaries of complex topics with a single click",
      delay: 0.4,
    },
    {
      icon: Zap,
      title: "Instant Flashcards",
      description: "Convert your notes to flashcards for effective studying",
      delay: 0.5,
    },
    {
      icon: Lightbulb,
      title: "Knowledge Graphs",
      description: "Visualize connections between concepts for deeper understanding",
      delay: 0.6,
    },
  ]

  return (
    <motion.div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-black via-gray-950 to-black"
      style={{ opacity, scale, y }}
    >
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-70"></div>

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-white text-sm">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Revolutionizing note-taking with AI</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Transform How You Learn with <TypingEffect text="Notivio" />
            </h1>

            <p className="text-xl text-gray-300 max-w-lg">
              AI-powered note-taking that automatically generates structured notes, flashcards, and study materials from
              any video content.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={feature.delay}
              />
            ))}
          </motion.div>
        </div>

        <div className="relative h-[500px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 flex justify-center items-center h-full"
          >
            <EnhancedNotebook />
          </motion.div>

          {/* Static floating notes - reduced number for better performance */}
          <div className="absolute inset-0 pointer-events-none">
            {floatingNotes.slice(0, 3).map((text, i) => (
              <FloatingNote key={i} index={i} text={text} />
            ))}
          </div>
        </div>
      </div>

      {/* Simple glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-blue-900/20 blur-[100px] rounded-full"></div>
    </motion.div>
  )
}
