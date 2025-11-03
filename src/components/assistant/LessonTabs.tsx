// src/components/assistant/LessonTabs.tsx
import { ButtonLabels } from '@/types/label';
import Prompt from '@/components/assistant/Prompt';
import ContentTab from '@/components/assistant/ContentTab';
import React from 'react';

interface LessonTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  buttonLabels: ButtonLabels;
  selectedLLM: 'chatgpt' | 'gemini' | 'deepseek';
  apiKey?: string | null;
}

export default function LessonTabs({ 
  activeTab, 
  setActiveTab, 
  buttonLabels, 
  selectedLLM, 
  apiKey 
}: LessonTabsProps) {
  return (
    <div className="w-full">
      <div role="tablist" className="flex gap-2 mb-6">
        {['Prompt', 'Response', 'Videos', 'Questions'].map((tab) => (
          <div
            key={tab.toLowerCase()}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`
              px-6 py-2 
              rounded-full 
              cursor-pointer 
              transition-all
              ${activeTab === tab.toLowerCase() 
                ? 'bg-black text-white shadow-md' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
            `}
          >
            {tab}
          </div>
        ))}
      </div>

      {!apiKey && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            API key not configured. Please check your environment variables.
          </p>
        </div>
      )}

      <div className="tab-content w-full">
        <div className={`p-4 ${activeTab === 'prompt' ? 'block' : 'hidden'}`}>
          <Prompt buttonLabels={buttonLabels} />
        </div>
        
        <div className={`p-4 ${activeTab === 'response' ? 'block' : 'hidden'}`}>
          <ContentTab
            tabType="response"
            selectedLLM={selectedLLM}
            buttonLabel="Generate Response"
            apiKey={apiKey}
          />
        </div>
        
        <div className={`p-4 ${activeTab === 'videos' ? 'block' : 'hidden'}`}>
          <ContentTab
            tabType="videos"
            selectedLLM={selectedLLM}
            buttonLabel="Generate Video Links"
            apiKey={apiKey}
          />
        </div>
        
        <div className={`p-4 ${activeTab === 'questions' ? 'block' : 'hidden'}`}>
          <ContentTab
            tabType="questions"
            selectedLLM={selectedLLM}
            buttonLabel="Generate Questions"
            apiKey={apiKey}
          />
        </div>
      </div>
    </div>
  );
}