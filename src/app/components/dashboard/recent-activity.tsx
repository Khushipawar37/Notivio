"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Edit,
  Trash,
  Download,
  FileText,
  Video,
  Music,
} from "lucide-react";
import { useNotes } from "./note-context";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  darkMode: boolean;
}

export default function RecentActivity({ darkMode }: RecentActivityProps) {
  const { activities, notes } = useNotes();

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "create":
        return <FileText className="h-4 w-4" />;
      case "download":
        return <Download className="h-4 w-4" />;
      case "delete":
        return <Trash className="h-4 w-4" />;
      case "view":
        return <FileText className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  // Get icon based on note type
  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Get activity verb
  const getActivityVerb = (type: string) => {
    switch (type) {
      case "edit":
        return "Edited";
      case "create":
        return "Created";
      case "download":
        return "Downloaded";
      case "delete":
        return "Deleted";
      case "view":
        return "Viewed";
      default:
        return "Modified";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`hidden xl:block w-80 h-fit sticky top-24 ${
        darkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-[#c6ac8f]/30"
      } rounded-xl border p-4 shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="font-bold">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div
          className={`text-center py-8 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-3 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-[#c6ac8f]/10 hover:bg-[#c6ac8f]/20"
              } cursor-pointer transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-md ${
                    darkMode ? "bg-gray-600" : "bg-white"
                  }`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium line-clamp-1">
                      {activity.noteTitle}
                    </span>
                    <div
                      className={`p-1 rounded-full ${
                        darkMode ? "bg-gray-600" : "bg-white"
                      }`}
                    >
                      {getNoteTypeIcon(activity.noteType)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {getActivityVerb(activity.type)}
                    </span>
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      •
                    </span>
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Interactive Element - Floating Paper Plane */}
      <div className="relative h-40 mt-6 overflow-hidden rounded-lg bg-gradient-to-br from-[#c6ac8f]/30 to-[#d8c0a5]/30">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ x: -100, y: 50, rotate: 15 }}
            animate={{
              x: [null, 150],
              y: [null, -30],
              rotate: [null, -15],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="w-12 h-12 text-[#8a7559]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.7071 2.29289C22.0976 2.68342 22.0976 3.31658 21.7071 3.70711L11.7071 13.7071C11.3166 14.0976 10.6834 14.0976 10.2929 13.7071C9.90237 13.3166 9.90237 12.6834 10.2929 12.2929L20.2929 2.29289C20.6834 1.90237 21.3166 1.90237 21.7071 2.29289Z"
                fill="currentColor"
              />
              <path
                d="M21.7071 2.29289C21.9931 2.57889 22.0787 2.99111 21.9239 3.35355L15.9239 21.3536C15.7691 21.716 15.4077 21.9649 15.0144 21.9966C14.6211 22.0283 14.2294 21.8491 14.0144 21.5196L10.5 16.5L3.5 13.5C3.1704 13.285 2.99123 12.8934 3.02288 12.5001C3.05452 12.1068 3.30339 11.7454 3.66583 11.5905L21.6658 5.59055C22.0283 5.43578 22.4405 5.52133 22.7265 5.80733L21.7071 2.29289Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-white" : "text-[#8a7559]"
            }`}
          >
            Share your notes with friends
          </p>
        </div>
      </div>
    </motion.div>
  );
}
