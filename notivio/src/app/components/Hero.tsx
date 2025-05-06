"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"


// Interactive floating note component
const FloatingNote = ({ index }: { index: number }) => {
  const yOffset = (index % 3) * 20 - 20
  const xOffset = (index % 2) * 30 - 15
  const rotation = (index % 2) * 5 - 2.5

  return (
    <motion.div
      className="absolute bg-white rounded-lg shadow-lg p-12 mt-[6rem] w-32 h-32 flex items-center justify-center text-center text-sm"
      style={{
        zIndex: 10 - index,
      }}
      initial={{
        y: 100 + yOffset,
        x: xOffset,
        rotate: rotation,
        opacity: 0,
      }}
      animate={{
        y: [100 + yOffset, 50 + yOffset, 70 + yOffset, 50 + yOffset],
        x: [xOffset, xOffset + 10, xOffset - 10, xOffset],
        rotate: [rotation, rotation + 2, rotation - 2, rotation],
        opacity: [0, 0.9, 0.9, 0],
      }}
      transition={{
        duration: 10,
        delay: index * 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
      }}
    >
      {index === 0 && "Automatic notes from YouTube videos"}
      {index === 1 && "Generate flashcards for better retention"}
      {index === 2 && "AI-powered summaries"}
      {index === 3 && "Important questions highlighted"}
      {index === 4 && "Download notes as PDF"}
    </motion.div>
  )
}

// Interactive typing effect
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
      <span className="absolute right-[-4px] top-0 h-full w-[2px] bg-black animate-blink"></span>
    </span>
  )
}

// Interactive 3D notebook component
const Notebook3D = () => {
  const notebookRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!notebookRef.current) return

      const rect = notebookRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = (y - centerY) / 20
      const rotateY = (centerX - x) / 20

      notebookRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      if (!notebookRef.current) return
      notebookRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`
    }

    const element = notebookRef.current
    if (element) {
      element.addEventListener("mousemove", handleMouseMove)
      element.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove)
        element.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={notebookRef} className="relative w-full max-w-md h-80 mt-[6rem] transition-transform duration-200 ease-out">
      {/* Notebook cover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg shadow-xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-2xl font-bold">Notivio</div>
        </div>

        {/* Notebook binding */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-purple-800 to-purple-600 rounded-l-lg"></div>

        {/* Notebook pages */}
        <div className="absolute top-2 right-2 bottom-2 left-8 bg-white rounded-r-lg shadow-inner overflow-hidden">
          <div className="p-4 text-gray-800">
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

            <div className="absolute bottom-4 right-4 text-xs text-gray-400">Generated by Notivio</div>
          </div>
        </div>
      </div>
    </div>
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

  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 py-20"
      style={{ opacity, scale, y }}
    >
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
              Transform How You Learn with <TypingEffect text="Notivio" />
            </h1>

            <p className="text-xl text-gray-700 max-w-lg">
              AI-powered note-taking that automatically generates structured notes, flashcards, and study materials from
              any video content.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
          </motion.div>
        </div>

        <div className="relative h-[500px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 flex justify-center"
          >
            <Notebook3D />
          </motion.div>

          {/* Floating notes */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <FloatingNote key={i} index={i} />
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  )
}
