import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get API key from request headers
    const apiKey = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Get request body
    const requestBody = await request.json();
    const { content, level, subject, topic, model: selectedLLM } = requestBody;
    
    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    console.log('Request details:', {
      model: selectedLLM,
      topic,
      subject,
      level,
      contentLength: content?.length,
      contentPreview: content?.substring(0, 100) + '...'
    });

    // Initialize Gemini with the provided API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Create the updated prompt with stronger topic prioritization for pre-university simplicity
    const prompt = `As an experienced ${subject} teacher, create 5 practice questions about ${topic} for ${level} pre-university students.

Content to analyze:
${content}

Requirements:
1. The topic "${topic}" is much more important than the content so please prioritize it heavily in all questions
2. Create questions that focus on the core ideas of ${topic}, using the content only as a secondary reference
3. Include a mix of question types (recall, understanding, application)
4. Each question must have a clear, detailed answer
5. Questions must be simple, appropriate for pre-university ${level} students, avoiding complicated theories or advanced concepts
6. Ensure all questions directly relate to ${topic} above all else

Format your response strictly as a JSON array:
[
  {
    "question": "Question text here",
    "answer": "Detailed answer here"
  }
]`;

    console.log("Sending prompt to Gemini:", { subject, level, topic });

    try {
      // Use the same model and API version as in the working route
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
       
      });
      
      // Use the same generateContent structure as in your working route
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      if (!result.response) {
        throw new Error('No response from Gemini API');
      }

      const text = result.response.text();
      console.log("Received response from Gemini API");

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      let questions = [];
      
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0]);
          console.log(`Successfully parsed ${questions.length} questions`);
        } catch (e) {
          console.error('Failed to parse questions JSON:', e);
          return NextResponse.json(
            { error: 'Failed to parse questions from AI response', rawResponse: text },
            { status: 500 }
          );
        }
      } else {
        console.error('No JSON array found in response:', text);
        return NextResponse.json(
          { error: 'Invalid response format from AI', rawResponse: text },
          { status: 500 }
        );
      }

      // Return both questions array and the full response text
      return NextResponse.json({ 
        questions: questions,
        response: text 
      });
    } catch (apiError) {
      console.error("Gemini API error:", apiError);

      const errorMessage =
        apiError instanceof Error ? apiError.message : "Unknown error";
      
      return NextResponse.json(
        { error: `Gemini API error: ${errorMessage}` },
        { status: 500 }
      );
      
    }
  } catch (error) {
    console.error('Questions generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}