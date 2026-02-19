"use client";

import React, { useState } from "react";
import { ArrowLeft, MoreVertical, BarChart3, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface EditorTopBarProps {
  noteTitle: string;
  onTitleChange: (title: string) => void;
  onAIPanelToggle: () => void;
  aiPanelOpen: boolean;
  darkMode?: boolean;
}

export function EditorTopBar({
  noteTitle,
  onTitleChange,
  onAIPanelToggle,
  aiPanelOpen,
  darkMode = false,
}: EditorTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(noteTitle);

  const handleSaveTitle = () => {
    onTitleChange(titleInput || "Untitled Note");
    setIsEditingTitle(false);
  };

  const handleBlur = () => {
    handleSaveTitle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    }
    if (e.key === "Escape") {
      setTitleInput(noteTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      className={`h-16 border-b flex items-center px-6 gap-4 sticky top-0 z-50 transition-all duration-150 ${darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-200"
        }`}
    >
      {/* Left Section: Back Button & Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 ${darkMode
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
                  }`}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Note Title: Editable */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`text-lg font-semibold w-full max-w-md outline-none transition-colors ${darkMode
                  ? "bg-slate-900 text-slate-50"
                  : "bg-white text-slate-900"
                }`}
              placeholder="Untitled Note"
            />
          ) : (
            <button
              onClick={() => {
                setIsEditingTitle(true);
                setTitleInput(noteTitle);
              }}
              className={`text-lg font-semibold max-w-md truncate text-left transition-colors hover:text-opacity-70 ${darkMode ? "text-slate-50" : "text-slate-900"
                }`}
            >
              {noteTitle || "Untitled Note"}
            </button>
          )}
        </div>
      </div>

      {/* Center Section: Last Saved (optional) */}
      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        Saved just now
      </div>

      {/* Right Section: Mode, Graph, More Menu */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {/* Graph Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAIPanelToggle}
                className={`h-9 px-3 ${aiPanelOpen
                    ? darkMode
                      ? "bg-indigo-900/30 text-indigo-400"
                      : "bg-indigo-100 text-indigo-700"
                    : darkMode
                      ? "hover:bg-slate-800"
                      : "hover:bg-slate-100"
                  }`}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle AI Panel</TooltipContent>
          </Tooltip>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 ${darkMode
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
                  }`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={darkMode ? "bg-slate-900 border-slate-800" : ""}>
              <DropdownMenuItem className={darkMode ? "text-slate-100" : ""}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={darkMode ? "text-slate-100" : ""}>
                Export Note
              </DropdownMenuItem>
              <DropdownMenuItem className={darkMode ? "text-slate-100" : ""}>
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </div>
  );
}
