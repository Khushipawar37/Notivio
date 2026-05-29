"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Zap, Lightbulb, type LucideIcon } from "lucide-react";

type TypingEffectProps = {
  text: string;
  className?: string;
};

const TypingEffect = ({ text, className }: TypingEffectProps) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeleting && currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1));
          setCurrentIndex((prev) => prev + 1);
        } else if (isDeleting && currentIndex > 0) {
          setDisplayText(text.substring(0, currentIndex - 1));
          setCurrentIndex((prev) => prev - 1);
        } else if (currentIndex === text.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        } else if (currentIndex === 0) {
          setIsDeleting(false);
        }
      },
      isDeleting ? 50 : 100
    );
    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, text]);

  return (
    <span className={`relative ${className}`}>
      {displayText}
      <span className="absolute right-[-4px] top-0 h-full w-[2px] bg-[#8a7559] animate-blink"></span>
    </span>
  );
};

// Feature card component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white border border-[#c6ac8f]/30 rounded-xl p-3.5 hover:border-[#c6ac8f] transition-all duration-300 group shadow-sm sm:p-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#c6ac8f]/20 border border-[#c6ac8f]/30 text-[#8a7559]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-medium text-black sm:text-lg">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 transition-colors group-hover:text-gray-700">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced notebook component with pencil animation
const EnhancedNotebook = () => {
  const notebookRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={notebookRef}
      className="relative mt-8 w-full max-w-[18rem] transition-all duration-300 ease-out group sm:mt-[4rem] sm:max-w-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Notebook container with enhanced hover effect */}
      <div className="relative h-56 transform transition-all duration-500 ease-out group-hover:translate-y-[-10px] group-hover:rotate-1 sm:h-80">
        {/* Notebook cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#c6ac8f] to-[#d8c0a5] rounded-lg shadow-lg border border-[#c6ac8f]/50 transition-all duration-300 group-hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xl font-bold text-black opacity-30 sm:text-2xl">
              Notivio
            </div>
          </div>

          {/* Notebook binding */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#b39a7d] to-[#c6ac8f] rounded-l-lg"></div>

          {/* Notebook pages */}
          <div className="absolute top-2 right-2 bottom-2 left-8 bg-gray-100 rounded-r-lg shadow-inner overflow-hidden">
            <div className="relative p-3 text-gray-800 sm:p-4">
              <div className="mb-2 text-base font-semibold sm:text-lg">Physics Notes</div>
              <div className="h-1 w-full bg-gray-200 mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
                <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-2 w-4/5 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="mt-4 mb-2 text-base font-semibold sm:mt-6 sm:text-lg">
                Key Concepts
              </div>
              <div className="h-1 w-full bg-gray-200 mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
                <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 sm:bottom-4 sm:right-4 sm:text-xs">
                Generated by Notivio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky notes */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="absolute -left-20 top-10 hidden h-24 w-24 -rotate-6 transform bg-[#c6ac8f] p-3 shadow-md sm:block"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">
          Remember to review quantum mechanics
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20, rotate: 5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -20 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute -right-16 top-55 hidden h-20 w-20 rotate-3 transform bg-[#c6ac8f] p-3 shadow-md sm:block"
        style={{ zIndex: 5 }}
      >
        <div className="text-black text-xs font-medium">Quiz tomorrow!</div>
      </motion.div>
    </div>
  );
};

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const features = [
    {
      icon: BookOpen,
      title: "Smart Notes",
      description:
        "Automatically extract key concepts and create structured notes",
      delay: 0.3,
    },
    {
      icon: Brain,
      title: "AI Summaries",
      description:
        "Get concise summaries of complex topics with a single click",
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
      description:
        "Visualize connections between concepts for deeper understanding",
      delay: 0.6,
    },
  ];

  return (
    <motion.div
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f5f0e8] px-4 pb-28 pt-28 sm:py-[10rem]"
    >
      {/* Simple gradient background */}
      <div className="container relative z-10 mx-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-7 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-5 sm:space-y-6"
          >
            <h1 className="text-4xl font-bold leading-tight text-black sm:text-5xl md:text-6xl">
              Transform How You Learn with{" "}
              <TypingEffect text="Notivio" className="text-[#8a7559]" />
            </h1>

            <p className="mx-auto max-w-lg text-base leading-relaxed text-gray-700 sm:text-xl lg:mx-0">
              AI-powered note-taking that automatically generates structured
              notes, flashcards, and study materials from any video content.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
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

        <div className="relative h-[330px] sm:h-[500px]">
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
    </motion.div>
  );
}
