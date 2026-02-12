import { NextRequest, NextResponse } from 'next/server';
import FreeAIService from '@/lib/free-ai-service';

const aiService = new FreeAIService({
  groqApiKey: process.env.GROQ_API_KEY!,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
});

type ExplanationType = 'simplify' | 'example' | 'analogy' | 'practice-question';

interface ExplanationRequest {
  text: string;
  action: ExplanationType;
  context?: string;
}

// GET - Return available actions
export async function GET() {
  return NextResponse.json({
    actions: [
      {
        type: 'simplify',
        label: 'Simplify',
        description: 'Explain in simple, easy-to-understand terms',
      },
      {
        type: 'example',
        label: 'Example',
        description: 'Provide a real-world example',
      },
      {
        type: 'analogy',
        label: 'Analogy',
        description: 'Explain using a comparison to something familiar',
      },
      {
        type: 'practice-question',
        label: 'Practice Question',
        description: 'Generate a question to test understanding',
      },
    ],
  });
}

// POST - Generate explanation
export async function POST(request: NextRequest) {
  try {
    const body: ExplanationRequest = await request.json();
    const { text, action, context } = body;

    if (!text || !action) {
      return NextResponse.json(
        { error: 'Missing text or action' },
        { status: 400 }
      );
    }

    let explanation = '';

    switch (action) {
      case 'simplify':
        explanation = await aiService.simplifyExplanation(text);
        break;

      case 'example': {
        const contextStr = context || 'general knowledge';
        explanation = await aiService.generateExample(text, contextStr);
        break;
      }

      case 'analogy':
        explanation = await aiService.generateAnalogy(text);
        break;

      case 'practice-question':
        explanation = await aiService.generatePracticeQuestion(text);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      action,
      content: explanation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Highlight explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
