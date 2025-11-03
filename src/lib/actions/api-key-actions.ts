// src/lib/actions/api-key-actions.ts
'use server';

export async function getGeminiApiKey(): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return null;
    }
    
    return apiKey;
  } catch (error) {
    console.error('Error getting Gemini API key:', error);
    return null;
  }
}

export async function validateApiKey(): Promise<boolean> {
  const apiKey = await getGeminiApiKey();
  return apiKey !== null && apiKey.length > 0;
}