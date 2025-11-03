// src/components/ui/MediaLinksDisplay.tsx
import React from 'react';
import { ExternalLink, Youtube, BookOpen, Image as ImageIcon } from 'lucide-react';

export interface MediaLink {
  type: 'youtube' | 'khanacademy' | 'image';
  title: string;
  url: string;
  description: string;
}

interface MediaLinksDisplayProps {
  links: MediaLink[];
  isLoading: boolean;
}

const MediaLinksDisplay = ({ links, isLoading }: MediaLinksDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getIconWithColor = (type: MediaLink['type']) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" aria-hidden="true" />;
      case 'khanacademy':
        return <BookOpen className="w-5 h-5 text-green-600" aria-hidden="true" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />;
      default:
        return <ExternalLink className="w-5 h-5 text-gray-600" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-4 p-4">
      {links.map((link, index) => (
        <div
          key={index}
          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getIconWithColor(link.type)}
            </div>
            <div className="flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                {link.title}
                <ExternalLink size={14} className="inline text-gray-400" />
              </a>
              <p className="text-sm text-gray-600 mt-1">{link.description}</p>
            </div>
          </div>
        </div>
      ))}
      {links.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 p-4">
          No media links available. Click &quot;Generate Media Prompt&quot; to find relevant resources.
        </div>
      )}
    </div>
  );
};

export default MediaLinksDisplay;