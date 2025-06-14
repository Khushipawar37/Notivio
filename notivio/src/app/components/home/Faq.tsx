import React from 'react'
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const questions = [
    {
        qID: 1,
        Question:"What does Notivio do ?",
        Answer:"Notivio is an AI-powered note-taking platform with a lot many features that you can simply explore directly using our website instead of reading out here in a single line."
    },
    {
        qID: 2,
        Question:"What is included in the free tier ?",
        Answer:"You will get access to most features but limited trials."
    },
    {
        qID: 3,
        Question:"Why must I go for premium ?",
        Answer:""
    },
    {
        qID: 4,
        Question:"Why am I not able to get the summary of youtube url link that I provided ?",
        Answer:"Transcript for the video might not be available. Please make sure that either it is an English video or has english subtitles available."
    },
    {
        qID: 5,
        Question:"Still having a doubt ?",
        Answer:"Reach out through the contact form given below "
    },
]
const [activeIndex] = useState(0)
const Faq = () => {
  return (
    <div className ="min-h-screen bg-gradient-to-b from-[#f5f0e8] via-[#f5f0e8] to-[#f5f0e8] py-[12rem]">
        <h2 className ="text-center mb-[5rem] text-7xl font-bold">Frequently <span className="text-[#8a7559]">Asked</span> Questions</h2>
      <div className="content">All your doubts solved.</div>
      <main className="w-full px-4 py-14">
        <div className="max-w-9xl mx-auto">
          <div className="space-y-8">
            {questions.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-[#2a2a2a] rounded-xl p-6 border-2 border-[#fcb326]/20 hover:border-[#fcb326]/40 transition-colors"
              >
                <motion.button
                  className="w-full text-left focus:outline-none"
                //   onClick={() => setActiveIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[#fcb326] text-2xl font-bold">0{index + 1}</span>
                      <h3 className="text-3xl font-semibold text-white">{section.Question}</h3>
                    </div>
                    <motion.div
                      animate={{ rotate: activeIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-8 h-8 rounded-full bg-[#fcb326]/10 flex items-center justify-center"
                    >
                      <span className="text-[#fcb326]">▼</span>
                    </motion.div>
                  </div>
                </motion.button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mt-6 pl-14">
                        <div className="h-px w-full bg-[#fcb326]/20 mb-6"></div>
                        <p className="text-xl text-gray-300 leading-relaxed">{section.Answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Faq
