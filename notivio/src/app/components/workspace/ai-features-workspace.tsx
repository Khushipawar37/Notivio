'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import {
  BarChart3,
  FileText,
  Lightbulb,
  Network,
  Share2,
  Eye,
} from 'lucide-react';

// Import all feature components
import { NotesGenerator } from './notes-generator-modal';
import { HighlightToAsk } from './highlight-to-ask';
import { KnowledgeGraphVisualizer } from './knowledge-graph-visualizer';
import { NoteConversion } from './note-conversion';
import { StudyAnalyticsDashboard } from './study-analytics-dashboard';

interface AIFeaturesWorkspaceProps {
  noteId?: string;
  selectedText?: string;
  noteContent?: string;
  noteTitle?: string;
}

export function AIFeaturesWorkspace({
  noteId,
  selectedText,
  noteContent = '',
  noteTitle = 'My Notes',
}: AIFeaturesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('generator');
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showHighlightToAsk, setShowHighlightToAsk] = useState(false);
  const [showNotesGenerator, setShowNotesGenerator] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showNoteConversion, setShowNoteConversion] = useState(false);
  const [selectedTextState, setSelectedTextState] = useState(selectedText || '');

  // Handle text selection for highlight-to-ask
  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 0) {
      setSelectedTextState(selection);
      const range = window.getSelection()?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top + window.scrollY + rect.height + 10,
          left: rect.left + window.scrollX,
        });
        setShowHighlightToAsk(true);
      }
    }
  };

  return (
    <div onMouseUp={handleTextSelection} className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">AI Learning Assistant</h1>
        <p className="text-gray-600">
          Powered by Groq (100% FREE - No API costs ever!)
        </p>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Button
            onClick={() => setShowNotesGenerator(true)}
            className="gap-2 h-auto py-3 flex-col items-start"
            variant="outline"
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Generate Notes</span>
            <span className="text-xs text-gray-600">All 5 modes</span>
          </Button>

          <Button
            onClick={() => setShowHighlightToAsk(true)}
            disabled={!noteContent}
            className="gap-2 h-auto py-3 flex-col items-start"
            variant="outline"
          >
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium">Highlight & Ask</span>
            <span className="text-xs text-gray-600">Explain selected text</span>
          </Button>

          <Button
            onClick={() => setShowKnowledgeGraph(true)}
            disabled={!noteContent}
            className="gap-2 h-auto py-3 flex-col items-start"
            variant="outline"
          >
            <Network className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Knowledge Map</span>
            <span className="text-xs text-gray-600">Visualize concepts</span>
          </Button>

          <Button
            onClick={() => setShowNoteConversion(true)}
            disabled={!noteContent}
            className="gap-2 h-auto py-3 flex-col items-start"
            variant="outline"
          >
            <Share2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Convert Note</span>
            <span className="text-xs text-gray-600">5 output formats</span>
          </Button>

          <Button
            onClick={() => setActiveTab('analytics')}
            className="gap-2 h-auto py-3 flex-col items-start"
            variant="outline"
          >
            <BarChart3 className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium">Analytics</span>
            <span className="text-xs text-gray-600">View insights</span>
          </Button>
        </div>
      </div>

      {/* Features Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">📝 Generator</TabsTrigger>
          <TabsTrigger value="highlight">💡 Highlight</TabsTrigger>
          <TabsTrigger value="graph">🌐 Graph</TabsTrigger>
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
        </TabsList>

        {/* Notes Generator Tab */}
        <TabsContent value="generator" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Multi-Mode Note Generator</h2>
            <p className="text-gray-600 mb-4">
              Generate high-quality study notes in multiple formats from any content. Choose
              from Quick Summary, Detailed Notes, Quiz, Flashcards, or Study Guide.
            </p>
            <Button onClick={() => setShowNotesGenerator(true)} size="lg">
              Open Note Generator
            </Button>
          </Card>
        </TabsContent>

        {/* Highlight Tab */}
        <TabsContent value="highlight" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Highlight-to-Ask AI</h2>
            <p className="text-gray-600 mb-4">
              Select any text in your notes and get instant explanations. Choose from:
            </p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>✨ <strong>Simplify</strong> - Break down complex concepts</li>
              <li>💡 <strong>Example</strong> - Get real-world examples</li>
              <li>🔗 <strong>Analogy</strong> - Learn via comparisons</li>
              <li>❓ <strong>Practice Q</strong> - Test your understanding</li>
            </ul>
            <p className="text-sm text-gray-600">
              💡 Try selecting text in your notes to see this feature in action!
            </p>
          </Card>
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Knowledge Graph Visualizer</h2>
            <p className="text-gray-600 mb-4">
              Visualize how concepts relate to each other. Automatically extracts concepts and
              shows relationships like:
            </p>
            <ul className="space-y-1 text-gray-700 mb-6 text-sm">
              <li>🔴 Prerequisite - Must learn first</li>
              <li>🔵 Related - Conceptually connected</li>
              <li>🟢 Includes - Parent concept</li>
              <li>🟠 Contrast - Opposite concepts</li>
              <li>🟡 Causes - Causal relationships</li>
            </ul>
            <Button onClick={() => setShowKnowledgeGraph(true)} size="lg">
              Generate Knowledge Graph
            </Button>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <StudyAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Feature Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-3">🆓 100% FREE Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Multi-mode note generation (5 modes)</li>
            <li>✅ Highlight-to-ask explanations (4 types)</li>
            <li>✅ Knowledge graph visualization</li>
            <li>✅ Note conversion (5 formats)</li>
            <li>✅ Study analytics dashboard</li>
            <li>✅ Zero API costs forever</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-3">⚡ Technology Stack</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>🤖 <strong>Groq LLaMA 3.1</strong> - Free fast AI</li>
            <li>📊 <strong>React Flow</strong> - Interactive graphs</li>
            <li>📈 <strong>Recharts</strong> - Beautiful analytics</li>
            <li>🎨 <strong>Tailwind CSS</strong> - Modern design</li>
            <li>⚡ <strong>Next.js 15</strong> - Fast backend</li>
            <li>🔄 <strong>Server-Sent Events</strong> - Real-time streaming</li>
          </ul>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-lg mb-3">💡 Pro Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-2">📝 Generate Notes</p>
            <p>Paste any transcript or article. Pick your mode. Get instant structured notes.</p>
          </div>
          <div>
            <p className="font-medium mb-2">🖱️ Highlight & Learn</p>
            <p>Just select text anywhere. A popup appears with 4 explanation options.</p>
          </div>
          <div>
            <p className="font-medium mb-2">🌐 Visualize Concepts</p>
            <p>Auto-extract concepts and see how they relate. Great for studying.</p>
          </div>
        </div>
      </Card>

      {/* Modals */}
      {showNotesGenerator && (
        <NotesGenerator
          initialContent={noteContent}
          onClose={() => setShowNotesGenerator(false)}
        />
      )}

      {showHighlightToAsk && selectedTextState && highlightPosition && (
        <HighlightToAsk
          selectedText={selectedTextState}
          position={highlightPosition}
          onClose={() => setShowHighlightToAsk(false)}
          noteContext={noteContent}
        />
      )}

      {showKnowledgeGraph && (
        <KnowledgeGraphVisualizer
          noteContent={noteContent}
          noteId={noteId}
          onClose={() => setShowKnowledgeGraph(false)}
        />
      )}

      {showNoteConversion && (
        <NoteConversion
          noteContent={noteContent}
          noteTitle={noteTitle}
          onClose={() => setShowNoteConversion(false)}
        />
      )}
    </div>
  );
}

export default AIFeaturesWorkspace;
