import { NextRequest, NextResponse } from 'next/server';
import FreeAIService from '@/lib/free-ai-service';

const aiService = new FreeAIService({
  groqApiKey: process.env.GROQ_API_KEY!,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
});

interface KnowledgeGraphRequest {
  content: string;
  noteId?: string;
}

interface ConceptNode {
  id: string;
  label: string;
  definition?: string;
  importance?: 'high' | 'medium' | 'low';
}

interface ConceptEdge {
  source: string;
  target: string;
  relationType:
    | 'prerequisite'
    | 'related'
    | 'includes'
    | 'contrast'
    | 'causes'
    | 'follows';
}

interface KnowledgeGraph {
  title: string;
  concepts: ConceptNode[];
  relationships: ConceptEdge[];
}

function generateGraphPrompt(content: string): string {
  return `Analyze this content and extract the key concepts and their relationships to create a knowledge graph.

CONTENT:
${content}

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "title": "Subject/Title",
  "concepts": [
    {
      "id": "concept1",
      "label": "Concept Name",
      "definition": "Clear definition",
      "importance": "high|medium|low"
    }
  ],
  "relationships": [
    {
      "source": "concept1",
      "target": "concept2",
      "relationType": "prerequisite|related|includes|contrast|causes|follows"
    }
  ]
}

Extract 5-15 key concepts with 4-10 relationships between them. Make relationships meaningful and educational.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: KnowledgeGraphRequest = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content' },
        { status: 400 }
      );
    }

    const prompt = generateGraphPrompt(content);

    // Generate JSON response from Groq
    const graph = await aiService.generateJSON<KnowledgeGraph>(
      prompt,
      generateGraphPrompt(''),
      { maxTokens: 1024 }
    );

    // Ensure valid structure
    if (!graph.concepts || !graph.relationships) {
      throw new Error('Invalid graph structure');
    }

    // Assign unique IDs if missing
    if (!graph.concepts[0]?.id) {
      graph.concepts = graph.concepts.map((c, idx) => ({
        ...c,
        id: `concept-${idx}`,
      }));
    }

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Knowledge graph generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate knowledge graph' },
      { status: 500 }
    );
  }
}
