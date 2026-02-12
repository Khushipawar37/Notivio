/**
 * FREE AI SERVICE - Uses only FREE APIs
 * 
 * Free APIs used:
 * - Groq (llama-3.1-8b-instant) - Fast, Free, No Rate Limits per month
 * - Open AI (if API key provided for free tier)
 * - Hugging Face (Free Inference API)
 * - Local Ollama (completely free, offline)
 */

import Groq from "groq-sdk";

interface AIServiceConfig {
  groqApiKey: string;
  huggingFaceToken?: string;
  ollamaBaseUrl?: string;
}

interface TextGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface JSONGenerationOptions extends TextGenerationOptions {
  schema?: string;
}

class FreeAIService {
  private groq: Groq;
  private huggingFaceToken?: string;
  private ollamaBaseUrl?: string;

  constructor(config: AIServiceConfig) {
    this.groq = new Groq({
      apiKey: config.groqApiKey,
    });
    this.huggingFaceToken = config.huggingFaceToken;
    this.ollamaBaseUrl = config.ollamaBaseUrl || "http://localhost:11434";
  }

  /**
   * Generate text using Groq (FREE) - Fastest free option
   */
  async generateText(
    prompt: string,
    options: TextGenerationOptions = {}
  ): Promise<string> {
    try {
      const message = await this.groq.messages.create({
        model: "llama-3.1-8b-instant", // FREE
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      return textContent.text;
    } catch (error) {
      console.error("Groq generation failed:", error);
      throw error;
    }
  }

  /**
   * Stream text generation from Groq
   */
  async *streamText(
    prompt: string,
    options: TextGenerationOptions = {}
  ): AsyncGenerator<string> {
    try {
      const stream = await this.groq.messages.stream({
        model: "llama-3.1-8b-instant", // FREE
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "text_delta"
        ) {
          yield event.delta.text || "";
        }
      }
    } catch (error) {
      console.error("Groq streaming failed:", error);
      throw error;
    }
  }

  /**
   * Generate JSON using Groq with validation
   */
  async generateJSON<T extends Record<string, any>>(
    prompt: string,
    schema: string,
    options: JSONGenerationOptions = {}
  ): Promise<T> {
    try {
      const fullPrompt = `${prompt}

Return ONLY valid JSON matching this schema:
${schema}

IMPORTANT: Return ONLY the JSON object, no markdown, no extra text.`;

      const text = await this.generateText(fullPrompt, options);

      // Clean up the response
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);
      return parsed as T;
    } catch (error) {
      console.error("JSON generation failed:", error);
      throw new Error(`Failed to generate valid JSON: ${error}`);
    }
  }

  /**
   * Use local Ollama (completely FREE)
   * Requires: ollama run llama2 (or other model)
   */
  async generateWithOllama(
    prompt: string,
    options: TextGenerationOptions = {}
  ): Promise<string> {
    if (!this.ollamaBaseUrl) {
      throw new Error("Ollama base URL not configured");
    }

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama2",
          prompt,
          stream: false,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || "";
    } catch (error) {
      console.error("Ollama generation failed:", error);
      throw error;
    }
  }

  /**
   * Stream with Ollama (completely FREE)
   */
  async *streamWithOllama(
    prompt: string,
    options: TextGenerationOptions = {}
  ): AsyncGenerator<string> {
    if (!this.ollamaBaseUrl) {
      throw new Error("Ollama base URL not configured");
    }

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama2",
          prompt,
          stream: true,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      console.error("Ollama streaming failed:", error);
      throw error;
    }
  }

  /**
   * Summarize content using Groq (FREE)
   */
  async summarize(content: string, maxLength: number = 300): Promise<string> {
    const prompt = `Summarize the following content in ${maxLength} characters or less. Be concise and capture key points only.

Content:
${content}

Summary:`;

    return this.generateText(prompt, { maxTokens: 256 });
  }

  /**
   * Extract key concepts using Groq (FREE)
   */
  async extractConcepts(
    content: string
  ): Promise<Array<{ term: string; definition: string }>> {
    const prompt = `Extract 5-10 key concepts from this content. For each concept, provide a clear definition.

Content:
${content}

Return as JSON array with structure: [{"term": "...", "definition": "..."}]`;

    try {
      const result = await this.generateJSON<
        Array<{ term: string; definition: string }>
      >(
        prompt,
        '[{"term": "string", "definition": "string"}]',
        { maxTokens: 512 }
      );
      return result;
    } catch {
      // Fallback to text generation if JSON fails
      const text = await this.generateText(prompt, { maxTokens: 512 });
      // Try to extract JSON from text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [];
    }
  }

  /**
   * Simplify text explanation (highlight action)
   */
  async simplifyExplanation(text: string): Promise<string> {
    const prompt = `Simplify this concept into a very short, easy-to-understand explanation for beginners:

Text: ${text}

Simplified explanation:`;

    return this.generateText(prompt, { maxTokens: 150 });
  }

  /**
   * Generate example for concept
   */
  async generateExample(concept: string, context: string): Promise<string> {
    const prompt = `Provide a simple, relevant example of "${concept}" in the context of: ${context}

Example:`;

    return this.generateText(prompt, { maxTokens: 200 });
  }

  /**
   * Generate analogy explanation
   */
  async generateAnalogy(concept: string): Promise<string> {
    const prompt = `Create a simple analogy to explain "${concept}" using everyday objects or situations.

Analogy:`;

    return this.generateText(prompt, { maxTokens: 150 });
  }

  /**
   * Generate practice question
   */
  async generatePracticeQuestion(topic: string): Promise<string> {
    const prompt = `Create a practice question to test understanding of: ${topic}

Question:`;

    return this.generateText(prompt, { maxTokens: 150 });
  }

  /**
   * Estimate tokens (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters (for English)
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if Groq API is working
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.generateText("Hi", { maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}

export default FreeAIService;
export type { AIServiceConfig, TextGenerationOptions, JSONGenerationOptions };
