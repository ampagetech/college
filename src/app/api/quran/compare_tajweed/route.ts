// src/app/api/quran/compare/route.ts

import { NextRequest, NextResponse } from 'next/server';

export type LLMProvider = 'gemini' | 'openai' | 'claude';

interface CompareRequest {
  transcribedText: string;
  originalText: string;
  originalTashkeel: string;
  verseReference: string;
  llmProvider: LLMProvider;
  verseCount: number;
}

interface CompareResponse {
  score: number;
  feedback: string;
  accuracyDetails: {
    overallAccuracy: number;
    pronunciation: number;
    completeness: number;
    correctOrder: number;
  };
  mistakes: Array<{
    type: 'missing' | 'incorrect' | 'extra' | 'order';
    description: string;
  }>;
  suggestions: string[];
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json();
    const { 
      transcribedText, 
      originalText, 
      originalTashkeel, 
      verseReference, 
      llmProvider, 
      verseCount 
    } = body;

    // Validate input
    if (!transcribedText || !originalText || !verseReference || !llmProvider) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    if (!['gemini', 'openai', 'claude'].includes(llmProvider)) {
      return NextResponse.json({ 
        error: 'Invalid LLM provider' 
      }, { status: 400 });
    }

    console.log(`Comparing transcription with ${llmProvider} for ${verseReference}`);
    console.log(`Original: ${originalText.substring(0, 100)}...`);
    console.log(`Transcribed: ${transcribedText.substring(0, 100)}...`);

    let result: CompareResponse;

    // Route to appropriate LLM provider
    switch (llmProvider) {
      case 'gemini':
        result = await compareWithGemini(transcribedText, originalText, originalTashkeel, verseReference, verseCount);
        break;
      case 'openai':
        result = await compareWithOpenAI(transcribedText, originalText, originalTashkeel, verseReference, verseCount);
        break;
      case 'claude':
        result = await compareWithClaude(transcribedText, originalText, originalTashkeel, verseReference, verseCount);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }

    console.log(`Analysis complete. Score: ${result.score}%`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare recitation' },
      { status: 500 }
    );
  }
}

async function compareWithGemini(
  transcribed: string, 
  original: string, 
  originalTashkeel: string, 
  reference: string, 
  verseCount: number
): Promise<CompareResponse> {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert Quran recitation teacher. Compare the transcribed recitation with the original verses and provide detailed feedback.

**Original Verses (${reference}):**
${originalTashkeel}

**Simple Text (for comparison):**
${original}

**Student's Recitation (transcribed):**
${transcribed}

**Analysis Instructions:**
1. Compare the transcribed text with the original Arabic verses
2. Identify missing words, incorrect words, extra words, and order issues
3. Provide specific feedback on Arabic pronunciation and Tajweed
4. Give constructive suggestions for improvement
5. Rate different aspects of the recitation

**Response Format (JSON only):**
{
  "score": [overall score 0-100],
  "feedback": "[detailed feedback in English]",
  "accuracyDetails": {
    "overallAccuracy": [0-100],
    "pronunciation": [0-100],
    "completeness": [0-100],
    "correctOrder": [0-100]
  },
  "mistakes": [
    {
      "type": "missing|incorrect|extra|order",
      "description": "[specific mistake description]"
    }
  ],
  "suggestions": [
    "[specific suggestion for improvement]"
  ],
  "confidence": [0.0-1.0]
}

Provide only the JSON response, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let analysisResult: CompareResponse;
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Invalid response format from Gemini');
    }

    // Validate and ensure all required fields are present
    analysisResult = {
      score: Math.max(0, Math.min(100, analysisResult.score || 0)),
      feedback: analysisResult.feedback || 'Analysis completed.',
      accuracyDetails: {
        overallAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.overallAccuracy || 0)),
        pronunciation: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.pronunciation || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
        correctOrder: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.correctOrder || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8))
    };

    return analysisResult;

  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}

async function compareWithOpenAI(
  transcribed: string, 
  original: string, 
  originalTashkeel: string, 
  reference: string, 
  verseCount: number
): Promise<CompareResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Quran recitation teacher. Analyze recitations and provide detailed feedback in JSON format only.'
          },
          {
            role: 'user',
            content: `
Compare this Quran recitation:

Original Verses (${reference}): ${originalTashkeel}
Simple Text: ${original}
Student Recitation: ${transcribed}

Respond with JSON only:
{
  "score": [0-100],
  "feedback": "[detailed feedback]",
  "accuracyDetails": {
    "overallAccuracy": [0-100],
    "pronunciation": [0-100], 
    "completeness": [0-100],
    "correctOrder": [0-100]
  },
  "mistakes": [{"type": "missing|incorrect|extra|order", "description": "..."}],
  "suggestions": ["..."],
  "confidence": [0.0-1.0]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const analysisResult: CompareResponse = JSON.parse(jsonMatch[0]);
    
    // Validate response
    return {
      score: Math.max(0, Math.min(100, analysisResult.score || 0)),
      feedback: analysisResult.feedback || 'Analysis completed.',
      accuracyDetails: {
        overallAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.overallAccuracy || 0)),
        pronunciation: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.pronunciation || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
        correctOrder: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.correctOrder || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8))
    };

  } catch (error: any) {
    console.error('OpenAI analysis error:', error);
    throw new Error(`OpenAI analysis failed: ${error.message}`);
  }
}

async function compareWithClaude(
  transcribed: string, 
  original: string, 
  originalTashkeel: string, 
  reference: string, 
  verseCount: number
): Promise<CompareResponse> {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `
You are an expert Quran recitation teacher. Compare this recitation:

Original Verses (${reference}): ${originalTashkeel}
Simple Text: ${original}  
Student Recitation: ${transcribed}

Respond with JSON only:
{
  "score": [0-100],
  "feedback": "[detailed feedback]",
  "accuracyDetails": {
    "overallAccuracy": [0-100],
    "pronunciation": [0-100],
    "completeness": [0-100], 
    "correctOrder": [0-100]
  },
  "mistakes": [{"type": "missing|incorrect|extra|order", "description": "..."}],
  "suggestions": ["..."],
  "confidence": [0.0-1.0]
}`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const analysisResult: CompareResponse = JSON.parse(jsonMatch[0]);
    
    // Validate response
    return {
      score: Math.max(0, Math.min(100, analysisResult.score || 0)),
      feedback: analysisResult.feedback || 'Analysis completed.',
      accuracyDetails: {
        overallAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.overallAccuracy || 0)),
        pronunciation: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.pronunciation || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
        correctOrder: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.correctOrder || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8))
    };

  } catch (error: any) {
    console.error('Claude analysis error:', error);
    throw new Error(`Claude analysis failed: ${error.message}`);
  }
}