import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transcript, title, duration } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Simple AI-like processing to structure the notes
    // In a real implementation, you'd use an AI service like OpenAI
    const sections = generateStructuredSections(transcript);
    const summary = generateSummary(transcript);
    const keyPoints = generateKeyPoints(transcript);

    const notes = {
      title: title || "Video Notes",
      transcript,
      sections,
      summary,
      keyPoints,
      duration: duration || "Unknown",
    };

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error("Error generating notes:", error);
    return NextResponse.json(
      { error: "Failed to generate notes" },
      { status: 500 }
    );
  }
}

function generateStructuredSections(transcript: string) {
  // Simple text processing to create sections
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10);
  const sectionsCount = Math.min(
    Math.max(Math.floor(sentences.length / 10), 3),
    8
  );
  const sentencesPerSection = Math.floor(sentences.length / sectionsCount);

  const sections = [];

  for (let i = 0; i < sectionsCount; i++) {
    const startIdx = i * sentencesPerSection;
    const endIdx =
      i === sectionsCount - 1
        ? sentences.length
        : (i + 1) * sentencesPerSection;
    const sectionSentences = sentences.slice(startIdx, endIdx);

    // Generate section title from first sentence
    const firstSentence = sectionSentences[0]?.trim() || `Section ${i + 1}`;
    const title =
      firstSentence.length > 50
        ? firstSentence.substring(0, 47) + "..."
        : firstSentence;

    // Create content points
    const content = sectionSentences
      .filter((s) => s.trim().length > 20)
      .slice(0, 5)
      .map((s) => s.trim());

    sections.push({
      title: title.replace(/^[^a-zA-Z]*/, "").trim() || `Section ${i + 1}`,
      content: content.length > 0 ? content : [`Content for section ${i + 1}`],
    });
  }

  return sections;
}

function generateSummary(transcript: string) {
  // Simple summary generation
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  const importantSentences = sentences
    .slice(0, Math.min(sentences.length, 5))
    .map((s) => s.trim())
    .join(". ");

  return (
    importantSentences ||
    "This video covers various topics and provides valuable insights."
  );
}

function generateKeyPoints(transcript: string) {
  // Extract key points
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 15);
  const keyPoints = sentences
    .slice(0, Math.min(sentences.length, 6))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return keyPoints.length > 0
    ? keyPoints
    : [
        "Key insights from the video content",
        "Important concepts and ideas discussed",
        "Main takeaways for viewers",
      ];
}
