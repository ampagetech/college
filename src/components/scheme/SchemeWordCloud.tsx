"use client";

import React, { useState, useEffect } from 'react';
// Remove the following line
// import { useRouter } from 'next/navigation';

interface SchemeCloudWord {
  value: string;
  count: number;
  color?: string;
  id?: string;
}

interface SchemeWordCloudProps {
  searchQuery: string;
  filters: {
    level: string;
    term: string;
    subject: string;
  };
}

const getRandomColor = () => {
  const colors = [
    '#1E90FF', '#32CD32', '#FF4500', '#9370DB', 
    '#20B2AA', '#FF6347', '#4682B4', '#D63F3F', 
    '#2E8B57', '#FF8C00'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const SchemeWordCloud: React.FC<SchemeWordCloudProps> = ({ searchQuery, filters }) => {
  // Remove the unused router declaration
  const [cloudRadius, setCloudRadius] = useState(250);
  const [data, setData] = useState<SchemeCloudWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTagLayout = (tagCount: number) => {
    return Array.from({ length: tagCount }, () => ({
      angle: Math.random() * 2 * Math.PI,
      radiusFactor: Math.random() * 1.5 + 0.5
    }));
  };

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!filters.level || !filters.subject) {
        return;
      }

      const params = new URLSearchParams({
        level: filters.level,
        term: filters.term,
        subject: filters.subject,
        searchQuery: searchQuery
      });

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/scheme-wordcloud?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from API');
        }
        
        const wordsWithColors = result.data.map((word: SchemeCloudWord) => ({
          ...word,
          color: getRandomColor()
        }));
        
        setData(wordsWithColors);
      } catch (error) {
        console.error('Error fetching cloud data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCloudData();
  }, [filters, searchQuery]);

  useEffect(() => {
    const handleResize = () => {
      setCloudRadius(Math.min(Math.max(window.innerWidth * 0.2, 200), 400));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tagLayout = generateTagLayout(data.length);

  if (isLoading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <h3 className="font-bold">Error loading word cloud</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-xl text-gray-500 text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          {!filters.level || !filters.subject 
            ? 'Select Level and Subject to generate Word Cloud' 
            : 'No data available for the selected filters'}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full flex justify-center items-center"
      style={{
        height: `${cloudRadius * 2}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: `${cloudRadius * 2}px`,
          height: `${cloudRadius * 2}px`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {data.map((tag, index) => {
          const layoutInfo = tagLayout[index];

          const x = Math.cos(layoutInfo.angle) * cloudRadius * layoutInfo.radiusFactor;
          const y = Math.sin(layoutInfo.angle) * cloudRadius * layoutInfo.radiusFactor;

          // Adjusted font size: smaller base and scale
          const size = 10 + (tag.count / Math.max(...data.map(t => t.count))) * 15;

          return (
            <span
              key={tag.value}
              style={{
                position: 'absolute',
                fontSize: `${size}px`,
                color: tag.color || '#333',
                cursor: 'pointer',
                transform: `translate(${x}px, ${y}px)`,
                fontWeight: 'bold',
                textShadow: '1px 1px 3px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}
              onClick={() => {
                if (tag.id) {
                  // Optional: implement modal opening here
                }
              }}
              title={`${tag.value} (${tag.count})`}
            >
              {tag.value}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default SchemeWordCloud;