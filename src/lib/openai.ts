// src/lib/openai.ts

import OpenAI from 'openai';

// This checks if the API key is provided, preventing errors.
if (!process.env.OPENAI_API_KEY) {
  console.warn("OpenAI API key is not configured. OpenAI features will be unavailable.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});