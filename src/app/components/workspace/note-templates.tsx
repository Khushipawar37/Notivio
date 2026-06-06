"use client";

import { BookOpen, FileText, LayoutGrid, ListTree, X } from "lucide-react";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "cornell",
    name: "Cornell Notes",
    description: "Structured format with cues, notes, and summary",
    icon: <LayoutGrid className="w-4 h-4" />,
    content: `<h1>Cornell Notes</h1>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="width: 30%; border: 1px solid rgba(255,255,255,0.1); padding: 12px; text-align: left; background: rgba(99,102,241,0.1);">Cue Column</th>
      <th style="width: 70%; border: 1px solid rgba(255,255,255,0.1); padding: 12px; text-align: left; background: rgba(99,102,241,0.1);">Note-Taking Column</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; vertical-align: top;">
        <p><em>Key questions, terms, and cues go here after class</em></p>
      </td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; vertical-align: top;">
        <p><em>Record notes during class or while reading here</em></p>
        <ul>
          <li>Main point 1</li>
          <li>Main point 2</li>
          <li>Main point 3</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>
<h2>Summary</h2>
<p><em>Write a brief summary of the key points in your own words after reviewing...</em></p>`,
  },
  {
    id: "lecture",
    name: "Lecture Notes",
    description: "Date, topic, key points, and summary",
    icon: <BookOpen className="w-4 h-4" />,
    content: `<h1>Lecture Notes</h1>
<div data-callout data-callout-type="info" class="callout callout-info">
  <p><strong>Course:</strong> [Course Name]</p>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  <p><strong>Topic:</strong> [Lecture Topic]</p>
  <p><strong>Instructor:</strong> [Name]</p>
</div>
<h2>Key Concepts</h2>
<ol>
  <li><strong>Concept 1:</strong> Description...</li>
  <li><strong>Concept 2:</strong> Description...</li>
  <li><strong>Concept 3:</strong> Description...</li>
</ol>
<h2>Detailed Notes</h2>
<p>Start your detailed notes here...</p>
<h2>Questions to Follow Up</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false">Question 1?</li>
  <li data-type="taskItem" data-checked="false">Question 2?</li>
</ul>
<h2>Summary</h2>
<p><em>Summarize the key takeaways in 3-5 sentences...</em></p>`,
  },
  {
    id: "comparison",
    name: "Comparison Table",
    description: "Side-by-side comparison of concepts",
    icon: <LayoutGrid className="w-4 h-4" />,
    content: `<h1>Comparison: [Topic A] vs [Topic B]</h1>
<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; background: rgba(99,102,241,0.1);">Aspect</th>
      <th style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; background: rgba(168,85,247,0.1);">Topic A</th>
      <th style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; background: rgba(236,72,153,0.1);">Topic B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; font-weight: bold;">Definition</td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; font-weight: bold;">Key Features</td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; font-weight: bold;">Advantages</td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; font-weight: bold;">Disadvantages</td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px; font-weight: bold;">Use Cases</td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
      <td style="border: 1px solid rgba(255,255,255,0.1); padding: 12px;"></td>
    </tr>
  </tbody>
</table>
<h2>Conclusion</h2>
<p><em>Which is better suited for your use case and why?</em></p>`,
  },
  {
    id: "mindmap_outline",
    name: "Mind Map Outline",
    description: "Central topic with branching subtopics",
    icon: <ListTree className="w-4 h-4" />,
    content: `<h1>[Central Topic]</h1>
<p><em>A hierarchical breakdown of your topic</em></p>
<h2>Branch 1: [Subtopic]</h2>
<ul>
  <li><strong>Key Point 1.1</strong>
    <ul>
      <li>Detail A</li>
      <li>Detail B</li>
    </ul>
  </li>
  <li><strong>Key Point 1.2</strong>
    <ul>
      <li>Detail A</li>
      <li>Detail B</li>
    </ul>
  </li>
</ul>
<h2>Branch 2: [Subtopic]</h2>
<ul>
  <li><strong>Key Point 2.1</strong>
    <ul>
      <li>Detail A</li>
      <li>Detail B</li>
    </ul>
  </li>
  <li><strong>Key Point 2.2</strong>
    <ul>
      <li>Detail A</li>
      <li>Detail B</li>
    </ul>
  </li>
</ul>
<h2>Branch 3: [Subtopic]</h2>
<ul>
  <li><strong>Key Point 3.1</strong></li>
  <li><strong>Key Point 3.2</strong></li>
</ul>
<h2>Connections & Insights</h2>
<div data-callout data-callout-type="tip" class="callout callout-tip">
  <p>Note any connections between branches, patterns, or insights here...</p>
</div>`,
  },
];

interface NoteTemplatesProps {
  onSelectTemplate: (content: string) => void;
  onClose: () => void;
}

export function NoteTemplates({ onSelectTemplate, onClose }: NoteTemplatesProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Note Templates</h3>
            <p className="text-xs text-white/40 mt-0.5">Choose a template to start with</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {NOTE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelectTemplate(template.content);
                onClose();
              }}
              className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                  {template.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-white/70 group-hover:text-white/90">{template.name}</div>
                  <div className="text-xs text-white/35">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              onSelectTemplate("<h1>Untitled</h1><p>Start writing...</p>");
              onClose();
            }}
            className="w-full text-left p-4 rounded-xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-white/30">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white/50">Blank Page</div>
                <div className="text-xs text-white/25">Start from scratch</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

