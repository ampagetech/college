// src/components/VideoCardDisplay.tsx
import React from 'react';

interface Video {
  title: string;
  url: string;
  description: string;
}

interface VideoCardDisplayProps {
  videoContent: string;
}

const VideoCardDisplay = ({ videoContent }: VideoCardDisplayProps) => {
  // Parse the videoContent string into an array of Video objects
  const parseVideos = (content: string): Video[] => {
    const videoBlocks = content.split('\n\n').filter(Boolean);
    return videoBlocks.map((block) => {
      const lines = block.split('\n').filter(Boolean);
      const title = lines[0]?.replace(/^\d+\.\s*\*\*(.+)\*\*$/, '$1') || 'Untitled';
      const url = lines[1]?.replace('- URL: ', '') || '';
      const description = lines[2]?.replace(/^-\s*/, '') || 'No description available';
      return { title, url, description };
    });
  };

  const videos = parseVideos(videoContent);

  return (
    <div className="space-y-4">
      {videos.map((video, index) => (
        <div
          key={index}
          className="p-4 border rounded-lg shadow-md bg-white hover:bg-gray-50 transition-colors"
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{video.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{video.description}</p>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Watch Video
          </a>
        </div>
      ))}
    </div>
  );
};

export default VideoCardDisplay;