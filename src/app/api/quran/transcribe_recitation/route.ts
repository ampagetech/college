// src/app/api/quran/transcribe_recitation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Maximum file size (15MB for longer recitations)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Supported audio formats
const SUPPORTED_FORMATS = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/m4a', 'audio/ogg'];

export type TranscriptionModel = 'openai' | 'gemini';

interface TranscribeRequest {
  audio: File;
  model?: TranscriptionModel;
  verseReference?: string;
  expectedText?: string; // Optional: the actual verse text for context
}

interface TranscribeResponse {
  text: string;
  model: TranscriptionModel;
  confidence: number;
  audioInfo: {
    size: number;
    type: string;
    estimatedDuration: number;
  };
  processingTime: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const model = (formData.get('model') as TranscriptionModel) || 'gemini';
    const verseReference = (formData.get('verseReference') as string) || '';
    const expectedText = (formData.get('expectedText') as string) || '';

    // Validate audio file
    if (!audioFile) {
      return NextResponse.json({ 
        error: 'Audio file is required' 
      }, { status: 400 });
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Audio file too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Check file format
    if (!SUPPORTED_FORMATS.includes(audioFile.type)) {
      console.warn(`Unsupported audio format: ${audioFile.type}, proceeding with caution...`);
    }

    console.log(`[QURAN TRANSCRIBE] Processing: ${audioFile.name}, size: ${audioFile.size} bytes, model: ${model}, verse: ${verseReference}`);

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    let transcriptionText = '';
    let usedModel = model;
    let confidence = 1.0;

    if (model === 'openai') {
      console.log('[QURAN TRANSCRIBE] Using OpenAI Whisper for Arabic Quran transcription...');
      const result = await transcribeQuranWithOpenAI(audioBlob, verseReference, expectedText);
      transcriptionText = result.text;
      confidence = result.confidence;
    } else {
      try {
        console.log('[QURAN TRANSCRIBE] Using Gemini for Arabic Quran transcription...');
        const result = await transcribeQuranWithGemini(audioBlob, verseReference, expectedText);
        transcriptionText = result.text;
        confidence = result.confidence;
      } catch (geminiError: any) {
        console.error('[QURAN TRANSCRIBE] Gemini failed:', geminiError.message);
        
        // Fallback to OpenAI if available
        if (process.env.OPENAI_API_KEY) {
          console.log('[QURAN TRANSCRIBE] Falling back to OpenAI Whisper...');
          usedModel = 'openai';
          const result = await transcribeQuranWithOpenAI(audioBlob, verseReference, expectedText);
          transcriptionText = result.text;
          confidence = result.confidence;
        } else {
          throw new Error('Quran transcription failed and no fallback available. Please check your recitation audio quality.');
        }
      }
    }

    // Validate transcription result
    const cleanedText = transcriptionText.trim();
    if (!cleanedText) {
      return NextResponse.json({ 
        error: 'No Arabic speech detected. Please recite the verses clearly in Arabic.' 
      }, { status: 400 });
    }

    // Check for very short transcriptions
    if (cleanedText.length < 5) {
      return NextResponse.json({ 
        error: 'Recitation too short. Please recite the complete verses clearly.' 
      }, { status: 400 });
    }

    const processingTime = Date.now() - startTime;

    console.log(`[QURAN TRANSCRIBE] Success: "${cleanedText.substring(0, 100)}..." (confidence: ${confidence}, time: ${processingTime}ms)`);

    const response: TranscribeResponse = {
      text: cleanedText,
      model: usedModel,
      confidence: confidence,
      audioInfo: {
        size: audioFile.size,
        type: audioFile.type,
        estimatedDuration: audioFile.size / (16000 * 2) // Rough estimate
      },
      processingTime
    };

    return NextResponse.json(response);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[QURAN TRANSCRIBE] Error:', error);
    
    let errorMessage = 'Quran transcription failed. Please try again with clearer recitation.';
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
    } else if (error.message?.includes('audio') || error.message?.includes('format')) {
      errorMessage = 'Audio format issue. Please record your recitation again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime
      },
      { status: 500 }
    );
  }
}

// Specialized Gemini function for Quran recitation transcription
async function transcribeQuranWithGemini(
  audioBlob: Blob, 
  verseReference: string = '', 
  expectedText: string = ''
): Promise<{ text: string; confidence: number }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const audioBase64 = Buffer.from(await audioBlob.arrayBuffer()).toString('base64');
  const audioPart = { 
    inlineData: { 
      mimeType: audioBlob.type || 'audio/wav', 
      data: audioBase64 
    } 
  };
  
  // Specialized prompt for Quran recitation
  let prompt = `CRITICAL: You are transcribing a QURAN RECITATION in Classical Arabic. This is extremely important - you must transcribe ONLY what is actually spoken, nothing more, nothing less.

**STRICT INSTRUCTIONS:**
1. This is Arabic Quran recitation in Classical Arabic
2. Transcribe ONLY the words that are actually spoken - do not add missing words
3. Do not complete verses if the reciter stops mid-verse
4. Do not fill in gaps or assume what should be there
5. If the reciter skips words or verses, your transcription should reflect that
6. Focus on accuracy of what was actually recited, not what should be recited
7. Include proper Arabic text with diacritical marks where clearly pronounced
8. If no clear Arabic speech is detected, return 'NO_ARABIC_SPEECH'

${verseReference ? `**Context**: This should be a recitation from ${verseReference}` : ''}
${expectedText ? `**Reference text**: ${expectedText}\n(But transcribe only what is actually spoken, not what the reference shows)` : ''}

**Your task**: Transcribe exactly what was recited in Arabic, word for word, nothing added or assumed.`;

  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GEMINI QURAN] Attempt ${attempt}/${maxRetries}${verseReference ? ` for ${verseReference}` : ''}`);
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, audioPart] }],
        generationConfig: {
          temperature: 0.05, // Very low temperature for accuracy
          maxOutputTokens: 2000,
          topP: 0.1, // More focused responses
        }
      });

      const text = result.response.text().trim();
      
      if (text === 'NO_ARABIC_SPEECH' || !text) {
        throw new Error('No clear Arabic recitation detected in the audio');
      }

      // Remove any non-Arabic explanatory text that might have been added
      const arabicText = extractArabicText(text);
      
      if (!arabicText) {
        throw new Error('No Arabic text found in transcription');
      }

      // Confidence based on length and context
      let confidence = 0.85;
      if (arabicText.length > 20) {
        confidence = 0.92;
      }
      if (expectedText && arabicText.length > expectedText.length * 0.7) {
        confidence = Math.min(confidence + 0.05, 0.95);
      }
      
      return { text: arabicText, confidence };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[GEMINI QURAN] Attempt ${attempt} failed:`, error.message);
      
      if (error.message?.includes('503')) {
        if (attempt < maxRetries) {
          const delay = 2000 * attempt;
          console.log(`[GEMINI QURAN] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Gemini Quran transcription failed: ${lastError?.message || 'Unknown error'}`);
}

// Specialized OpenAI function for Quran recitation transcription
async function transcribeQuranWithOpenAI(
  audioBlob: Blob, 
  verseReference: string = '', 
  expectedText: string = ''
): Promise<{ text: string; confidence: number }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'quran_recitation.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'ar'); // Arabic
    formData.append('temperature', '0.0'); // Most conservative transcription
    
    // Specialized prompt for Quran recitation
    let promptText = `This is a Quran recitation in Classical Arabic. Transcribe ONLY what is actually spoken - do not add missing words or complete incomplete verses. Focus on accuracy of the actual recitation.`;
    
    if (verseReference) {
      promptText += ` This should be from ${verseReference}.`;
    }
    
    formData.append('prompt', promptText);

    console.log(`[WHISPER QURAN] Sending to OpenAI${verseReference ? ` for ${verseReference}` : ''}...`);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WHISPER QURAN] API error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 400) {
        throw new Error('Invalid audio file. Please record your recitation again.');
      } else {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }
    }

    const result = await response.json();
    
    if (!result.text?.trim()) {
      throw new Error('No Arabic recitation detected in the audio file');
    }

    // Extract Arabic text and clean it
    const arabicText = extractArabicText(result.text.trim());
    
    if (!arabicText) {
      throw new Error('No Arabic text found in transcription');
    }

    // Calculate confidence from segments
    let confidence = 0.8;
    if (result.segments && result.segments.length > 0) {
      const avgConfidence = result.segments.reduce((sum: number, segment: any) => 
        sum + Math.exp(segment.avg_logprob || -1), 0) / result.segments.length;
      confidence = Math.max(0.7, Math.min(0.95, avgConfidence));
    }

    return { 
      text: arabicText, 
      confidence 
    };
    
  } catch (error: any) {
    console.error('[WHISPER QURAN] Error:', error);
    if (error.message?.includes('fetch')) {
      throw new Error('Network error occurred while transcribing recitation');
    }
    throw error;
  }
}

// Helper function to extract Arabic text from potentially mixed content
function extractArabicText(text: string): string {
  if (!text) return '';
  
  // Remove any explanatory text in English or other languages
  const lines = text.split('\n');
  let arabicLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line contains Arabic characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(trimmed);
    
    if (hasArabic) {
      // Remove any non-Arabic characters except spaces and common punctuation
      const cleanArabic = trimmed
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanArabic.length > 0) {
        arabicLines.push(cleanArabic);
      }
    }
  }
  
  return arabicLines.join(' ').trim();
}