// src/app/api/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported audio formats
const SUPPORTED_FORMATS = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/m4a', 'audio/ogg'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const model = (formData.get('model') as 'openai' | 'gemini') || 'gemini';
    const language = (formData.get('language') as string) || 'en';
    
    // NEW: Optional context parameter for specialized transcription
    const context = (formData.get('context') as string) || '';
    const verseReference = (formData.get('verseReference') as string) || '';

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
      console.warn(`Unsupported audio format: ${audioFile.type}, but proceeding...`);
    }

    console.log(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}, using model: ${model}, language: ${language}, context: ${context}`);

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    let transcriptionText = '';
    let usedModel = model;
    let confidence = 1.0;

    if (model === 'openai') {
      console.log('Using OpenAI Whisper for transcription...');
      const result = await transcribeWithOpenAI(audioBlob, language, context, verseReference);
      transcriptionText = result.text;
      confidence = result.confidence;
    } else {
      try {
        console.log('Using Gemini for transcription...');
        const result = await transcribeWithGemini(audioBlob, language, context, verseReference);
        transcriptionText = result.text;
        confidence = result.confidence;
      } catch (geminiError: any) {
        console.error('Gemini transcription failed:', geminiError.message);
        
        // Fallback to OpenAI if available
        if (process.env.OPENAI_API_KEY) {
          console.log('Falling back to OpenAI Whisper...');
          usedModel = 'openai';
          const result = await transcribeWithOpenAI(audioBlob, language, context, verseReference);
          transcriptionText = result.text;
          confidence = result.confidence;
        } else {
          throw new Error('Transcription failed and no fallback available. Please try again or check your audio quality.');
        }
      }
    }

    // Validate transcription result
    const cleanedText = transcriptionText.trim();
    if (!cleanedText) {
      return NextResponse.json({ 
        error: 'No speech detected in the audio. Please speak more clearly and try again.' 
      }, { status: 400 });
    }

    // Check for very short transcriptions (might indicate poor audio quality)
    if (cleanedText.length < 3) {
      return NextResponse.json({ 
        error: 'Transcription too short. Please speak more clearly or for a longer duration.' 
      }, { status: 400 });
    }

    console.log(`Transcription successful: "${cleanedText}" (confidence: ${confidence}, model: ${usedModel})`);

    return NextResponse.json({
      text: cleanedText,
      model: usedModel,
      confidence: confidence,
      audioInfo: {
        size: audioFile.size,
        type: audioFile.type,
        duration: audioFile.size / (16000 * 2) // Rough estimate for 16kHz 16-bit audio
      }
    });

  } catch (error: any) {
    console.error('Transcription API Error:', error);
    
    let errorMessage = 'Transcription failed. Please try again.';
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error occurred. Please check your connection and try again.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      errorMessage = 'Service temporarily unavailable due to high demand. Please try again in a moment.';
    } else if (error.message?.includes('audio') || error.message?.includes('format')) {
      errorMessage = 'Audio format not supported or corrupted. Please try recording again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Enhanced Gemini Transcription Function with context awareness
async function transcribeWithGemini(
  audioBlob: Blob, 
  language: string = 'en', 
  context: string = '', 
  verseReference: string = ''
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
  
  // Build context-aware prompt
  let prompt = `Transcribe this audio file accurately. Return only the spoken text, nothing else. If no clear speech is detected, return 'NO_SPEECH_DETECTED'.`;
  
  if (context === 'quran') {
    prompt = `Transcribe this Arabic Quran recitation accurately. This is a recitation of Quranic verses in Classical Arabic. Pay special attention to:
- Arabic diacritical marks (Tashkeel)
- Proper pronunciation of Arabic letters
- Classical Arabic grammar and vocabulary
- Quranic terminology and phrases
${verseReference ? `- This should be from verse reference: ${verseReference}` : ''}

Return only the Arabic text as spoken, nothing else. If no clear Arabic speech is detected, return 'NO_SPEECH_DETECTED'.`;
  } else if (language === 'ar') {
    prompt = `Transcribe this Arabic audio accurately. Pay attention to proper Arabic grammar, vocabulary, and diacritical marks. Return only the spoken Arabic text, nothing else. If no clear speech is detected, return 'NO_SPEECH_DETECTED'.`;
  } else if (language !== 'en') {
    prompt = `Transcribe this audio file accurately in ${language}. Return only the spoken text in the original language, nothing else. If no clear speech is detected, return 'NO_SPEECH_DETECTED'.`;
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini transcription attempt ${attempt}/${maxRetries}${context ? ` (context: ${context})` : ''}`);
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, audioPart] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000
        }
      });

      const text = result.response.text().trim();
      
      if (text === 'NO_SPEECH_DETECTED' || !text) {
        throw new Error('No clear speech detected in the audio');
      }

      // Higher confidence for specialized contexts
      let confidence = 0.8;
      if (context === 'quran' && text.length > 10) {
        confidence = 0.95;
      } else if (text.length > 10) {
        confidence = 0.9;
      } else {
        confidence = 0.7;
      }
      
      return { text, confidence };
      
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini attempt ${attempt} failed:`, error.message);
      
      // Check for specific error types
      if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        throw new Error('Invalid audio format or corrupted file. Please try recording again.');
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw new Error(`Gemini transcription failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

// Enhanced OpenAI Transcription Function with context awareness
async function transcribeWithOpenAI(
  audioBlob: Blob, 
  language: string = 'en', 
  context: string = '', 
  verseReference: string = ''
): Promise<{ text: string; confidence: number }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Get confidence scores
    formData.append('language', language === 'ar' ? 'ar' : language);
    
    // Add context-specific prompts for better accuracy
    if (context === 'quran') {
      formData.append('prompt', 'This is a recitation of Quranic verses in Classical Arabic. Include proper Arabic diacritical marks and Classical Arabic vocabulary.');
    } else if (language === 'ar') {
      formData.append('prompt', 'This is Arabic speech. Please include proper Arabic diacritical marks.');
    }

    console.log(`Sending request to OpenAI Whisper API...${context ? ` (context: ${context})` : ''}`);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 400) {
        throw new Error('Invalid audio file. Please try recording again with better audio quality.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API authentication failed.');
      } else {
        throw new Error(`OpenAI Whisper API error: ${response.statusText}`);
      }
    }

    const result = await response.json();
    
    if (!result.text?.trim()) {
      throw new Error('No speech detected in the audio file');
    }

    // Extract confidence from segments if available
    let confidence = 0.8; // Default confidence
    if (result.segments && result.segments.length > 0) {
      const avgConfidence = result.segments.reduce((sum: number, segment: any) => 
        sum + (segment.avg_logprob || 0), 0) / result.segments.length;
      confidence = Math.max(0.1, Math.min(1.0, (avgConfidence + 5) / 5)); // Normalize logprob to 0-1
    }

    // Higher confidence for specialized contexts
    if (context === 'quran' && result.text.trim().length > 10) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    return { 
      text: result.text.trim(), 
      confidence 
    };
    
  } catch (error: any) {
    if (error.message?.includes('fetch')) {
      throw new Error('Network error occurred while contacting transcription service');
    }
    throw error;
  }
}