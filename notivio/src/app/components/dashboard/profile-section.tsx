"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Award, Camera } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { useNotes } from "./note-context"
import { formatBytes } from "../../lib/utils"

interface ProfileSectionProps {
  darkMode: boolean
}

export default function ProfileSection({ darkMode }: ProfileSectionProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { notes, folders, tags, getTotalStorage, getMaxStorage } = useNotes()

  // Calculate storage usage
  const totalStorage = getTotalStorage()
  const maxStorage = getMaxStorage()
  const storagePercentage = Math.min(Math.round((totalStorage / maxStorage) * 100), 100)

  // Mock user data - in a real app, this would come from authentication
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: "/placeholder.svg?height=100&width=100",
    premiumUser: false,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl p-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#c6ac8f]/30"} border shadow-sm`}
    >
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Avatar */}
        <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div
            className={`w-24 h-24 rounded-full overflow-hidden border-2 ${darkMode ? "border-[#d8c0a5]" : "border-[#c6ac8f]"} transition-all duration-300 ${isHovered ? "scale-105" : ""}`}
          >
            <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />
          </div>

          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </motion.div>
          )}

          {user.premiumUser && (
            <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 p-1 rounded-full">
              <Award className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            {user.premiumUser && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Premium
              </span>
            )}
          </div>

          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>

          <div className="flex flex-wrap gap-4">
            <div className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-[#c6ac8f]/10"}`}>
              <p className="text-xs uppercase font-medium text-gray-500">Notes</p>
              <p className="text-xl font-bold">{notes.length}</p>
            </div>

            <div className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-[#c6ac8f]/10"}`}>
              <p className="text-xs uppercase font-medium text-gray-500">Folders</p>
              <p className="text-xl font-bold">{folders.length}</p>
            </div>

            <div className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-[#c6ac8f]/10"}`}>
              <p className="text-xs uppercase font-medium text-gray-500">Tags</p>
              <p className="text-xl font-bold">{tags.length}</p>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className={`w-full md:w-64 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-[#c6ac8f]/10"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Storage</span>
            <span className="text-xs">
              {formatBytes(totalStorage)} / {formatBytes(maxStorage)}
            </span>
          </div>
          <Progress
            value={storagePercentage}
            className={`h-2 ${darkMode ? "bg-gray-600" : "bg-[#c6ac8f]/20"}`}
            indicatorClassName={`${darkMode ? "bg-[#d8c0a5]" : "bg-[#8a7559]"}`}
          />

          <div className="mt-4 text-xs text-right">
            <Button variant="link" size="sm" className={darkMode ? "text-[#d8c0a5]" : "text-[#8a7559]"}>
              Upgrade for more
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
