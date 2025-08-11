import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMContext {
  systemPrompt?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
  userProfile?: any;
}

export async function* streamLLM(
  prompt: string, 
  context: LLMContext = {}
): AsyncGenerator<string, void, unknown> {
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    
    // Add system prompt
    if (context.systemPrompt) {
      messages.push({
        role: "system",
        content: context.systemPrompt
      });
    } else {
      // Default system prompt for real estate AI
      messages.push({
        role: "system",
        content: `You are Bayti, a professional AI assistant specializing in real estate. You help with property inquiries, market information, and scheduling appointments. Keep responses conversational, helpful, and concise. When appropriate, offer to schedule a callback or meeting.`
      });
    }

    // Add conversation history
    if (context.conversationHistory) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current prompt
    messages.push({
      role: "user",
      content: prompt
    });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use the latest model
      messages,
      stream: true,
      max_tokens: 300, // Keep responses concise for voice
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error in streamLLM:", error);
    throw new Error(`OpenAI streaming error: ${error}`);
  }
}

export function createRealtimeContext(): LLMContext {
  return {
    systemPrompt: `You are Bayti, a professional AI calling assistant for real estate. You're having a real-time voice conversation with a potential client.

Guidelines:
- Keep responses conversational and natural for voice interaction
- Responses should be 1-3 sentences maximum 
- Ask follow-up questions to gather lead information
- Offer to schedule appointments or callbacks when appropriate
- Be helpful with property questions and market information
- If you don't understand something, politely ask for clarification
- Use a friendly, professional tone suitable for real estate

Current conversation context: This is a live voice call where you can be interrupted.`,
    conversationHistory: [],
    userProfile: null
  };
}

// Helper to split text into TTS-friendly chunks at natural breakpoints
export function splitTextForTTS(text: string): string[] {
  // Split on sentence boundaries and clause markers
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if (sentence.length <= 100) {
      chunks.push(sentence.trim());
    } else {
      // Split long sentences on commas, semicolons, etc.
      const subChunks = sentence.split(/(?<=[,;:])\s+/);
      for (const chunk of subChunks) {
        if (chunk.trim()) {
          chunks.push(chunk.trim());
        }
      }
    }
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}