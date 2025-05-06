"use client"

import type React from "react"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { BookOpen, FileDown, FlaskConical, Youtube, Brain, FileQuestion } from "lucide-react"
import { ArrowRight } from "lucide-react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  index: number
  isActive: boolean
  onClick: () => void
}

const features = [
  {
    icon: <Youtube className="h-6 w-6" />,
    title: "Automatic Notes from Videos",
    description: "Convert any YouTube video into comprehensive, structured notes with just one click.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white">
            <Youtube className="h-6 w-6" />
          </div>
          <div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-3 w-24 bg-gray-100 rounded mt-1"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-200 rounded"></div>
          <div className="h-3 w-full bg-gray-200 rounded"></div>
          <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="h-4 w-32 bg-indigo-100 rounded mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 rounded"></div>
            <div className="h-3 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="h-8 w-24 bg-indigo-500 rounded"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Smart Classification",
    description: "AI automatically organizes your notes with headings, subheadings, and important points.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="mb-4">
          <div className="h-6 w-48 bg-gray-800 rounded mb-3"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="mb-4">
          <div className="h-5 w-40 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="mb-4">
          <div className="h-5 w-36 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="h-8 w-8 rounded-full bg-gray-300"></div>
          <div className="h-8 w-8 rounded-full bg-gray-300"></div>
          <div className="h-8 w-8 rounded-full bg-gray-300"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <FlaskConical className="h-6 w-6" />,
    title: "Flashcards & Mnemonics",
    description: "Generate study aids that help you memorize and retain information more effectively.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="flex justify-center mb-6">
          <div className="w-48 h-32 bg-indigo-100 rounded-lg shadow-md flex items-center justify-center">
            <div className="text-center">
              <div className="h-4 w-32 bg-gray-400 rounded mx-auto"></div>
              <div className="h-3 w-24 bg-gray-300 rounded mx-auto mt-2"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-3 h-3 border-t-2 border-l-2 border-gray-400 transform -rotate-45"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-3 h-3 border-t-2 border-r-2 border-gray-400 transform rotate-45"></div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="h-3 w-32 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Mnemonic Generation",
    description: "Create memory aids that make complex information easier to remember and recall.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <div className="h-5 w-32 bg-purple-200 rounded mb-2"></div>
          <div className="flex gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">P</div>
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">E</div>
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">M</div>
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">D</div>
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">A</div>
            <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">S</div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 rounded"></div>
            <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <FileQuestion className="h-6 w-6" />,
    title: "Important Questions",
    description: "Identify key questions based on analysis of previous competitive exams.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="mb-4">
          <div className="h-5 w-48 bg-gray-700 rounded mb-2"></div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded mt-1"></div>
            <div className="mt-2 flex items-center">
              <div className="h-4 w-4 rounded-full bg-yellow-400 mr-2"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded mt-1"></div>
            <div className="mt-2 flex items-center">
              <div className="h-4 w-4 rounded-full bg-blue-400 mr-2"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <FileDown className="h-6 w-6" />,
    title: "PDF Export",
    description: "Download your notes in beautifully formatted PDF documents for offline study.",
    demo: (
      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
        <div className="flex justify-center mb-4">
          <div className="w-32 h-40 bg-gray-100 rounded-lg shadow flex flex-col">
            <div className="h-6 w-full bg-red-500 rounded-t-lg"></div>
            <div className="flex-1 p-2">
              <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-3/4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
              <div className="h-3 w-5/6 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <FileDown className="h-5 w-5 text-gray-500" />
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="h-5 w-5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="h-5 w-5 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Revolutionize Your Learning Experience</h2>
          <p className="text-xl text-gray-600">
            Notivio combines AI and learning science to transform how you create, organize, and study notes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-7">
            <motion.div
              className="bg-white rounded-xl shadow-xl overflow-hidden h-[500px] flex items-center justify-center p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {features[activeFeature].demo}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
        </motion.div>
      </div>
    </section>
  )
}
