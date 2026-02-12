'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Loader, X, Copy, Check, Download } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';

type GenerationMode = 'summary' | 'detailed' | 'quiz' | 'flashcards' | 'study_guide';

interface GenerationBlock {
  type: 'title' | 'section' | 'concept' | 'quiz' | 'code' | 'image';
  content: string;
  metadata?: Record<string, any>;
}

interface NotesGeneratorProps {
  initialContent?: string;
  onClose?: () => void;
}

const GENERATION_MODES: Array<{
  id: GenerationMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'summary',
    label: 'Quick Summary',
    description: 'Fast, condensed notes with key points',
    icon: '⚡',
  },
  {
    id: 'detailed',
    label: 'Detailed Notes',
    description: 'Comprehensive notes with explanations',
    icon: '📚',
  },
  {
    id: 'quiz',
    label: 'Quiz Generator',
    description: 'Generate practice questions and answers',
    icon: '❓',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Create spaced-repetition flashcards',
    icon: '🎯',
  },
  {
    id: 'study_guide',
    label: 'Study Guide',
    description: 'Complete study guide with objectives',
    icon: '🎓',
  },
];

export function NotesGenerator({ initialContent, onClose }: NotesGeneratorProps) {
  const [content, setContent] = useState(initialContent || '');
  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<GenerationBlock[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGenerateNotes = async () => {
    if (!content.trim() || !selectedMode) {
      alert('Please enter content and select a mode');
      return;
    }

    setLoading(true);
    setGeneratedNotes([]);
    setStreaming(true);

    try {
      const response = await fetch('/api/ai/generate-notes-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mode: selectedMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'block') {
                setGeneratedNotes((prev) => [...prev, data.block]);
              } else if (data.type === 'complete') {
                setStreaming(false);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Failed to generate notes:', error);
      setGeneratedNotes([
        {
          type: 'title',
          content: 'Error generating notes',
        },
        {
          type: 'section',
          content: 'Please try again or check your input content.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    const text = generatedNotes
      .map((block) => block.content)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAsMarkdown = () => {
    let markdown = '';
    generatedNotes.forEach((block) => {
      switch (block.type) {
        case 'title':
          markdown += `# ${block.content}\n\n`;
          break;
        case 'section':
          markdown += `## ${block.content}\n\n`;
          break;
        case 'concept':
          markdown += `**${block.metadata?.term}**: ${block.content}\n\n`;
          break;
        case 'quiz':
          markdown += `### Question\n${block.metadata?.question}\n## Answer\n${block.content}\n\n`;
          break;
        default:
          markdown += `${block.content}\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Generate Study Notes</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {!generatedNotes.length ? (
            <>
              {/* Input Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Content to Process
                </label>
                <Textarea
                  placeholder="Paste video transcript, article text, or lecture notes here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[150px] resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  {content.length} characters
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Generation Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GENERATION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      disabled={loading}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedMode === mode.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-2xl mb-2 block">{mode.icon}</span>
                      <p className="font-medium text-sm">{mode.label}</p>
                      <p className="text-xs text-gray-600 mt-1">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Generated Notes Display */}
              <div ref={contentRef} className="space-y-4">
                {generatedNotes.map((block, idx) => (
                  <div key={idx} className="space-y-2">
                    {block.type === 'title' && (
                      <h3 className="text-xl font-bold text-gray-900">
                        {block.content}
                      </h3>
                    )}
                    {block.type === 'section' && (
                      <h4 className="text-lg font-semibold text-gray-800 mt-4">
                        {block.content}
                      </h4>
                    )}
                    {block.type === 'concept' && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="font-semibold text-sm text-blue-900">
                          {block.metadata?.term}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{block.content}</p>
                      </div>
                    )}
                    {block.type === 'quiz' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="font-semibold text-sm text-yellow-900 mb-2">
                          Q: {block.metadata?.question}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">A: </span>
                          {block.content}
                        </p>
                      </div>
                    )}
                    {block.type === 'section' && block.content && (
                      <p className="text-gray-700 leading-relaxed">{block.content}</p>
                    )}
                  </div>
                ))}
                {streaming && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating more...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center gap-3">
          {generatedNotes.length > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedNotes([]);
                  setSelectedMode(null);
                }}
              >
                Generate More
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAsMarkdown}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download MD
                </Button>
              </div>
            </>
          ) : (
            <>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleGenerateNotes}
                disabled={!content.trim() || !selectedMode || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Notes'
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default NotesGenerator;
