/**
 * Extracts the YouTube video ID from a URL
 */
export function extractVideoId(url: string): string | null {
  const regexps = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    /youtube.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const regex of regexps) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

type Subsection = {
  title: string;
  content: string[];
};

type Section = {
  title: string;
  content: string[];
  subsections: Subsection[];
};

/**
 * Processes a transcript into structured notes
 */
export async function generateNotesFromTranscript(
  transcript: string,
  title: string
): Promise<{
  title: string;
  transcript: string;
  sections: Section[];
  summary: string;
}> {
  const sections: Section[] = [];
  const paragraphs = transcript.split("\n\n");

  let currentSection: Section = {
    title: "Introduction",
    content: ["This is an automatically generated introduction point."],
    subsections: [],
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    if (paragraph.length < 20) continue;

    if (i % 3 === 0 && i > 0) {
      sections.push(currentSection);
      currentSection = {
        title: `Section ${sections.length + 1}`,
        content: [],
        subsections: [],
      };
    }

    currentSection.content.push(paragraph);

    if (i % 5 === 0 && i > 0) {
      currentSection.subsections.push({
        title: `Subsection ${currentSection.subsections.length + 1}`,
        content: [paragraph],
      });
    }
  }

  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  const summary = `This is an automatically generated summary of "${title}". The video covers ${sections.length} main topics including ${sections
    .map((s) => s.title)
    .join(", ")}.`;

  return {
    title,
    transcript,
    sections,
    summary,
  };
}
