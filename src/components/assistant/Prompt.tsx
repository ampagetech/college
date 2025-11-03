// src/components/Prompt.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert';
import { useFilterStore } from '@/stores/assistant/filterStore';
import { usePromptStore } from '@/stores/assistant/promptStore';
import { useResponseStore } from '@/stores/assistant/responseStore';
import { useVideoStore } from '@/stores/assistant/videoStore';
import { useQuestionStore } from '@/stores/assistant/questionStore';

interface PromptProps {
  buttonLabels: { generate: string; reset: string; clear: string };
  isLoading?: boolean;
}

export default function Prompt({ buttonLabels, isLoading = false }: PromptProps) {
  const { level, subject, topic } = useFilterStore();
  const { prompt, error, setPrompt, generatePrompt, reset } = usePromptStore();
  const responseStore = useResponseStore();
  const videoStore = useVideoStore();
  const questionStore = useQuestionStore();
  const [isAutoPrompt, setIsAutoPrompt] = useState(true);
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    if (isAutoPrompt && level && subject && (customTopic || topic)) {
      generatePrompt({ 
        level, 
        subject, 
        topic: customTopic || topic 
      });
    }
  }, [level, subject, topic, isAutoPrompt, generatePrompt, customTopic]);
  
  useEffect(() => {
    if (topic) {
      setCustomTopic('');
    }
  }, [topic]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsAutoPrompt(false);
    setPrompt(e.target.value);
  };

  const handleClear = () => {
    setPrompt('');
    setIsAutoPrompt(false);
  };

  const handleReset = () => {
    if (!level || !subject || (!customTopic && !topic)) {
      reset();
      return;
    }
    responseStore.clear();
    videoStore.clear();
    questionStore.clear();
    generatePrompt({ 
      level, 
      subject, 
      topic: customTopic || topic
    });
    setIsAutoPrompt(true);
  };

  if (isLoading) {
    return <div>Loading prompt content...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Prompt</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter custom topic..."
            className="border rounded px-3 py-1.5 text-sm w-64"
          />
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            {buttonLabels.reset}
          </Button>
          <Button variant="outline" onClick={handleClear} disabled={isLoading}>
            {buttonLabels.clear}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {subject && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          <p>Subject: {subject}</p>
          <p>Grade Level: {level}</p>
          <p>Topic: {customTopic || topic}</p>
        </div>
      )}

      <Textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Select filters to generate a prompt, or enter your own..."
        className="min-h-[200px] w-full whitespace-pre-wrap font-mono text-sm leading-relaxed p-4"
      />
    </div>
  );
}