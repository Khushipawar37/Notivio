"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, Zap, Lightbulb } from "lucide-react"

type TypingEffectProps = {
  text: string
  className?: string
}

const TypingEffect = ({ text, className }: TypingEffectProps) => {
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
    <span className={`relative ${className}`}>
      {displayText}
      <span className="absolute right-[-4px] top-0 h-full w-[2px] bg-[#8a7559] animate-blink"></span>
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
      className="bg-white border border-[#c6ac8f]/30 rounded-xl p-4 hover:border-[#c6ac8f] transition-all duration-300 group shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#c6ac8f]/20 border border-[#c6ac8f]/30 text-[#8a7559]">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-black font-medium text-lg">{title}</h3>
          <p className="text-gray-600 text-sm mt-1 group-hover:text-gray-700 transition-colors">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced notebook component with pencil animation
const EnhancedNotebook = () => {
  const notebookRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [writtenText, setWrittenText] = useState("")

  return (
    <div
      ref={notebookRef}
      className="relative w-full max-w-md mt-[4rem] transition-all duration-300 ease-out group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Notebook container with enhanced hover effect */}
      <div className="relative h-80 transform transition-all duration-500 ease-out group-hover:translate-y-[-10px] group-hover:rotate-1">
        {/* Notebook cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#c6ac8f] to-[#d8c0a5] rounded-lg shadow-lg border border-[#c6ac8f]/50 transition-all duration-300 group-hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-black text-2xl font-bold opacity-30">Notivio</div>
          </div>

          {/* Notebook binding */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#b39a7d] to-[#c6ac8f] rounded-l-lg"></div>

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

      {/* Sticky notes */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute -left-20 top-10 bg-[#c6ac8f] p-3 w-24 h-24 shadow-md transform -rotate-6"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">Remember to review quantum mechanics</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20, rotate: 5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -20 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute -right-16 top-55 bg-[#c6ac8f] p-3 w-20 h-20 shadow-md transform rotate-3"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">Quiz tomorrow!</div>
      </motion.div>
    </div>
  )
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const floatingNotes = ["Automated notes from YouTube videos", "AI-powered summaries", "Download notes as PDF"]

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
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 py-[10rem] bg-gradient-to-b from-[#f5f0e8] via-[#f5f0e8] to-[#f5f0e8]"
    >
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f5f0e8] via-[#f5f0e8] to-[#f5f0e8] opacity-70"></div>

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-black">
              Transform How You Learn with <TypingEffect text="Notivio" className="text-[#8a7559]" />
            </h1>

            <p className="text-xl text-gray-700 max-w-lg">
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
        </div>
      </div>
      {/* Simple glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-[#c6ac8f]/10 blur-[100px] rounded-full"></div>
    </motion.div>
  )
}
