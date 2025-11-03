// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  type: 'user' | 'ai';
  content: string;
};

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  const isDebugMode = process.env.LLM_DEBUG_MODE === 'true';

  try {
    const { message, llmProvider = 'gemini', context, history = [] } = await request.json();

    // --- 🕵️‍♂️ DEBUG LOGS (UNCHANGED) ---
    if (isDebugMode) {
      console.log("\n\n================ 🕵️‍♂️ LLM DEBUG: INCOMING REQUEST ================");
      console.log(`[${new Date().toISOString()}]`);
      console.log("Provider Selected:", llmProvider);
      try {
        console.log("Full Context Received:", JSON.stringify(context, null, 2));
      } catch (e) {
        console.log("Could not stringify context. Displaying raw:", context);
      }
      console.log("Conversation History Length:", history.length);
      console.log("Latest User Message:", message);
      console.log("================================================================\n");
    }
    // --- END DEBUG LOGS ---

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build the system prompt with educational context
    const systemPrompt = buildEducationalSystemPrompt(context);
    
    // --- 📝 DEBUG LOGS (UNCHANGED) ---
    if (isDebugMode) {
      console.log("\n--- 📝 LLM DEBUG: FINAL SYSTEM PROMPT FOR AI ---");
      console.log(systemPrompt);
      console.log("------------------------------------------------\n");
    }
    // --- END DEBUG LOGS ---
    
    // Call the LLM provider with the system prompt and history
    const response = await callLLMProvider(systemPrompt, history, llmProvider, message);

    // --- 🤖 DEBUG LOGS (UNCHANGED) ---
    if (isDebugMode) {
      console.log("\n--- 🤖 LLM DEBUG: RAW RESPONSE FROM PROVIDER ---");
      console.log(response);
      console.log("-----------------------------------------------\n");
    }
    // --- END DEBUG LOGS ---
    
    return NextResponse.json({ response });

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- UPDATED: More direct and focused system prompt ---
function buildEducationalSystemPrompt(context: any) {
    const { question, userAnswer, session } = context || {};
    const subject = session?.subject?.subject_name;
    const examType = session?.exam?.exam_name;
    
    const cleanText = (html: string | null | undefined): string => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    };
  
    const questionText = cleanText(question?.question_html);
    const optionA = cleanText(question?.question_option_a_as_html);
    const optionB = cleanText(question?.question_option_b_as_html);
    const optionC = cleanText(question?.question_option_c_as_html);
    const optionD = cleanText(question?.question_option_d_as_html);
    const correctAnswerLetter = question?.answer_a_b_c_d_e_option || 'Unknown';
    const selectedAnswerLetter = userAnswer?.selected_answer || 'Not answered';
    const isCorrect = userAnswer?.is_correct;
    const explanation = cleanText(question?.answer_explanation_html) || 'No explanation available';
  
    const getOptionText = (letter: string) => {
      if (letter === 'A') return optionA;
      if (letter === 'B') return optionB;
      if (letter === 'C') return optionC;
      if (letter === 'D') return optionD;
      return '';
    };
  
    return `You are an expert ${subject} tutor helping a student with ${examType} exam preparation.

CURRENT QUESTION CONTEXT:
Question: "${questionText}"
A: "${optionA}"
B: "${optionB}" 
C: "${optionC}"
D: "${optionD}"

Student chose: ${selectedAnswerLetter} ("${getOptionText(selectedAnswerLetter)}")
Correct answer: ${correctAnswerLetter} ("${getOptionText(correctAnswerLetter)}")
Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}
${explanation !== 'No explanation available' ? `Official explanation: "${explanation}"` : ''}

INSTRUCTIONS:
- Answer questions directly and concisely about this topic or ${subject} in general
- If the student got it wrong, explain why their choice was incorrect and why the correct answer is right
- Use simple, clear language appropriate for ${examType} level
- Don't start with pleasantries - get straight to the explanation
- Ask follow-up questions to check understanding when appropriate
- Stay focused on ${subject} concepts and this question's topic`;
}

// --- FIXED: Proper LLM provider calling with error handling ---
async function callLLMProvider(systemPrompt: string, history: Message[], provider: string, currentMessage: string) {
  const isDebugMode = process.env.LLM_DEBUG_MODE === 'true';
  
  try {
    // Add the current message to history for the API call
    const fullHistory = [...history, { type: 'user' as const, content: currentMessage }];
    
    if (isDebugMode) {
      console.log(`\n--- 📞 Attempting to call ${provider} ---`);
      console.log("Full history length:", fullHistory.length);
    }

    switch (provider) {
      case 'gemini':
        if (genAI && GEMINI_API_KEY) {
          return await callGemini(systemPrompt, fullHistory);
        }
        console.warn('Gemini API key not found, trying fallback');
        break;
      case 'claude':
        if (process.env.ANTHROPIC_API_KEY) {
          return await callAnthropic(systemPrompt, fullHistory);
        }
        console.warn('Anthropic API key not found, trying fallback');
        break;
      case 'chatgpt':
        if (process.env.OPENAI_API_KEY) {
          return await callOpenAI(systemPrompt, fullHistory);
        }
        console.warn('OpenAI API key not found, trying fallback');
        break;
    }
    
    // Try fallback providers
    if (genAI && GEMINI_API_KEY) {
      console.log('Using Gemini as fallback');
      return await callGemini(systemPrompt, fullHistory);
    }
    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI as fallback');
      return await callOpenAI(systemPrompt, fullHistory);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Anthropic as fallback');
      return await callAnthropic(systemPrompt, fullHistory);
    }
    
    throw new Error('No LLM providers available');

  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    // Return a more educational fallback
    return generateEducationalFallback(currentMessage, { question: null, userAnswer: null });
  }
}

// --- FIXED: Gemini implementation using updated API ---
async function callGemini(systemPrompt: string, history: Message[]) {
  try {
    if (!genAI) {
      throw new Error("Gemini API not initialized");
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    // Convert history to Gemini format
    const geminiHistory = history.slice(0, -1).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const currentUserMessage = history[history.length - 1];
    if (!currentUserMessage || currentUserMessage.type !== 'user') {
      throw new Error("No current user message found");
    }

    // Use generateContent with system instruction in contents array
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...geminiHistory,
        { role: "user", parts: [{ text: currentUserMessage.content }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = result.response.text();
    if (!text) throw new Error("Empty response from Gemini");

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// --- FIXED: OpenAI implementation ---
async function callOpenAI(systemPrompt: string, history: Message[]) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        model: 'gpt-3.5-turbo', 
        messages, 
        max_tokens: 800, 
        temperature: 0.7 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// --- FIXED: Anthropic implementation ---
async function callAnthropic(systemPrompt: string, history: Message[]) {
  try {
    const messages = history.map(msg => ({
      role: msg.type === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'x-api-key': process.env.ANTHROPIC_API_KEY!, 
        'Content-Type': 'application/json', 
        'anthropic-version': '2023-06-01' 
      },
      body: JSON.stringify({ 
        model: 'claude-3-sonnet-20240229', 
        max_tokens: 800, 
        system: systemPrompt, 
        messages 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.content[0]?.text || 'I apologize, but I couldn\'t generate a response.';
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw error;
  }
}

// --- IMPROVED: Better educational fallback ---
function generateEducationalFallback(userMessage: string, context: any) {
  const { question, userAnswer } = context;
  const correctAnswer = question?.answer_a_b_c_d_e_option;
  const selectedAnswer = userAnswer?.selected_answer;
  const isCorrect = userAnswer?.is_correct;

  if (isCorrect === false && correctAnswer && selectedAnswer) {
    return `I can see why you chose option ${selectedAnswer}, but the correct answer is ${correctAnswer}. Let me explain the key difference between these options. What specific part of this topic would you like me to clarify?`;
  } else if (isCorrect === true) {
    return `Excellent! You correctly chose option ${correctAnswer}. Do you want me to explain why the other options were incorrect?`;
  } else {
    return `I understand you have a question about this topic. Let me help you work through it step by step.`;
  }
}