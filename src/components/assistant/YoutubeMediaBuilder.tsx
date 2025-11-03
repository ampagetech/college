// src/components/YoutubeMediaBuilder.tsx
import React, { useState } from 'react';
import { useVideoStore } from '@/stores/assistant/videoStore';
import type { MediaLink } from '@/components/ui/MediaLinksDisplay';

interface YoutubeMediaBuilderProps {
  textContent: string;
  level: string;
  subjectName: string;
  topic: string;
  onVideosGenerated?: (videos: MediaLink[]) => void;
  onSearchStart?: () => void;
}

interface YouTubeVideo {
  title: string;
  url: string;
  channelTitle: string;
  description: string;
}

const YoutubeMediaBuilder = ({
  textContent,
  level,
  subjectName,
  topic,
  onVideosGenerated,
  onSearchStart,
}: YoutubeMediaBuilderProps) => {
  const { setVideos, setError } = useVideoStore(); // Removed unused 'videos'
  const [isGenerating, setIsGenerating] = useState(false);

  const generateYoutubeVideos = async () => {
    onSearchStart?.();
    setIsGenerating(true);
    setError('');

    try {
      const cleanTopic = topic.substring(7);
      const searchQuery = `${subjectName} ${level} "${cleanTopic}" (lecture OR explanation OR tutorial)`;

      console.log('Sending YouTube search request:', { searchQuery, level, subjectName, topic: cleanTopic });
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          level,
          subjectName,
          topic: cleanTopic,
        }),
      });

      const errorData = await response.json();
      if (!response.ok) {
        console.error('YouTube API fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `Failed to fetch YouTube videos: ${response.status}`);
      }

      console.log('YouTube API response:', JSON.stringify(errorData, null, 2));
      const transformedVideos: MediaLink[] = errorData.videos.map((video: YouTubeVideo) => ({
        type: 'youtube',
        title: video.title,
        url: video.url,
        description: `${video.channelTitle} - ${video.description.substring(0, 150)}...`,
      }));

      const videoContent = transformedVideos
        .map((v, i) => `${i + 1}. **${v.title}**\n   - URL: ${v.url}\n   - ${v.description}`)
        .join('\n\n');
      setVideos(videoContent);
      onVideosGenerated?.(transformedVideos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch YouTube videos.';
      setError(errorMessage);
      console.error('YouTube video fetch error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Educational YouTube Videos
          <span className="text-sm text-gray-500 ml-2">(Using YouTube API)</span>
        </h3>
        <button
          onClick={generateYoutubeVideos}
          disabled={isGenerating || !textContent}
          className={`px-4 py-2 rounded-md transition-colors ${
            isGenerating || !textContent
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isGenerating ? 'Searching...' : 'Generate Video Links'}
        </button>
      </div>

      {!textContent && (
        <p className="text-gray-500 italic">
          Generate text content first in the &quot;Response&quot; tab to find relevant videos
        </p>
      )}
    </div>
  );
};

export default YoutubeMediaBuilder;