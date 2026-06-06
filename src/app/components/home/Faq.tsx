"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Brain,
  Shield,
  Zap,
  BookOpen,
  CreditCard,
  Users,
  FileText,
  Lightbulb,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  icon: LucideIcon;
  category: string;
};

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How does Notivio's AI actually work?",
    answer:
      "Notivio uses advanced natural language processing to analyze video content, extract key concepts, and automatically generate structured notes. Our AI identifies important topics, creates summaries, and even generates relevant flashcards based on the content's context and complexity.",
    icon: Brain,
    category: "AI Features",
  },
  {
    id: "2",
    question: "What types of content can I use with Notivio?",
    answer:
      "Notivio supports a wide range of video content including YouTube videos, uploaded video files, recorded lectures, webinars, and educational content. We're constantly expanding our supported formats to include podcasts and live streams.",
    icon: FileText,
    category: "Content",
  },
  {
    id: "3",
    question: "Is my data secure and private?",
    answer:
      "We use enterprise-grade encryption to protect your data. Your notes and content are stored securely, and we never share your personal information with third parties. You maintain full control over your data and can export or delete it anytime.",
    icon: Shield,
    category: "Privacy",
  },
  {
    id: "4",
    question: "How fast does the AI generate notes?",
    answer:
      "Our AI typically processes and generates comprehensive notes within 2-5 minutes for a 1-hour video, depending on the complexity of the content. The system works in real-time, so you can see notes being generated as the AI processes the material.",
    icon: Zap,
    category: "Performance",
  },
  {
    id: "5",
    question: "What pricing plans do you offer?",
    answer:
      "We offer a free tier with 5 hours of content processing per month, a Student plan at $9/month with unlimited processing, and a Pro plan at $19/month with advanced features like team collaboration and priority processing.",
    icon: CreditCard,
    category: "Pricing",
  },
  {
    id: "6",
    question: "Can I collaborate with others on my notes?",
    answer:
      "Yes! Our Pro plan includes team collaboration features. You can share notes, create study groups, and work together on projects. Team members can add comments, suggestions, and contribute to shared knowledge bases.",
    icon: Users,
    category: "Collaboration",
  },
  {
    id: "7",
    question: "How accurate are the AI-generated flashcards?",
    answer:
      "Our AI achieves 95%+ accuracy in generating relevant flashcards. The system understands context and creates questions that test comprehension rather than just memorization. You can always edit or customize the flashcards to match your learning style.",
    icon: BookOpen,
    category: "AI Features",
  },
  {
    id: "8",
    question: "Can I customize the note-taking style?",
    answer:
      "Notivio offers multiple note formats including bullet points, mind maps, detailed summaries, and outline formats. You can set preferences for how detailed you want your notes and what elements to emphasize.",
    icon: Lightbulb,
    category: "Customization",
  },
];

const categories = [
  "All",
  "AI Features",
  "Content",
  "Privacy",
  "Performance",
  "Pricing",
  "Collaboration",
  "Customization",
];

const CategoryFilter = ({
  categories,
  activeCategory,
  onCategoryChange,
}: {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}) => {
  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2">
      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-300 sm:px-4 sm:text-sm ${
            activeCategory === category
              ? "bg-[#8a7559] text-white shadow-lg"
              : "bg-white text-[#8a7559] border border-[#c6ac8f]/30 hover:border-[#c6ac8f] hover:bg-[#c6ac8f]/10"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

const FAQCard = ({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const Icon = faq.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-[#c6ac8f]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      <motion.button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors duration-200 hover:bg-[#f5f0e8]/50 sm:items-center sm:gap-4 sm:p-6"
        whileHover={{ backgroundColor: "rgba(245, 240, 232, 0.5)" }}
      >
        <div className="flex-shrink-0 rounded-lg border border-[#c6ac8f]/30 bg-[#c6ac8f]/20 p-2 text-[#8a7559]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-base font-semibold leading-snug text-black sm:text-lg">
            {faq.question}
          </h3>
          <span className="text-xs text-[#8a7559] bg-[#c6ac8f]/20 px-2 py-1 rounded-full">
            {faq.category}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[#8a7559]"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:px-6 sm:pb-6 sm:pl-[4.5rem]">
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("All");

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs =
    activeCategory === "All"
      ? faqData
      : faqData.filter((faq) => faq.category === activeCategory);

  return (
    <section className="relative overflow-hidden bg-[#f5f0e8] px-4 py-16 sm:py-20">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f5f0e8] via-[#f5f0e8] to-transparent opacity-50"></div>
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center sm:mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-[#c6ac8f]/20 border border-[#c6ac8f]/30 rounded-full px-4 py-2 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <HelpCircle className="w-4 h-4 text-[#8a7559]" />
            <span className="text-[#8a7559] font-medium text-sm">
              Frequently Asked Questions
            </span>
          </motion.div>

          <h2 className="mb-4 text-3xl font-bold leading-tight text-black sm:text-4xl md:text-5xl">
            Got Questions About <span className="text-[#8a7559]">Notivio</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-700 sm:text-xl">
            Find answers to common questions about our AI-powered note-taking
            platform
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </motion.div>

        {/* FAQ Items */}
        <motion.div className="space-y-4" layout>
          <AnimatePresence mode="wait">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <FAQCard
                  faq={faq}
                  isOpen={openItems.has(faq.id)}
                  onToggle={() => toggleItem(faq.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
