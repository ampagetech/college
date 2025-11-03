import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RequestBody {
  prompt: string;
  topic: string;
  subject: string;
}

interface ApiResponse {
  text: string;
}

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { prompt, topic, subject } = await request.json() as RequestBody;

    console.log("📨 Request:", { topic, subject, promptLength: prompt?.length });

    if (!isValidPrompt(prompt, topic, subject)) {
      return NextResponse.json(
        { error: "Prompt must be related to the selected subject and topic" },
        { status: 400 }
      );
    }

    let response: ApiResponse;

    // Try Gemini first
    if (genAI && GEMINI_API_KEY) {
      try {
        console.log("🔵 Trying Gemini 2.5 Flash...");
        response = await handleGemini(prompt, topic, subject);
        console.log("✅ Gemini success!");
      } catch (geminiError) {
        console.error("❌ Gemini failed:", (geminiError as Error).message);
        
        // Fallback to Groq
        if (GROQ_API_KEY) {
          console.log("🟢 Falling back to Groq...");
          response = await handleGroq(prompt, topic, subject);
          console.log("✅ Groq success!");
        } else {
          throw geminiError;
        }
      }
    } else if (GROQ_API_KEY) {
      console.log("🟢 Using Groq...");
      response = await handleGroq(prompt, topic, subject);
      console.log("✅ Groq success!");
    } else {
      return NextResponse.json(
        { error: "No API keys configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: formatResponse(response.text) });
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate response" },
      { status: 500 }
    );
  }
}

async function handleGemini(
  prompt: string,
  topic: string,
  subject: string
): Promise<ApiResponse> {
  const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `You are a teaching assistant for ${subject}. Provide detailed explanations about ${topic}.`;

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini");

  return { text };
}

async function handleGroq(
  prompt: string,
  topic: string,
  subject: string
): Promise<ApiResponse> {
  const systemPrompt = `You are a teaching assistant for ${subject}. Provide detailed explanations about ${topic}.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API error ${response.status}`);
  }

  const data = await response.json();
  return { text: data.choices[0].message.content };
}

function isValidPrompt(prompt: string, topic: string, subject: string): boolean {
  if (!prompt || !topic || !subject) return false;
  const lowerPrompt = prompt.toLowerCase();
  return lowerPrompt.includes(topic.toLowerCase()) || lowerPrompt.includes(subject.toLowerCase());
}

function formatResponse(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([.!?])\s*(\w)/g, "$1 $2")
    .replace(/[•*-]\s/g, "- ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}