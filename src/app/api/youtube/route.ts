import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeRequest {
  searchQuery: string;
  subjectName: string;
  topic: string;
  // Removed unused 'level' field
}

// Add interface for YouTube API response
interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, subjectName, topic }: YouTubeRequest = await request.json();

    // Input validation
    if (!searchQuery?.trim()) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Construct a search query that prioritizes the topic and targets high school simplicity
    const enhancedQuery = `${topic} ${subjectName} "high school" "simple explanation" "tutorial"`;
    const params = new URLSearchParams({
      part: 'snippet',
      q: enhancedQuery,  // Prioritize topic and high school simplicity
      maxResults: '6',
      type: 'video',
      videoEmbeddable: 'true',
      relevanceLanguage: 'en',
      order: 'relevance',
      safeSearch: 'strict',
      key: YOUTUBE_API_KEY!
    });

    try {
      const response = await fetch(`${YOUTUBE_API_URL}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'YouTube API request failed');
      }

      const videos = data.items.map((item: YouTubeVideoItem) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        channelTitle: item.snippet.channelTitle
      }));

      return NextResponse.json({ 
        videos,
        metadata: {
          totalResults: data.pageInfo?.totalResults,
          resultsPerPage: data.pageInfo?.resultsPerPage
        }
      });

    } catch (youtubeError) {
      console.error("YouTube API error:", youtubeError);
      return NextResponse.json(
        { error: "Failed to fetch YouTube videos" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("YouTube API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}