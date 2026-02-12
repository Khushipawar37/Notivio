# 🆓 FREE APIS GUIDE - NOTIVIO

## Overview
Notivio now uses **100% FREE APIs** - No paid subscriptions required!

### API Options Overview

| API | Service | Free Tier | Speed | Best For |
|-----|---------|-----------|-------|----------|
| **Groq** (Recommended) | LLaMA 3.1 8B | Unlimited | ⚡ Very Fast | Text generation, notes |
| **Ollama** | Local LLMs | Unlimited | ⚡⚡ Fastest | Offline, no API needed |
| **Hugging Face** | Various Models | Limited | ⚡ Fast | Embeddings, classification |
| **Google Colab** | Compute | Limited | ⚡ Very Fast | Heavy processing |
| **Replicate** | Model Hosting | Free tier | ⚡ Fast | Image generation |

---

## 🚀 SETUP (30 minutes)

### 1. Get Groq API Key (Recommended)
```bash
1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Copy the key
5. Add to .env.local:
   GROQ_API_KEY=your_key_here
6. Done! ✅ No credit card needed
```

**Why Groq is best:**
- ✅ Unlimited free tier
- ✅ Fastest open-source models
- ✅ No rate limits
- ✅ No credit card required
- ✅ LLaMA 3.1 (70B) available

### 2. Optional: Setup Ollama (Truly Offline)
```bash
# Download from https://ollama.ai

# Install (auto-detects GPU)
# Run a model:
ollama pull llama2
ollama pull neural-chat
ollama serve

# Add to .env.local:
OLLAMA_BASE_URL=http://localhost:11434
```

**Ollama Benefits:**
- ✅ Completely offline
- ✅ No API keys needed
- ✅ Runs on your machine
- ✅ No cost ($0)
- ❌ Slower than Groq (depends on GPU)

---

## 📝 FREE APIS AVAILABLE

### Text Generation (FREE)

#### Groq (Preferred)
```typescript
import FreeAIService from '@/lib/free-ai-service';

const service = new FreeAIService({
  groqApiKey: process.env.GROQ_API_KEY!,
});

// Generate text
const text = await service.generateText(
  "Explain quantum computing in simple terms",
  { maxTokens: 512 }
);

// Stream text (real-time)
for await (const chunk of service.streamText(prompt)) {
  console.log(chunk); // Get text chunk by chunk
}

// Generate JSON
const json = await service.generateJSON(
  "Extract concepts from this text: ...",
  '{"concepts": [{"term": "string", "definition": "string"}]}',
  { maxTokens: 1024 }
);
```

**Models Available:**
- `llama-3.1-8b-instant` (default) - Fast, good quality
- `llama-3.1-70b-versatile` - Larger, slower, better quality
- `mixtral-8x7b-32768` - Mixture of experts, great for reasoning

#### Ollama (Offline Alternative)
```typescript
// Use same service with Ollama configured
const service = new FreeAIService({
  ollamaBaseUrl: 'http://localhost:11434',
});

const text = await service.generateWithOllama(prompt);

// Stream with Ollama
for await (const chunk of service.streamWithOllama(prompt)) {
  console.log(chunk);
}
```

---

### Image Generation (FREE Options)

#### Option 1: Replicate (Free Tier)
```typescript
// https://replicate.com
// Free tier: Limited API calls

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const output = await replicate.run(
  'stability-ai/stable-diffusion:...',
  { input: { prompt: 'A beautiful sunset' } }
);
```

#### Option 2: Hugging Face (Free)
```typescript
// https://huggingface.co
// Free tier: Rate limited

const response = await fetch(
  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
  {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    method: 'POST',
    body: JSON.stringify({ inputs: 'a dog' }),
  }
);
```

---

### Video Understanding (FREE)

#### YouTube Transcript (Built-in)
```typescript
// Extract video ID
const videoId = extractVideoId(videoUrl);

// Get transcript (no API needed!)
const transcript = await fetchTranscriptWithFallbacks(videoId);
```

**Already built-in:** `/api/video-transcript`

#### Whisper (OpenAI - FREE tier available)
```typescript
// https://openai.com/research/whisper
// Can run locally with OpenAI's weights

import * as fs from 'fs';

const transcription = await fetch(
  'https://api.openai.com/v1/audio/transcriptions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  }
);
```

---

### Embeddings (Vector Search - FREE)

#### Hugging Face Sentence Transformers
```typescript
// Free inference API

const response = await fetch(
  'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
  {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    method: 'POST',
    body: JSON.stringify({
      inputs: 'This is an important concept',
    }),
  }
);

const embeddings = await response.json();
```

#### Ollama Embeddings (Offline)
```typescript
// Use Ollama for completely offline embeddings

const response = await fetch(
  'http://localhost:11434/api/embeddings',
  {
    method: 'POST',
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: 'Text to embed',
    }),
  }
);
```

---

### Database (FREE Options)

#### Supabase (PostgreSQL - 500MB free)
```typescript
// https://supabase.com (free tier)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const { data, error } = await supabase
  .from('notes')
  .select('*');
```

#### Firebase (Firestore - 1GB free)
```typescript
// https://firebase.google.com (existing)

import { getFirestore } from 'firebase/firestore';

const db = getFirestore();
```

---

## 💡 NOTIVIO FEATURES USING FREE APIS

### ✅ Feature 1: Multi-Mode Note Generation
```
Input → Your lecture transcript
Process → Groq LLaMA (free)
Output → Structured study notes
Cost → $0.00 ✅
```

- **Modes:** Summary, Detailed, Quiz, Flashcards, Study Guide
- **API:** `/api/ai/generate-notes-v2` → Uses Groq
-Component:** `<NotesGenerator />`

### ✅ Feature 2: Highlight-to-Ask AI
```
Input → Selected text with context
Process → Groq (free)
Output → Simplify, Example, Analogy, Practice Q
Cost → $0.00 ✅
```

- **Actions:** 4 types of explanations
- **API:** `/api/ai/highlight-explain` → Uses Groq
- **Component:** `<HighlightToAsk />`

### ✅ Feature 3: Knowledge Graph Generator
```
Input → Note content
Process → Groq LLaMA (free)
Output → Interactive graph visualization
Cost → $0.00 ✅
```

- **Output:** React Flow compatible
- **API:** `/api/ai/knowledge-graph` → Uses Groq
- **Component:** `<KnowledgeGraphVisualizer />`

### ✅ Feature 4: Note Conversion
```
Input → Your notes
Process → Groq (free)
Output → 5 formats (blog, LinkedIn, quiz, etc)
Cost → $0.00 ✅
```

- **Formats:** Summary, Blog, LinkedIn, Flashcards, Quiz
- **API:** `/api/ai/convert-note` → Uses Groq
- **Component:** `<NoteConversion />`

### ✅ Feature 5: Study Analytics
```
Input → Tracking data
Process → Local calculation
Output → Beautiful dashboards
Cost → $0.00 ✅
```

- **Metrics:** Time spent, notes created, quiz scores
- **API:** `/api/analytics` → Uses mock data
- **Component:** `<StudyAnalyticsDashboard />`

---

## 🔧 FREE API SERVICE CLASS

Located: `src/lib/free-ai-service.ts`

### Available Methods

```typescript
// Text generation
await service.generateText(prompt, options)
async* service.streamText(prompt, options)

// JSON generation with validation
await service.generateJSON<T>(prompt, schema, options)

// Offline (Ollama)
await service.generateWithOllama(prompt, options)
async* service.streamWithOllama(prompt, options)

// Utility functions
await service.summarize(content, maxLength)
await service.extractConcepts(content)
await service.simplifyExplanation(text)
await service.generateExample(concept, context)
await service.generateAnalogy(concept)
await service.generatePracticeQuestion(topic)
service.estimateTokens(text)
await service.checkHealth()
```

---

## 📊 Cost Comparison

### Monthly Costs (100 users, 1000 API calls)

| Service | Old Cost | New Cost | Savings |
|---------|----------|----------|---------|
| OpenAI GPT-4 | $75/month | $0 | 100% ✅ |
| Claude API | $90/month | $0 | 100% ✅ |
| Groq LLaMA | $0 | $0 | ✅ Free |
| **TOTAL** | **$165/mo** | **$0/mo** | **100% ✅** |

### Usage Estimates

```
1000 API calls per month:
- OpenAI: ~$50-100
- Anthropic: ~$60-120
- Groq: $0 ✅
- Ollama: $0 ✅

With Groq/Ollama → Infinite scale = $0
```

---

## 🚀 QUICK START COMMANDS

### Install Dependencies
```bash
npm install groq-sdk
# That's it! Groq is included in package.json
```

### Set Environment Variables
```bash
# .env.local
GROQ_API_KEY=gsk_... (from https://console.groq.com)
OLLAMA_BASE_URL=http://localhost:11434  # optional
```

### Test Groq
```bash
curl -X POST http://localhost:3000/api/ai/highlight-explain \
  -H "Content-Type: application/json" \
  -d '{
    "text": "photosynthesis",
    "action": "simplify",
    "context": "biology"
  }'
```

### Test Note Generation
```bash
curl -X POST http://localhost:3000/api/ai/generate-notes-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your lecture notes here...",
    "mode": "summary"
  }'
```

---

## ⚠️ IMPORTANT NOTES

### Rate Limits
- **Groq:** No rate limits on free tier (as of 2024)
- **Ollama:** Depends on your hardware
- **Hugging Face:** 30,000 API calls/month (free tier)

### Speed Comparison
```
Groq (remote)     → 100-500 tokens/sec
Ollama (local)    → 10-100 tokens/sec (depends on GPU)
OpenAI            → 50-200 tokens/sec (slower)
Claude            → 50-150 tokens/sec (slower)
```

### Best Practices
1. ✅ Use Groq by default (fastest free)
2. ✅ Use Ollama for offline/sensitive data
3. ✅ Implement caching for repeated requests
4. ✅ Stream long responses for better UX
5. ✅ Batch requests when possible

---

## 🎯 FUTURE FREE API OPTIONS

| API | Use Case | Free Tier | Status |
|-----|----------|-----------|--------|
| Mistral (France) | Text gen | Yes | Coming soon |
| NVIDIA NIM | Enterprise | Yes | Coming |
| LLaMA Inference API | Text gen | Yes | Available |
| Together AI | Shared | Yes | Available |
| Perplexity API | Search | Limited | Available |

---

## 📚 RESOURCES

- **Groq Console:** https://console.groq.com
- **Ollama Download:** https://ollama.ai
- **LLaMA Models:** https://huggingface.co/meta-llama
- **Hugging Face:** https://huggingface.co
- **Supabase:** https://supabase.com
- **Firebase:** https://firebase.google.com

---

## ❓ FAQ

### Q: Is Groq really free forever?
**A:** Yes, Groq's free tier is unlimited (as of 2024). No rate limits, no credit card.

### Q: What if Groq's free tier changes?
**A:** Switch to Ollama (completely offline) instantly. Same code, just different config.

### Q: Can I use both Groq and Ollama?
**A:** Yes! `FreeAIService` supports both. Groq for cloud, Ollama for offline.

### Q: How do I reduce costs further?
**A:** Use Ollama for everything - completely free, runs on your computer.

### Q: Is the quality good enough for production?
**A:** Yes! LLaMA 3.1 rivals GPT-3.5. For advanced needs, use 70B version.

---

## ✅ CHECKLIST

- [ ] Groq API key obtained
- [ ] `.env.local` configured
- [ ] `npm install` completed
- [ ] Feature tests passed
- [ ] Know backup options (Ollama)
- [ ] Ready to ship! 🚀

---

**Status: 100% FREE IMPLEMENTATION ✅**

*Last updated: February 2025*
