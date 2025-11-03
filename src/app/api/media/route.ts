import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface MediaRequest {
  textContent: string;
  level: string;
  subjectName: string;
  topic: string;
}

interface MediaLink {
  type: 'youtube' | 'khanacademy' | 'image';
  title: string;
  url: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { textContent, level, subjectName, topic }: MediaRequest = await request.json();

    // Enhanced input validation
    if (!textContent?.trim()) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    if (!level?.trim() || !subjectName?.trim() || !topic?.trim()) {
      return NextResponse.json(
        { error: "Level, subject name, and topic are required" },
        { status: 400 }
      );
    }

    // Enhanced structured media prompt combining both approaches
    const mediaPrompt = `
    As an educational media curator for ${level} students studying ${subjectName}, 
    analyze this content about "${topic}" and provide relevant educational media links.

    Content to Analyze: ${textContent.slice(0, 500)}...

    Requirements:
    1. All links must be from reputable educational sources
    2. Prioritize content published within last 5 years
    3. Ensure age-appropriate material for ${level} students
    4. Provide exactly 2-3 resources for each category

    Format your response EXACTLY as follows:
    
    ### YouTube Videos
    - [Video Title](https://youtube.com/...) - Brief explanation of relevance
    - [Video Title](https://youtube.com/...) - Brief explanation of relevance
    
    ### Khan Academy
    - [Lesson Title](https://khanacademy.org/...) - Key concepts covered
    - [Lesson Title](https://khanacademy.org/...) - Key concepts covered
    
    ### Educational Images
    - [Diagram Title](https://image-source.com/...) - What this visual explains
    - [Diagram Title](https://image-source.com/...) - What this visual explains

    Note: Ensure all links and descriptions are accurate and relevant to the topic.
    `;

    // Call Gemini API with error handling
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(mediaPrompt);
      const responseText = result.response.text();

      // Parse and validate the response
      const mediaLinks = parseAndValidateResponse(responseText);

      if (!mediaLinks.length) {
        console.warn("No media links were parsed from the response:", responseText);
        return NextResponse.json(
          { error: "No valid media links could be generated" },
          { status: 422 }
        );
      }

      return NextResponse.json({ 
        mediaLinks,
        metadata: {
          totalLinks: mediaLinks.length,
          types: countLinkTypes(mediaLinks)
        }
      });

    } catch (generationError) {
      console.error("Gemini API error:", generationError);
      return NextResponse.json(
        { error: "Failed to generate media links" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Media API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseAndValidateResponse(responseText: string): MediaLink[] {
  const mediaLinks: MediaLink[] = [];
  
  // Parse YouTube links with validation
  const youtubeRegex = /- \[(.*?)\]\((https:\/\/(?:www\.)?youtube\.com\/.*?)\) - (.*)/g;
  let match;
  while ((match = youtubeRegex.exec(responseText)) !== null) {
    if (isValidUrl(match[2])) {
      mediaLinks.push({
        type: 'youtube',
        title: sanitizeText(match[1]),
        url: match[2],
        description: sanitizeText(match[3])
      });
    }
  }

  // Parse Khan Academy links with validation
  const khanRegex = /- \[(.*?)\]\((https:\/\/(?:www\.)?khanacademy\.org\/.*?)\) - (.*)/g;
  while ((match = khanRegex.exec(responseText)) !== null) {
    if (isValidUrl(match[2])) {
      mediaLinks.push({
        type: 'khanacademy',
        title: sanitizeText(match[1]),
        url: match[2],
        description: sanitizeText(match[3])
      });
    }
  }

  // Parse Image links with validation
  const imageRegex = /- \[(.*?)\]\((https:\/\/.*?\.(?:png|jpg|jpeg|svg|gif))\) - (.*)/g;
  while ((match = imageRegex.exec(responseText)) !== null) {
    if (isValidUrl(match[2])) {
      mediaLinks.push({
        type: 'image',
        title: sanitizeText(match[1]),
        url: match[2],
        description: sanitizeText(match[3])
      });
    }
  }

  return mediaLinks;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    console.warn("Invalid URL detected:", url);
    return false;
  }
}

function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/^\s+|\s+$/g, ''); // Trim whitespace
}

function countLinkTypes(links: MediaLink[]) {
  return links.reduce((acc, link) => {
    acc[link.type] = (acc[link.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}