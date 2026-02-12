import { NextRequest, NextResponse } from 'next/server';
import FreeAIService from '@/lib/free-ai-service';

const aiService = new FreeAIService({
  groqApiKey: process.env.GROQ_API_KEY!,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
});

type GenerationMode = 'summary' | 'detailed' | 'quiz' | 'flashcards' | 'study_guide';

interface GenerationRequest {
  content: string;
  mode: GenerationMode;
}

function buildPrompt(content: string, mode: GenerationMode): string {
  const basePrompt = `You are an expert educational content analyst. Create high-quality study notes from the provided content.

CONTENT:
${content}

`;

  switch (mode) {
    case 'summary':
      return (
        basePrompt +
        `Create a QUICK SUMMARY with:
1. Main title
2. 3-5 key points (bullet format)
3. 2-3 main concepts with definitions

Format as clear, scannable text. Be concise.`
      );

    case 'detailed':
      return (
        basePrompt +
        `Create DETAILED NOTES with:
1. Clear title
2. Introduction paragraph
3. Main sections (3-5) with explanations
4. Key concepts with definitions
5. Important takeaways

Use clear structure and comprehensive explanations.`
      );

    case 'quiz':
      return (
        basePrompt +
        `Create a QUIZ with:
1. Title
2. 4-6 practice questions
3. For each question: the question, correct answer, and explanation

Format clearly. Make questions challenging but fair.`
      );

    case 'flashcards':
      return (
        basePrompt +
        `Create FLASHCARD MATERIAL with:
1. Title
2. 6-10 flashcard pairs in format: TERM | DEFINITION
3. Include memorable hints or mnemonics

Format as clear front/back cards.`
      );

    case 'study_guide':
      return (
        basePrompt +
        `Create a COMPREHENSIVE STUDY GUIDE with:
1. Title
2. Learning objectives (3-5 goals)
3. Main sections with content
4. Key terms and definitions
5. Review questions
6. Summary points

Organize for structured learning.`
      );

    default:
      return basePrompt;
  }
}

async function* generateStreamingNotes(
  content: string,
  mode: GenerationMode
) {
  const prompt = buildPrompt(content, mode);

  try {
    // Generate the complete response
    const fullResponse = await aiService.generateText(prompt, {
      maxTokens: 2048,
      temperature: 0.8,
    });

    // Parse response into blocks
    const lines = fullResponse.split('\n').filter((l) => l.trim());

    // Title block (first non-empty line)
    if (lines.length > 0) {
      yield {
        type: 'block',
        block: {
          type: 'title',
          content: lines[0].replace(/^#+\s*/, '').trim(),
        },
      };
    }

    // Process remaining lines into blocks
    let currentSection = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Section headers
      if (line.startsWith('##') || (line.includes(':') && line.length < 80)) {
        if (currentSection) {
          yield {
            type: 'block',
            block: {
              type: 'section',
              content: currentSection,
            },
          };
          currentSection = '';
        }
        yield {
          type: 'block',
          block: {
            type: 'section',
            content: line.replace(/^#+\s*/, '').replace(':', '').trim(),
          },
        };
      }
      // Concept definitions (contains dash or pipe)
      else if (line.includes('|') || line.includes(' - ')) {
        const [term, definition] = line.split(/\||:\s?|-\s?/);
        if (term && definition) {
          yield {
            type: 'block',
            block: {
              type: 'concept',
              content: definition.trim(),
              metadata: { term: term.trim() },
            },
          };
        }
      }
      // Question patterns
      else if (
        line.match(/^(Q:|Question:|Q\d+:|\d+\.)/) ||
        line.endsWith('?')
      ) {
        const question = line.replace(/^(Q:|Question:|Q\d+:|\d+\.)\s*/, '').trim();
        yield {
          type: 'block',
          block: {
            type: 'quiz',
            content: '',
            metadata: { question },
          },
        };
      }
      // Regular content
      else if (line.trim()) {
        currentSection += (currentSection ? ' ' : '') + line;
        if (currentSection.length > 200) {
          yield {
            type: 'block',
            block: {
              type: 'section',
              content: currentSection,
            },
          };
          currentSection = '';
        }
      }
    }

    // Flush remaining content
    if (currentSection) {
      yield {
        type: 'block',
        block: {
          type: 'section',
          content: currentSection,
        },
      };
    }

    // Completion signal
    yield { type: 'complete' };
  } catch (error) {
    console.error('Error generating notes:', error);
    yield {
      type: 'block',
      block: {
        type: 'section',
        content: 'Error generating notes. Please try again.',
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { content, mode } = body;

    if (!content || !mode) {
      return NextResponse.json(
        { error: 'Missing content or mode' },
        { status: 400 }
      );
    }

    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const data of generateStreamingNotes(content, mode)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(data)}\n\n`
            )
          );
          // Small delay for better streaming visualization
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Notes generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
}
