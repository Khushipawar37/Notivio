"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Lightbulb,
  Search,
  Link as LinkIcon,
  Zap,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface AIPanelContainerProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedText: string;
  content: string;
  onContentUpdate: (content: string) => void;
  onAIResponse?: (response: string) => void;
  darkMode?: boolean;
}

interface AIResponse {
  id: string;
  type: "simplify" | "example" | "analogy" | "quiz";
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export function AIPanelContainer({
  isOpen,
  onToggle,
  selectedText,
  content,
  onContentUpdate,
  onAIResponse,
  darkMode = false,
}: AIPanelContainerProps) {
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const actionTypes = [
    {
      id: "simplify",
      icon: <Lightbulb className="h-4 w-4" />,
      label: "Simplify",
      color: "indigo",
      description: "Explain in simpler terms",
    },
    {
      id: "example",
      icon: <Search className="h-4 w-4" />,
      label: "Example",
      color: "blue",
      description: "Show concrete example",
    },
    {
      id: "analogy",
      icon: <LinkIcon className="h-4 w-4" />,
      label: "Analogy",
      color: "purple",
      description: "Create an analogy",
    },
    {
      id: "quiz",
      icon: <BookOpen className="h-4 w-4" />,
      label: "Quiz",
      color: "emerald",
      description: "Generate practice question",
    },
  ];

  const handleAIAction = (actionId: string) => {
    const newResponse: AIResponse = {
      id: Date.now().toString(),
      type: actionId as any,
      content: `Loading ${actionId}...`,
      timestamp: new Date(),
      loading: true,
    };

    setAiResponses((prev) => [newResponse, ...prev]);

    // Simulate API call
    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        simplify:
          "This concept can be understood as a fundamental principle that...",
        example:
          "For instance, consider a real-world scenario where this principle applies...",
        analogy: "Think of it like water flowing downhill - it always takes the path of least resistance...",
        quiz: "What is the key difference between these two related concepts?",
      };

      setAiResponses((prev) =>
        prev.map((r) =>
          r.id === newResponse.id
            ? {
                ...r,
                content: mockResponses[actionId],
                loading: false,
              }
            : r
        )
      );

      onAIResponse?.(mockResponses[actionId]);
    }, 1000);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionColor = (type: string) => {
    const colors: Record<string, string> = {
      simplify: darkMode
        ? "bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30"
        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
      example: darkMode
        ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30"
        : "bg-blue-100 text-blue-700 hover:bg-blue-200",
      analogy: darkMode
        ? "bg-purple-900/20 text-purple-400 hover:bg-purple-900/30"
        : "bg-purple-100 text-purple-700 hover:bg-purple-200",
      quiz: darkMode
        ? "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30"
        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    };
    return colors[type] || colors.simplify;
  };

  return (
    <>
      {/* COLLAPSED STATE - Vertical Icon Bar */}
      {!isOpen && (
        <div
          className={`w-12 border-l flex flex-col items-center gap-4 py-4 transition-colors ${
            darkMode
              ? "bg-slate-900/30 border-slate-800"
              : "bg-slate-50/50 border-slate-200"
          }`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className={`w-8 h-8 p-0 ${
                    darkMode
                      ? "text-indigo-400 hover:bg-indigo-900/20"
                      : "text-indigo-600 hover:bg-indigo-100"
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">AI Assistant</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* EXPANDED STATE - Full Panel */}
      {isOpen && (
        <div
          className={`w-80 border-l flex flex-col overflow-hidden transition-all duration-300 ${
            darkMode
              ? "bg-gradient-to-b from-indigo-950/20 to-slate-900/30 border-slate-800 backdrop-blur-sm"
              : "bg-gradient-to-b from-indigo-50/30 to-white border-slate-200 backdrop-blur-sm"
          }`}
        >
          {/* Panel Header */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              darkMode ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
              <h2 className={`font-semibold text-sm ${darkMode ? "text-slate-50" : "text-slate-900"}`}>
                AI Assistant
              </h2>
              <Badge className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                ✨ Powered by Groq
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={`h-8 w-8 p-0 ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Highlight Actions Widget */}
            {selectedText ? (
              <div className={`space-y-3 p-4 rounded-lg border ${
                darkMode
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-slate-100/50 border-slate-200"
              }`}>
                <p className={`text-xs font-semibold mb-3 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Quick Actions for Selected Text
                </p>
                <div className="space-y-2">
                  {actionTypes.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIAction(action.id)}
                      className={`w-full justify-start text-sm transition-all ${getActionColor(
                        action.id
                      )}`}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 px-4 rounded-lg border ${
                darkMode
                  ? "bg-slate-800/20 border-slate-700/50"
                  : "bg-slate-100/50 border-slate-200"
              }`}>
                <Sparkles className={`h-6 w-6 mx-auto mb-2 ${darkMode ? "text-slate-400" : "text-slate-400"}`} />
                <p className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Highlight text to get AI help
                </p>
              </div>
            )}

            {/* Divider */}
            <Separator className={darkMode ? "bg-slate-800" : "bg-slate-200"} />

            {/* AI Responses Section */}
            {aiResponses.length > 0 && (
              <div className="space-y-3">
                <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Recent AI Responses
                </p>
                {aiResponses.map((response) => (
                  <Card
                    key={response.id}
                    className={`transition-all duration-200 ${
                      darkMode
                        ? "bg-slate-800/50 border-slate-700"
                        : "bg-white border-slate-200 hover:shadow-md"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getActionColor(response.type)}`}
                          >
                            {actionTypes.find((a) => a.id === response.type)?.label}
                          </Badge>
                          <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            Just now
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(response.id, response.content)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedId === response.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {response.loading ? (
                        <div className="flex gap-2">
                          <div className={`h-2 w-2 rounded-full animate-pulse ${darkMode ? "bg-indigo-400" : "bg-indigo-600"}`} />
                          <div className={`h-2 w-2 rounded-full animate-pulse ${darkMode ? "bg-indigo-400" : "bg-indigo-600"}`} />
                          <div className={`h-2 w-2 rounded-full animate-pulse ${darkMode ? "bg-indigo-400" : "bg-indigo-600"}`} />
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                          {response.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Smart Suggestions */}
            {aiResponses.length === 0 && (
              <div className={`p-4 rounded-lg border space-y-3 ${
                darkMode
                  ? "bg-slate-800/30 border-slate-700"
                  : "bg-indigo-50/50 border-indigo-200"
              }`}>
                <div className="flex items-start gap-2">
                  <Zap className={`h-4 w-4 mt-0.5 flex-shrink-0 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                  <div>
                    <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-slate-50" : "text-slate-900"}`}>
                      Smart Suggestions
                    </p>
                    <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Start by selecting text or write to get personalized AI suggestions
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
