// src/app/(dashboard)/assistant/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import FilterControls from '@/components/assistant/FilterControls';
import { Alert } from '@/components/ui/alert';
import { useFilterStore } from '@/stores/assistant/filterStore';
import LessonTabs from '@/components/assistant/LessonTabs';
import { getGeminiApiKey } from '@/lib/actions/api-key-actions';

// Define the shape of button labels to ensure type safety
type ButtonLabels = {
  generate: string;
  reset: string;
  clear: string;
};

// Define the shape of lesson details for type safety
interface LessonDetailsType {
  text: {
    topic_long: string;
    content: string;
    activity: string;
  };
}

export default function AssistantPage() {
  const buttonLabels: ButtonLabels = {
    generate: 'Get AI Response',
    reset: 'Reset Prompt',
    clear: 'Clear Prompt',
  };

  const [activeTab, setActiveTab] = useState<string>('prompt');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  // Using useFilterStore to track if we need the lessonDetails state
  const { missingFilters, error } = useFilterStore();

  // Fetch API key on component mount
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const key = await getGeminiApiKey();
        setApiKey(key);
      } catch (error) {
        console.error('Failed to fetch API key:', error);
        setApiKey(null);
      } finally {
        setApiKeyLoading(false);
      }
    }
    
    fetchApiKey();
  }, []);

  const handleLessonDetailsChange = (details: LessonDetailsType) => {
    // We're handling the lesson details but not storing them in state
    // since the state variable was unused. If you need to store this data,
    // you can reintroduce the state variable.
    console.log('Lesson details changed:', details);
    // Implement any necessary logic here
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div style={{ width: '100%' }}>
              <FilterControls
                onLessonDetailsChange={handleLessonDetailsChange}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <p>{error}</p>
            </Alert>
          )}

          {apiKeyLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-gray-500">Loading API configuration...</div>
            </div>
          ) : (
            <LessonTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              buttonLabels={buttonLabels}
              selectedLLM="gemini"
              apiKey={apiKey}
            />
          )}
        </CardContent>
      </Card>

      {missingFilters.length > 0 && (
        <Alert variant="destructive">
          <p>Please select: {missingFilters.join(', ')}</p>
        </Alert>
      )}

      <footer className="text-center text-gray-400 text-sm py-4">
        © {new Date().getFullYear()} AmpageTech Nig Ltd. All Rights Reserved.
      </footer>
    </div>
  );
}