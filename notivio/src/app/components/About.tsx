"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Youtube,
  Brain,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Pencil,
} from "lucide-react"

// 3D rotating feature carousel
const FeatureCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })

  const features = [
    {
      icon: Youtube,
      title: "Video to Notes",
      description:
        "Transform any YouTube video into comprehensive, structured notes with a single click. Save hours of manual note-taking.",
      color: "#c6ac8f",
      bgGradient: "from-purple-900/30 to-purple-900/5",
    },
    {
      icon: Pencil,
      title: "Smart Editing",
      description:
        "Customize and edit your generated notes with our intuitive editor. Add your own insights and annotations.",
      color: "#c6ac8f",
      bgGradient: "from-blue-900/30 to-blue-900/5",
    },
    {
      icon: CheckCircle,
      title: "Fact Verification",
      description:
        "Our AI automatically scans notes and corrects any inaccurate information, ensuring your study material is reliable.",
      color: "#c6ac8f",
      bgGradient: "from-green-900/30 to-green-900/5",
    },
    {
      icon: Layers,
      title: "Intelligent Organization",
      description:
        "Notes are automatically grouped under specific headings and topics for easier navigation and comprehension.",
      color: "#c6ac8f",
      bgGradient: "from-amber-900/30 to-amber-900/5",
    },
    {
      icon: Brain,
      title: "Mnemonic Generation",
      description:
        "Create memorable mnemonics to help retain complex information and key concepts with our AI assistant.",
      color: "#c6ac8f",
      bgGradient: "from-pink-900/30 to-pink-900/5",
    },
    {
      icon: Zap,
      title: "Flashcard Creation",
      description:
        "Generate flashcards from your notes for effective revision and quick knowledge testing before exams.",
      color: "#c6ac8f",
      bgGradient: "from-indigo-900/30 to-indigo-900/5",
    },
  ]

  // Auto-rotate carousel
  useEffect(() => {
    if (!isInView || !autoRotate) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isInView, autoRotate, features.length])

  const nextSlide = () => {
    setAutoRotate(false)
    setActiveIndex((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setAutoRotate(false)
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length)
  }

  const goToSlide = (index: number) => {
    setAutoRotate(false)
    setActiveIndex(index)
  }

  // Calculate positions for the 3D carousel
  const getCardStyle = (index: number) => {
    const totalCards = features.length
    const circle = 2 * Math.PI
    const angleStep = circle / totalCards
    const currentAngle = angleStep * ((index - activeIndex) % totalCards)

    // Radius of the circle
    const radius = 300

    // Calculate position on the circle
    const x = Math.sin(currentAngle) * radius
    const z = Math.cos(currentAngle) * radius - radius

    // Scale and opacity based on z position
    const scale = ((z + radius) / radius) * 0.4 + 0.6
    const opacity = ((z + radius) / radius) * 0.7 + 0.3

    return {
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale})`,
      opacity,
      zIndex: Math.round(opacity * 10),
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-[600px] overflow-hidden">
      {/* 3D Perspective Container */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1200px" }}>
        <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d", transform: "rotateX(5deg)" }}>
          {/* Feature Cards */}
          {features.map((feature, index) => {
            const Icon = feature.icon
            const style = getCardStyle(index)

            return (
              <motion.div
                key={index}
                className="absolute top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={style}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div
                  className={`bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl transition-all duration-300 ${
                    index === activeIndex ? "border-[#c6ac8f]/50" : ""
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.bgGradient} opacity-30`}
                  ></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-black border border-gray-800 text-[#c6ac8f]">
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-white font-semibold text-2xl">{feature.title}</h3>
                    </div>

                    <p className="text-gray-300 text-lg">{feature.description}</p>

                    {index === activeIndex && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="mt-6 pt-4 border-t border-gray-800"
                      >
                        <div className="flex items-center text-[#c6ac8f] font-medium">
                          <span>Learn more</span>
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-6 z-20">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-black border border-gray-800 text-white hover:border-[#c6ac8f]/50 transition-colors"
          aria-label="Previous feature"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex space-x-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === activeIndex ? "bg-[#c6ac8f]" : "bg-gray-700"
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-black border border-gray-800 text-white hover:border-[#c6ac8f]/50 transition-colors"
          aria-label="Next feature"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Animated typing effect component
const TypingEffect = ({ text, className }: { text: string; className?: string }) => {
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
      <span className="absolute right-[-4px] top-0 h-full w-[2px] bg-[#c6ac8f] animate-blink"></span>
    </span>
  )
}

// Interactive workflow component
const InteractiveWorkflow = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: "Input",
      description: "Paste any YouTube URL or upload your own video",
      icon: Youtube,
      color: "from-purple-500/20 to-purple-900/5",
    },
    {
      title: "Process",
      description: "AI analyzes content, extracts key information, and organizes it",
      icon: Brain,
      color: "from-blue-500/20 to-blue-900/5",
    },
    {
      title: "Structure",
      description: "Content is organized into topics, subtopics, and key points",
      icon: Layers,
      color: "from-green-500/20 to-green-900/5",
    },
    {
      title: "Enhance",
      description: "Generate flashcards, summaries, and study materials",
      icon: Sparkles,
      color: "from-amber-500/20 to-amber-900/5",
    },
    {
      title: "Study",
      description: "Use the generated materials to learn effectively",
      icon: BookOpen,
      color: "from-red-500/20 to-red-900/5",
    },
  ]

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isInView, steps.length])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full"
    >
      <div className="relative z-10">
        <div className="flex flex-col items-center mb-10">
          <h3 className="text-2xl font-bold text-white mb-2">How Notivio Works</h3>
          <div className="h-1 w-20 bg-[#c6ac8f]"></div>
        </div>

        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-12 left-0 right-0 h-1 bg-gray-800 z-0">
            <motion.div
              className="h-full bg-[#c6ac8f]"
              initial={{ width: "0%" }}
              animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Steps */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex flex-col items-center">
                  <motion.button
                    onClick={() => setActiveStep(index)}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${index <= activeStep ? "bg-black" : "bg-gray-900"} border-2 ${index === activeStep ? "border-[#c6ac8f]" : index < activeStep ? "border-gray-700" : "border-gray-800"}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Background glow */}
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-0 ${index === activeStep ? "opacity-100" : ""} transition-opacity duration-300`}
                    ></div>

                    <Icon
                      className={`relative z-10 w-8 h-8 ${index <= activeStep ? "text-[#c6ac8f]" : "text-gray-600"}`}
                    />

                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border border-gray-800 flex items-center justify-center text-xs font-medium text-white">
                      {index + 1}
                    </div>
                  </motion.button>

                  <div className="mt-4 text-center">
                    <h4 className={`font-medium ${index <= activeStep ? "text-white" : "text-gray-500"}`}>
                      {step.title}
                    </h4>
                    <AnimatePresence>
                      {index === activeStep && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm text-gray-400 mt-2"
                        >
                          {step.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main About Section component
export default function AboutSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true, amount: 0.3 })

  return (
    <section className="relative w-full overflow-hidden bg-black py-24">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-70"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-blue-900/10 blur-[100px] rounded-full"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-6">
            About <TypingEffect text="Notivio" className="text-[#c6ac8f]" />
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-32">
            Notivio is an AI-powered note-taking platform that transforms video content into structured, editable notes
            and study materials, helping you learn more effectively.
          </p>
        </motion.div>

        {/* Features Carousel - Now placed BEFORE How Notivio Works */}
        <div className="mb-32">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white text-center "
          >
            Powerful Features
          </motion.h3>

          <FeatureCarousel />
        </div>

        {/* Interactive workflow section - Now placed AFTER Features */}
        <div className="mb-32">
          <InteractiveWorkflow />
        </div>

        {/* Interactive CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-10 overflow-hidden"
        >
          <div className="relative z-10 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Learning?</h3>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Join thousands of students and educators who are already using Notivio to enhance their learning
              experience.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-[#c6ac8f] text-black font-medium rounded-lg hover:bg-[#d8c0a5] transition-colors"
            >
              Get Started Free
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
