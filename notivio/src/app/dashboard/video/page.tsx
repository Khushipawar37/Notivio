"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Loader2,
  FileDown,
  Edit,
  Save,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  extractVideoId,
  generateNotesFromTranscript,
} from "../../lib/videoUtils";

export default function VideoNotesPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<{
    title: string;
    transcript: string;
    sections: {
      title: string;
      content: string[];
      subsections?: { title: string; content: string[] }[];
    }[];
    summary: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("structured");
  const [editMode, setEditMode] = useState(false);
  const [editableNotes, setEditableNotes] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotes(null);

    try {
      const videoId = extractVideoId(url);

      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      // Fetch video transcript and metadata
      const response = await fetch(
        `/api/video-transcription?videoId=${videoId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch video transcript");
      }

      const data = await response.json();

      // Process transcript into structured notes
      const generatedNotes = await generateNotesFromTranscript(
        data.transcript,
        data.title
      );
      setNotes(generatedNotes);
      setEditableNotes(JSON.parse(JSON.stringify(generatedNotes)));
    } catch (err: any) {
      setError(err.message || "An error occurred while processing the video");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: editMode ? editableNotes : notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${notes?.title || "notes"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating PDF");
    }
  };

  const handleSaveEdits = () => {
    setNotes(editableNotes);
    setEditMode(false);
  };

  const handleEditSection = (sectionIndex: number, content: string[]) => {
    const updatedNotes = { ...editableNotes };
    updatedNotes.sections[sectionIndex].content = content;
    setEditableNotes(updatedNotes);
  };

  const handleEditSubsection = (
    sectionIndex: number,
    subsectionIndex: number,
    content: string[]
  ) => {
    const updatedNotes = { ...editableNotes };
    if (updatedNotes.sections[sectionIndex].subsections) {
      updatedNotes.sections[sectionIndex].subsections[subsectionIndex].content =
        content;
      setEditableNotes(updatedNotes);
    }
  };

  const handleEditSectionTitle = (sectionIndex: number, title: string) => {
    const updatedNotes = { ...editableNotes };
    updatedNotes.sections[sectionIndex].title = title;
    setEditableNotes(updatedNotes);
  };

  const handleEditSubsectionTitle = (
    sectionIndex: number,
    subsectionIndex: number,
    title: string
  ) => {
    const updatedNotes = { ...editableNotes };
    if (updatedNotes.sections[sectionIndex].subsections) {
      updatedNotes.sections[sectionIndex].subsections[subsectionIndex].title =
        title;
      setEditableNotes(updatedNotes);
    }
  };
  type NoteSection = {
    title: string;
    content: string[];
    subsections?: { title: string; content: string[] }[];
  };

  type Notes = {
    title: string;
    transcript: string;
    sections: NoteSection[];
    summary: string;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Generate Notes from YouTube Videos
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter YouTube Video URL</CardTitle>
          <CardDescription>
            Paste a YouTube video URL to automatically generate structured notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Generate Notes"
              )}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {notes && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{notes.title}</h2>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditableNotes(JSON.parse(JSON.stringify(notes)));
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdits}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Notes
                  </Button>
                  <Button onClick={handleDownloadPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="structured">Structured Notes</TabsTrigger>
              <TabsTrigger value="raw">Raw Transcript</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="structured">
              <Card>
                <CardContent className="pt-6">
                  {(editMode ? editableNotes : notes).sections.map(
                    (section, sIndex) => (
                      <div key={sIndex} className="mb-8">
                        {editMode ? (
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) =>
                              handleEditSectionTitle(sIndex, e.target.value)
                            }
                            className="text-xl font-bold mb-3 w-full p-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <h3 className="text-xl font-bold mb-3">
                            {section.title}
                          </h3>
                        )}

                        {editMode ? (
                          <div className="pl-4 mb-4">
                            {section.content.map((point, pIndex) => (
                              <div
                                key={pIndex}
                                className="flex items-start mb-2"
                              >
                                <textarea
                                  value={point}
                                  onChange={(e) => {
                                    const newContent = [...section.content];
                                    newContent[pIndex] = e.target.value;
                                    handleEditSection(sIndex, newContent);
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded-md min-h-[60px]"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newContent = section.content.filter(
                                      (_, i) => i !== pIndex
                                    );
                                    handleEditSection(sIndex, newContent);
                                  }}
                                  className="ml-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newContent = [
                                  ...section.content,
                                  "New point",
                                ];
                                handleEditSection(sIndex, newContent);
                              }}
                              className="mt-2"
                            >
                              Add Point
                            </Button>
                          </div>
                        ) : (
                          <ul className="list-disc pl-8 mb-4 space-y-2">
                            {section.content.map((point, pIndex) => (
                              <li key={pIndex}>{point}</li>
                            ))}
                          </ul>
                        )}

                        {section.subsections &&
                          section.subsections.map((subsection, ssIndex) => (
                            <div key={ssIndex} className="ml-6 mb-4">
                              {editMode ? (
                                <input
                                  type="text"
                                  value={subsection.title}
                                  onChange={(e) =>
                                    handleEditSubsectionTitle(
                                      sIndex,
                                      ssIndex,
                                      e.target.value
                                    )
                                  }
                                  className="text-lg font-semibold mb-2 w-full p-2 border border-gray-300 rounded-md"
                                />
                              ) : (
                                <h4 className="text-lg font-semibold mb-2">
                                  {subsection.title}
                                </h4>
                              )}

                              {editMode ? (
                                <div className="pl-4">
                                  {subsection.content.map((point, pIndex) => (
                                    <div
                                      key={pIndex}
                                      className="flex items-start mb-2"
                                    >
                                      <textarea
                                        value={point}
                                        onChange={(e) => {
                                          const newContent = [
                                            ...subsection.content,
                                          ];
                                          newContent[pIndex] = e.target.value;
                                          handleEditSubsection(
                                            sIndex,
                                            ssIndex,
                                            newContent
                                          );
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md min-h-[60px]"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const newContent =
                                            subsection.content.filter(
                                              (_, i) => i !== pIndex
                                            );
                                          handleEditSubsection(
                                            sIndex,
                                            ssIndex,
                                            newContent
                                          );
                                        }}
                                        className="ml-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newContent = [
                                        ...subsection.content,
                                        "New point",
                                      ];
                                      handleEditSubsection(
                                        sIndex,
                                        ssIndex,
                                        newContent
                                      );
                                    }}
                                    className="mt-2"
                                  >
                                    Add Point
                                  </Button>
                                </div>
                              ) : (
                                <ul className="list-disc pl-8 space-y-2">
                                  {subsection.content.map((point, pIndex) => (
                                    <li key={pIndex}>{point}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                      </div>
                    )
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Notes generated automatically from video content
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardContent className="pt-6">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[600px] overflow-y-auto">
                    {notes.transcript}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-xl font-bold mb-3">Summary</h3>
                    <p className="whitespace-pre-wrap">{notes.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
