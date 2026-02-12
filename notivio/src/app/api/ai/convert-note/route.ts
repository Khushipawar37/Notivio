import { NextRequest, NextResponse } from 'next/server';
import FreeAIService from '@/lib/free-ai-service';

const aiService = new FreeAIService({
  groqApiKey: process.env.GROQ_API_KEY!,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
});

type ConversionFormat = 'summary' | 'blog' | 'linkedin' | 'flashcards' | 'quiz';

interface ConversionRequest {
  content: string;
  format: ConversionFormat;
  title?: string;
}

function buildConversionPrompt(
  content: string,
  format: ConversionFormat,
  title?: string
): string {
  const titleInfo = title ? `\nTitle: ${title}` : '';

  switch (format) {
    case 'summary':
      return `Create a concise summary of the following content. Include key points, main takeaways, and actionable insights.${titleInfo}

Content:
${content}

Summary:`;

    case 'blog':
      return `Convert the following notes into a well-structured blog article. Include:
1. Engaging introduction
2. Clear sections with subheadings
3. Real-world examples
4. Conclusion with thoughts
5. Call to action

${titleInfo}

Content:
${content}

Blog Article:`;

    case 'linkedin':
      return `Create 3 professional LinkedIn posts based on the following content. Each post should be engaging, have relevant emojis, and include a call to action. Format: POST 1, POST 2, POST 3.${titleInfo}

Content:
${content}

LinkedIn Posts:`;

    case 'flashcards':
      return `Create 10 flashcard pairs from the following content. Format each as: QUESTION | ANSWER. Make them study-friendly with clear, concise definitions.${titleInfo}

Content:
${content}

Flashcards:`;

    case 'quiz':
      return `Return ONLY valid JSON (no markdown) with this structure for a quiz:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this answer"
  }
]

Create 5-6 questions from:${titleInfo}

${content}

JSON:`;

    default:
      return content;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversionRequest = await request.json();
    const { content, format, title } = body;

    if (!content || !format) {
      return NextResponse.json(
        { error: 'Missing content or format' },
        { status: 400 }
      );
    }

    const prompt = buildConversionPrompt(content, format, title);

    let converted: string;

    if (format === 'quiz') {
      // JSON format for quiz
      try {
        const result = await aiService.generateJSON(
          prompt,
          '[{"question": "string", "options": ["string"], "correctAnswer": "string"}]',
          { maxTokens: 1024 }
        );
        converted = JSON.stringify(result, null, 2);
      } catch {
        // Fallback to text
        converted = await aiService.generateText(prompt, { maxTokens: 1024 });
      }
    } else {
      // Text generation for other formats
      converted = await aiService.generateText(prompt, {
        maxTokens:
          format === 'blog'
            ? 2048
            : format === 'linkedin'
              ? 1024
              : format === 'flashcards'
                ? 1024
                : 512,
        temperature: 0.8,
      });
    }

    return NextResponse.json({
      format,
      converted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Note conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert note' },
      { status: 500 }
    );
  }
}
