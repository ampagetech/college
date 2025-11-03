// src/app/api/quran/compare_memorization/route.ts

import { NextRequest, NextResponse } from 'next/server';

export type LLMProvider = 'gemini' | 'openai' | 'claude';

interface CompareRequest {
  transcribedText: string; // Will be cleaned of diacritics for fair comparison
  originalText: string; // This should be text_simple (no diacritics)
  verseReference: string;
  llmProvider: LLMProvider;
  verseCount: number;
}

interface CompareResponse {
  score: number;
  feedback: string;
  accuracyDetails: {
    wordAccuracy: number;
    sequenceAccuracy: number;
    completeness: number;
  };
  mistakes: Array<{
    type: 'missing_word' | 'wrong_word' | 'extra_word' | 'wrong_sequence' | 'skipped_verse';
    description: string;
    position?: number;
  }>;
  suggestions: string[];
  confidence: number;
  wordStats: {
    totalWords: number;
    correctWords: number;
    missedWords: number;
    extraWords: number;
  };
}

// Helper function to clean Arabic text for memorization comparison
function cleanArabicForMemorization(text: string): string {
  if (!text) return '';
  
  return text
    // Remove any remaining diacritics (just in case)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    // Remove verse numbers in Arabic and English
    .replace(/[٠-٩]+/g, '')
    .replace(/[0-9]+/g, '')
    // Normalize different forms of letters that might appear differently
    .replace(/[آأإا]/g, 'ا')  // Normalize Alif forms
    .replace(/[ىي]/g, 'ي')    // Normalize Ya forms
    .replace(/[ةه]/g, 'ة')    // Normalize Ta Marbuta
    // Remove extra spaces and normalize
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to extract words for comparison
function extractWordsForComparison(text: string): string[] {
  const cleaned = cleanArabicForMemorization(text);
  return cleaned.split(/\s+/).filter(word => word.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json();
    const { 
      transcribedText, 
      originalText, // Should be text_simple from JSON
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

    console.log(`Comparing memorization with ${llmProvider} for ${verseReference}`);
    
    // Clean BOTH texts for fair comparison (remove ALL diacritics)
    const cleanedOriginal = cleanArabicForMemorization(originalText); // text_simple should already be clean
    const cleanedTranscribed = cleanArabicForMemorization(transcribedText); // remove any diacritics from speech-to-text
    const originalWords = extractWordsForComparison(originalText);
    const transcribedWords = extractWordsForComparison(transcribedText);

    console.log(`Original text: ${originalText.substring(0, 100)}...`);
    console.log(`Transcribed text: ${transcribedText.substring(0, 100)}...`);
    console.log(`Original (cleaned): ${cleanedOriginal}`);
    console.log(`Transcribed (cleaned): ${cleanedTranscribed}`);
    console.log(`Original words: ${originalWords.length} - [${originalWords.join(', ')}]`);
    console.log(`Transcribed words: ${transcribedWords.length} - [${transcribedWords.join(', ')}]`);

    let result: CompareResponse;

    // Route to appropriate LLM provider
    switch (llmProvider) {
      case 'gemini':
        result = await compareWithGemini(
          cleanedTranscribed,
          cleanedOriginal,
          originalWords,
          transcribedWords,
          verseReference, 
          verseCount
        );
        break;
      case 'openai':
        result = await compareWithOpenAI(
          cleanedTranscribed,
          cleanedOriginal,
          originalWords,
          transcribedWords,
          verseReference, 
          verseCount
        );
        break;
      case 'claude':
        result = await compareWithClaude(
          cleanedTranscribed,
          cleanedOriginal,
          originalWords,
          transcribedWords,
          verseReference, 
          verseCount
        );
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }

    console.log(`Memorization analysis complete. Score: ${result.score}%`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Memorization Compare API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare memorization' },
      { status: 500 }
    );
  }
}

async function compareWithGemini(
  cleanedTranscribed: string,
  cleanedOriginal: string,
  originalWords: string[],
  transcribedWords: string[],
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
You are analyzing Quran memorization accuracy. Compare ONLY the words and their sequence - NO diacritics, NO pronunciation analysis.

**IMPORTANT:** Both texts have been cleaned of ALL diacritics for fair comparison.

**MEMORIZATION COMPARISON DATA:**
Original verses (${reference}) - cleaned: "${cleanedOriginal}"
Student recitation - cleaned: "${cleanedTranscribed}"

Original words (${originalWords.length}): [${originalWords.join(', ')}]
Student words (${transcribedWords.length}): [${transcribedWords.join(', ')}]

**CRITICAL INSTRUCTIONS:**
1. Both texts are now diacritic-free - focus ONLY on word-for-word accuracy
2. Check if student recited all required words in correct order
3. Only flag ACTUAL missing words, wrong words, or sequence errors
4. If word arrays are nearly identical, score should be very high (95-100%)
5. Be very precise - both texts have been normalized for fair comparison

**ANALYSIS FOCUS:**
- Word accuracy: Are the right words present?
- Sequence: Are words in correct order?
- Completeness: Are any words actually missing?

**Response Format (JSON only):**
{
  "score": [overall memorization score 0-100],
  "feedback": "[brief, accurate feedback on actual differences only]",
  "accuracyDetails": {
    "wordAccuracy": [percentage of correct words 0-100],
    "sequenceAccuracy": [correct word order percentage 0-100],
    "completeness": [percentage of words actually present 0-100]
  },
  "mistakes": [
    {
      "type": "missing_word|wrong_word|extra_word|wrong_sequence|skipped_verse",
      "description": "[specific mistake - only if truly present]",
      "position": [word position if applicable]
    }
  ],
  "suggestions": [
    "[suggestion only if actual mistakes found]"
  ],
  "confidence": [0.0-1.0],
  "wordStats": {
    "totalWords": ${originalWords.length},
    "correctWords": [count of correctly placed words],
    "missedWords": [count of actually missing words],
    "extraWords": [count of extra words added]
  }
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
      feedback: analysisResult.feedback || 'Memorization analysis completed.',
      accuracyDetails: {
        wordAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.wordAccuracy || 0)),
        sequenceAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.sequenceAccuracy || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8)),
      wordStats: {
        totalWords: originalWords.length,
        correctWords: analysisResult.wordStats?.correctWords || 0,
        missedWords: analysisResult.wordStats?.missedWords || 0,
        extraWords: analysisResult.wordStats?.extraWords || 0,
      }
    };

    return analysisResult;

  } catch (error: any) {
    console.error('Gemini memorization analysis error:', error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}

async function compareWithOpenAI(
  cleanedTranscribed: string,
  cleanedOriginal: string,
  originalWords: string[],
  transcribedWords: string[],
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
            content: 'You are analyzing Quran memorization accuracy. Focus ONLY on word accuracy and sequence - NO diacritics, NO pronunciation. Be precise and accurate in your comparison.'
          },
          {
            role: 'user',
            content: `
Analyze memorization accuracy for ${reference}:

Original (cleaned, no diacritics): "${cleanedOriginal}"
Student (cleaned, no diacritics): "${cleanedTranscribed}"

Original words [${originalWords.length}]: [${originalWords.join(', ')}]
Student words [${transcribedWords.length}]: [${transcribedWords.join(', ')}]

Both texts cleaned of diacritics. Compare word-for-word. If arrays are nearly identical, score should be 95-100%.

JSON response only:
{
  "score": [0-100],
  "feedback": "[accurate feedback on actual differences only]",
  "accuracyDetails": {
    "wordAccuracy": [0-100],
    "sequenceAccuracy": [0-100], 
    "completeness": [0-100]
  },
  "mistakes": [{"type": "missing_word|wrong_word|extra_word|wrong_sequence|skipped_verse", "description": "...", "position": 0}],
  "suggestions": ["..."],
  "confidence": [0.0-1.0],
  "wordStats": {
    "totalWords": ${originalWords.length},
    "correctWords": 0,
    "missedWords": 0,
    "extraWords": 0
  }
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1200
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
      feedback: analysisResult.feedback || 'Memorization analysis completed.',
      accuracyDetails: {
        wordAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.wordAccuracy || 0)),
        sequenceAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.sequenceAccuracy || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8)),
      wordStats: {
        totalWords: originalWords.length,
        correctWords: analysisResult.wordStats?.correctWords || 0,
        missedWords: analysisResult.wordStats?.missedWords || 0,
        extraWords: analysisResult.wordStats?.extraWords || 0,
      }
    };

  } catch (error: any) {
    console.error('OpenAI memorization analysis error:', error);
    throw new Error(`OpenAI analysis failed: ${error.message}`);
  }
}

async function compareWithClaude(
  cleanedTranscribed: string,
  cleanedOriginal: string,
  originalWords: string[],
  transcribedWords: string[],
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
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: `
Analyze Quran memorization for ${reference} - word accuracy only, NO diacritics, NO pronunciation.

Original (cleaned): "${cleanedOriginal}"
Student (cleaned): "${cleanedTranscribed}"

Words comparison - both cleaned of diacritics:
Original [${originalWords.length}]: [${originalWords.join(', ')}]
Student [${transcribedWords.length}]: [${transcribedWords.join(', ')}]

Both texts normalized. If word arrays match closely, score 95-100%. Only flag actual word differences.

JSON only:
{
  "score": [0-100],
  "feedback": "[accurate feedback on real differences only]",
  "accuracyDetails": {
    "wordAccuracy": [0-100],
    "sequenceAccuracy": [0-100],
    "completeness": [0-100]
  },
  "mistakes": [{"type": "missing_word|wrong_word|extra_word|wrong_sequence|skipped_verse", "description": "...", "position": 0}],
  "suggestions": ["..."],
  "confidence": [0.0-1.0],
  "wordStats": {
    "totalWords": ${originalWords.length},
    "correctWords": 0,
    "missedWords": 0,
    "extraWords": 0
  }
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
      feedback: analysisResult.feedback || 'Memorization analysis completed.',
      accuracyDetails: {
        wordAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.wordAccuracy || 0)),
        sequenceAccuracy: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.sequenceAccuracy || 0)),
        completeness: Math.max(0, Math.min(100, analysisResult.accuracyDetails?.completeness || 0)),
      },
      mistakes: Array.isArray(analysisResult.mistakes) ? analysisResult.mistakes : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8)),
      wordStats: {
        totalWords: originalWords.length,
        correctWords: analysisResult.wordStats?.correctWords || 0,
        missedWords: analysisResult.wordStats?.missedWords || 0,
        extraWords: analysisResult.wordStats?.extraWords || 0,
      }
    };

  } catch (error: any) {
    console.error('Claude memorization analysis error:', error);
    throw new Error(`Claude analysis failed: ${error.message}`);
  }
}