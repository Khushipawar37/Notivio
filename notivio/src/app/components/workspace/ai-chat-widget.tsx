"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

interface AIChatWidgetProps {
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function AIChatWidget({ content }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask me anything about your current notebook page.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: userMessage }, { role: "assistant", text: "" }]);

    try {
      const response = await fetch("/api/ai-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "chat",
          content,
          userMessage,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          const token = decoder.decode(chunk.value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, text: `${last.text}${token}` };
            }
            return next;
          });
          scrollToBottom();
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant" && !last.text.trim()) {
          next[next.length - 1] = {
            role: "assistant",
            text: "I couldn't respond right now. Please try again.",
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 0);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] sm:w-[360px] h-[480px] rounded-2xl border border-[#d8c6b2] bg-[#fff8ee] shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[#e4d7c8] bg-[#f5eadc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#8a7559]" />
              <p className="text-sm font-medium text-[#6f5b43]">AI Chat</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-[#8a7559] hover:bg-[#ede1d1]"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  message.role === "user"
                    ? "ml-auto bg-[#e7d6c2] text-[#5d4a34]"
                    : "mr-auto bg-[#f2e6d8] text-[#6f5b43] border border-[#e4d7c8]"
                }`}
              >
                {message.text || (loading && index === messages.length - 1 ? "..." : "")}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-[#e4d7c8] bg-[#f8f1e7]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your notes..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#d8c6b2] bg-[#fffaf3] text-sm text-[#6f5b43] outline-none focus:border-[#a68b5b]"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="w-9 h-9 rounded-lg bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-[#e7d6c2] hover:bg-[#ddc8ad] text-[#6f5b43] border border-[#cfb899] shadow-lg flex items-center justify-center"
          title="Open AI chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

