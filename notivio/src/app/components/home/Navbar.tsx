"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, FileText, Video, User, MessageSquare } from "lucide-react"
import { Lobster } from 'next/font/google'

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],  // You can adjust the weight if needed
  display: 'swap',
})
// Custom icons to match your app's functionality
const FlashCard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
)

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  index: number
  activeTab: number
}

const NavItem = ({ href, icon, label, isActive, onClick, index, activeTab }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center w-[6rem] h-16 transition-colors duration-200 z-10`}
      onClick={onClick}
    >
      {/* Only render the icon and label on the active indicator if this is the active tab */}
      {isActive ? (
        <motion.div
          className="absolute flex flex-col items-center justify-center"
          initial={{ y: 0 }}
          animate={{ y: -14 }} // Move up slightly to sit on the bulge
          transition={{ duration: 0.2 }}
        >
          <div className="text-[#cfcfcd]">{icon}</div>
          <span className="text-xs mt-1 font-medium text-[#cfcfcd]">{label}</span>
        </motion.div>
      ) : (
        <>
          <div className="text-black">{icon}</div>
          <span className="text-xs mt-1 font-medium text-black">{label}</span>
        </>
      )}
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(0)
  const [indicatorPosition, setIndicatorPosition] = useState(0)
  const navRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { href: "/", icon: <Home size={24} />, label: "Home" },
    { href: "/notes", icon: <FileText size={24} />, label: "Notes" },
    { href: "/convert", icon: <Video size={24} />, label: "Convert" },
    { href: "/flashcards", icon: <FlashCard size={24} />, label: "Flashcards" },
  ]

  // Set active tab based on current path
  useEffect(() => {
    const index = navItems.findIndex((item) => item.href === pathname)
    if (index !== -1) {
      setActiveTab(index)
      updateIndicatorPosition(index)
    }
  }, [pathname])

  const updateIndicatorPosition = (index: number) => {
    if (!navRef.current) return

    // Calculate the position based on the index
    // Each nav item is 5.5rem (w-[5.5rem]) wide
    const position = index * 96 + 48 - 32 // center of the item minus half the indicator width
    setIndicatorPosition(position)
  }

  const handleTabClick = (index: number) => {
    setActiveTab(index)
    updateIndicatorPosition(index)
  }

  return (
    <div className="fixed sm:top-8 w-full px-6 z-50 bottom-8 sm:bottom-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Website Name on the left */}
        <Link href="/" className={`text-5xl font-bold ${lobster.className} text-[#c6ac8f] hidden sm:block`}>
          Notivio
        </Link>

        {/* Center Navigation */}
        <div className="mx-auto">
          <div ref={navRef} className="relative flex items-center bg-[#c6ac8f] rounded-full h-16 px-4 shadow-lg">
            {/* Animated indicator - positioned to create the bulging effect */}
            <motion.div
              className="absolute w-16 h-16 bg-black rounded-full z-0"
              initial={{ x: indicatorPosition }}
              animate={{
                x: indicatorPosition,
                y: -10, // Move it up significantly to create the pronounced "bulging out" effect
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Nav items */}
            {navItems.map((item, index) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === index}
                onClick={() => handleTabClick(index)}
                index={index}
                activeTab={activeTab}
              />
            ))}

            {/* Login button */}
            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            <Link
              href="/auth/login"
              className="flex flex-col items-center justify-center w-[5.5rem] h-16 text-[black] hover:text-white transition-colors duration-200 z-10"
            >
              <User size={24} />
              <span className="text-xs mt-1 font-medium">Login</span>
            </Link>
          </div>
        </div>
        {/* Contact Us button on the right */}
        <Link
          href="/contact"
          className="hidden sm:flex items-center gap-2 bg-[#c6ac8f] text-black px-4 py-2 rounded-full transition-colors"
        >
          <MessageSquare size={18} />
          <span>Contact Us</span>
        </Link>
      </div>
    </div>
  )
}
