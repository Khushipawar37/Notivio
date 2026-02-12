'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Loader, X, Copy, Check } from 'lucide-react';

type ExplanationType = 'simplify' | 'example' | 'analogy' | 'practice-question';

interface HighlightAction {
  type: ExplanationType;
  label: string;
  icon: string;
  description: string;
}

const ACTIONS: HighlightAction[] = [
  {
    type: 'simplify',
    label: 'Simplify',
    icon: '🔍',
    description: 'Explain in simple terms',
  },
  {
    type: 'example',
    label: 'Example',
    icon: '💡',
    description: 'Show a real example',
  },
  {
    type: 'analogy',
    label: 'Analogy',
    icon: '🔗',
    description: 'Use a comparison',
  },
  {
    type: 'practice-question',
    label: 'Practice Q',
    icon: '❓',
    description: 'Test your understanding',
  },
];

interface HighlightToAskProps {
  selectedText: string;
  position: { top: number; left: number };
  onClose: () => void;
  onExplanationReceived?: (explanation: string, type: ExplanationType) => void;
  noteContext?: string;
}

export function HighlightToAsk({
  selectedText,
  position,
  onClose,
  onExplanationReceived,
  noteContext,
}: HighlightToAskProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ExplanationType | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleGenerateExplanation = async (action: ExplanationType) => {
    setLoading(true);
    setSelectedAction(action);
    setExplanation(null);

    try {
      const response = await fetch('/api/ai/highlight-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          action,
          context: noteContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setExplanation(data.content || data.explanation || 'No explanation generated');

      if (onExplanationReceived) {
        onExplanationReceived(data.content || '', action);
      }
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      setExplanation('Failed to generate explanation. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <div className="p-4 border-b border-gray-100 flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2">Selected:</p>
          <p className="text-sm font-medium text-gray-800 line-clamp-2">
            "{selectedText}"
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!explanation ? (
        <div className="p-4">
          <p className="text-xs text-gray-600 mb-3 font-medium">
            HOW CAN I EXPLAIN THIS?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((action) => (
              <Button
                key={action.type}
                variant="outline"
                size="sm"
                onClick={() => handleGenerateExplanation(action.type)}
                disabled={loading}
                className="text-xs h-auto py-2 px-2 flex-col gap-1"
              >
                <span className="text-base">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
                <span className="text-[10px] text-gray-500">{action.description}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600 uppercase">
              {ACTIONS.find((a) => a.type === selectedAction)?.label}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-gray-800 leading-relaxed">{explanation}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExplanation(null);
              setSelectedAction(null);
            }}
            className="w-full text-xs"
          >
            Try Another
          </Button>
        </div>
      )}

      {loading && (
        <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating explanation...</span>
        </div>
      )}
    </div>
  );
}

export default HighlightToAsk;
