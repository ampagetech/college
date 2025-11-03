"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Word {
    value: string;
    count: number;
    color?: string;
}

// Function to generate a random vibrant color
const getRandomColor = () => {
  const colors = [
    '#1E90FF', '#32CD32', '#FF4500', '#9370DB', 
    '#20B2AA', '#FF6347', '#4682B4', '#D63F3F', 
    '#2E8B57', '#FF8C00'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const GenericCloud: React.FC = () => {
  const router = useRouter();
  const [cloudRadius, setCloudRadius] = useState(150);

  // Function to generate a random scattered layout
  const generateTagLayout = (tagCount: number) => {
    return Array.from({ length: tagCount }, () => ({
      angle: Math.random() * 2 * Math.PI, // Random angle
      radiusFactor: Math.random() * 1.5 + 0.5 // Spread items further
    }));
  };


  const baseData: Word[] = [
    { value: 'Dailytrust', count: 100 },
    { value: 'Punchng', count: 115 },
    { value: 'Thenation', count: 130 },
    { value: 'Guardiannewsngr', count: 89 },
    { value: 'Vanguardngr', count: 76 },
    { value: 'Thisdaylive', count: 71 },
    { value: 'Newtelegraph', count: 100 },
    { value: 'Leadership', count: 75 },
    { value: 'Sunnewsonline', count: 82 },
    { value: 'Tribune', count: 47 },
    { value: 'Businessday', count: 15 },
    { value: 'Dailyindependentnig', count: 44 },
    { value: 'Blueprint', count: 56 },
    { value: 'Dailypost', count: 33 },
    { value: 'Premiumtimesng', count: 43 },
    { value: 'Saharareporters', count: 32 },
    { value: 'Thecable', count: 50 },
    { value: 'Pmnewsnigeria', count: 25 },
    { value: 'Economicconfidentia', count: 12 },
    { value: 'Pointblanknews', count: 11 },
    { value: 'Channelstv', count: 8 },
    { value: 'Tori', count: 12 },
    { value: 'Theeagleonline', count: 15 },
    { value: 'Naijaloaded', count: 21 },
    { value: 'Nigerianeye', count: 11 },
    { value: 'Ripplesnigeria', count: 31 },
    { value: 'Yabaleftonline', count: 5 },
    { value: 'Hallmarknews', count: 9 },
    { value: 'Nporeports', count: 10 },
    { value: 'Tell', count: 1 },
    { value: 'Naijanews', count: 23 },
    { value: 'Aljazeera', count: 66 },
    { value: 'Dailynigerian', count: 44 },
    { value: 'Opinionnigeria', count: 38 },
    { value: 'Legit', count: 194 },
    { value: '9jaflaver', count: 63 },
    { value: 'Promptnewsonline', count: 26 },
    { value: 'Chronicle', count: 21 },
    { value: 'Sundiatapost', count: 33 },
    { value: 'Newsexpressngr', count: 20 },
    { value: 'Thestreetjournal', count: 18 },
    { value: 'Lindaikejisblog', count: 68 },
    { value: 'Bellanaija', count: 27 },
    { value: 'Politicsnigeria', count: 10 },
    { value: 'Newsdigest', count: 6 },
    { value: 'Insidebusiness', count: 5 },
    { value: 'Societynow', count: 4 },
    { value: 'Kemifilani', count: 13 },
    { value: '9newsng', count: 6 },
    { value: 'Withinnigeria', count: 23 },
    { value: 'Theatlantic', count: 3 },
    { value: 'Nairametrics', count: 3 },
    { value: 'Thewhistler', count: 7 },
    { value: 'Solacebase', count: 2 },
    { value: 'Kanofocus', count: 0 },
    { value: 'Ekohotblog', count: 3 },
    { value: 'Thenigerialawyer', count: 8 },
    { value: 'Bizwatchnigeria', count: 8 },
    { value: 'Allnews', count: 7 },
    { value: 'Newsprobeng', count: 8 },
    { value: 'Crediblenews', count: 6 },
    { value: 'Katsinapost', count: 5 },
    { value: 'Ireporteronline', count: 4 },
    { value: 'Voahausa', count: 6 },
    { value: 'Neptuneprime', count: 7 },
    { value: 'Newarab', count: 10 },
    { value: 'Newsdiaryonline', count: 9 },
    { value: 'Gazettengr', count: 21 },
    { value: 'Techeconomy', count: 2 },
    { value: 'Nytimes', count: 40 },
    { value: 'Abntv', count: 1 },
    { value: 'Topnaija', count: 6 },
    { value: 'Legit-hausa', count: 33 },
    { value: 'Globalupfront', count: 2 },
    { value: 'Newsband', count: 3 },
    { value: 'Economist', count: 21 },
    { value: 'Washingtonpost', count: 17 },
    { value: 'Thestar', count: 11 },
    { value: 'Fij', count: 5 },
    { value: 'Akelicious', count: 2 },
    { value: 'Newsonlineng', count: 3 },
    { value: 'Firstnewsonline', count: 3 },
    { value: 'Aminiya', count: 7 },
    { value: 'Metrodailyng', count: 4 },
    { value: 'Bbc-hausa', count: 8 },
    { value: 'Newscentral', count: 5 },
    { value: 'Hotjist', count: 7 },
    { value: 'Royalnews', count: 4 },
    { value: 'Hausa-leadership', count: 0 },
    { value: 'Newslodge', count: 8 },
    { value: 'Newsweek', count: 11 },
    { value: 'Theguardian', count: 44 },
    { value: 'Pbs', count: 6 },
    { value: 'Thisnigeria', count: 7 },
    { value: 'Thewillnews', count: 4 },
    { value: 'Arise', count: 14 },
    { value: 'Fortune', count: 10 },
    { value: 'Wuzupnigeria', count: 1 },
    { value: 'Thegavel', count: 2 },
    { value: 'Sciencenigeria', count: 5 },
    { value: 'Libertytvradio', count: 2 },
    { value: 'Prnigeria', count: 9 },
    { value: 'Foreignpolicy', count: 4 },
    { value: 'Apexnewsexclusive', count: 2 },
    { value: 'Trustradio', count: 2 },
    { value: 'Dailyrealityng', count: 1 },
];







  // Remove or comment out the entire baseData999 array since it's not being used

  const data = baseData.map(tag => ({
    ...tag,
    color: getRandomColor()
  }));

  useEffect(() => {
    const handleResize = () => {
      setCloudRadius(Math.min(Math.max(window.innerWidth * 0.2, 150), 400));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tagLayout = generateTagLayout(data.length);

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

          const size = 12 + (tag.count / Math.max(...data.map(t => t.count))) * 30;

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
              onClick={() => router.push(`/news-feed/${encodeURIComponent(tag.value)}`)}
            >
              {tag.value}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default GenericCloud;
