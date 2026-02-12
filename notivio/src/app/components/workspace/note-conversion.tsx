'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Loader, X, Copy, Check, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

type ConversionFormat = 'summary' | 'blog' | 'linkedin' | 'flashcards' | 'quiz';

interface ConversionOption {
  id: ConversionFormat;
  label: string;
  description: string;
  icon: string;
  bestFor: string;
}

interface NoteConversionProps {
  noteContent: string;
  noteTitle?: string;
  onClose?: () => void;
}

const CONVERSION_OPTIONS: ConversionOption[] = [
  {
    id: 'summary',
    label: 'Summary',
    description: 'Condensed key points',
    icon: '📋',
    bestFor: 'Quick reference',
  },
  {
    id: 'blog',
    label: 'Blog Article',
    description: 'Long-form content',
    icon: '📝',
    bestFor: 'Detailed explanation',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Posts',
    description: 'Social media ready',
    icon: '💼',
    bestFor: 'Sharing insights',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Study cards',
    icon: '🎯',
    bestFor: 'Memorization',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Assessment questions',
    icon: '❓',
    bestFor: 'Self-testing',
  },
];

export function NoteConversion({
  noteContent,
  noteTitle,
  onClose,
}: NoteConversionProps) {
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [converted, setConverted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async (format: ConversionFormat) => {
    setLoading(true);
    setSelectedFormat(format);
    setConverted(null);

    try {
      const response = await fetch('/api/ai/convert-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          format,
          title: noteTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setConverted(data.converted || data.content || '');
    } catch (error) {
      console.error('Conversion failed:', error);
      setConverted('Failed to convert note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (converted) {
      navigator.clipboard.writeText(converted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!converted) return;

    const extension = selectedFormat === 'quiz' ? 'json' : 'txt';
    const blob = new Blob([converted], {
      type: selectedFormat === 'quiz' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle || 'note'}-${selectedFormat}.${extension}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold">Convert Note</h2>
            {noteTitle && <p className="text-sm text-gray-600 mt-1">{noteTitle}</p>}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {!converted ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Choose a format to convert your notes into
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CONVERSION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleConvert(option.id)}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedFormat === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${loading ? 'opacity-50' : ''}`}
                  >
                    <span className="text-3xl mb-2 block">{option.icon}</span>
                    <p className="font-bold text-sm mb-1">{option.label}</p>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      Best for: {option.bestFor}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  {selectedFormat === 'quiz' ? (
                    <div className="space-y-4">
                      {(() => {
                        try {
                          const questions = JSON.parse(converted);
                          return Array.isArray(questions)
                            ? questions.map((q, idx) => (
                                <div
                                  key={idx}
                                  className="bg-yellow-50 border border-yellow-200 rounded p-4"
                                >
                                  <p className="font-semibold mb-2">
                                    Q{idx + 1}: {q.question}
                                  </p>
                                  {q.options && (
                                    <ul className="list-inside list-letter space-y-1 mb-2 text-sm ml-4">
                                      {q.options.map((opt: string, i: number) => (
                                        <li key={i}>{opt}</li>
                                      ))}
                                    </ul>
                                  )}
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Answer: </span>
                                    {q.answer || q.correctAnswer}
                                  </p>
                                </div>
                              ))
                            : <p>{converted}</p>;
                        } catch {
                          return (
                            <div className="whitespace-pre-wrap text-sm text-gray-700">
                              {converted}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-gray-700">
                      {converted}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px] text-xs text-gray-800">
                    {converted}
                  </pre>
                </TabsContent>
              </Tabs>
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-gray-600 py-8">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">Converting...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between gap-3">
          {converted ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setConverted(null);
                  setSelectedFormat(null);
                }}
              >
                Convert Another
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
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
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
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
              <div className="text-sm text-gray-600">
                Select a format above to get started
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default NoteConversion;
