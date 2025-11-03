// src/components/tahfiz/RecitationPanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, FileAudio } from 'lucide-react';
import { useVerseSelectionStore } from '@/stores/verseSelectionStore';
import RecordingControls from './RecordingControls';
import RecitationResults from './RecitationResults';
import { RecitationAttempt, LLMProvider } from '@/types/tahfiz';

interface RecitationPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const RecitationPanel: React.FC<RecitationPanelProps> = ({
  isLoading,
  setIsLoading,
  onError
}) => {
  const { selectedRange } = useVerseSelectionStore();
  const [selectedLLM, setSelectedLLM] = useState<LLMProvider>('gemini');
  const [selectedQiraa, setSelectedQiraa] = useState<'hafs' | 'warsh'>('hafs');
  const [currentAttempt, setCurrentAttempt] = useState<RecitationAttempt | null>(null);
  const [attempts, setAttempts] = useState<RecitationAttempt[]>([]);
  const [processingStage, setProcessingStage] = useState<'idle' | 'transcribing' | 'analyzing' | 'complete'>('idle');

  const llmOptions = [
    { id: 'gemini', name: 'Gemini', icon: '🔷', description: 'Google Gemini AI' },
    { id: 'openai', name: 'OpenAI', icon: '🟢', description: 'ChatGPT/Whisper' },
    { id: 'claude', name: 'Claude', icon: '🟠', description: 'Anthropic Claude' },
  ];

  // Clear attempts when verse range changes
  useEffect(() => {
    setCurrentAttempt(null);
    setAttempts([]);
    setProcessingStage('idle');
    onError(null);
  }, [selectedRange, onError]);

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recitation Practice</h3>
          <p className="text-sm text-gray-600">
            Record your recitation and get AI feedback
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-purple-700">Qira'a:</label>
            <select 
              value={selectedQiraa} 
              onChange={(e) => setSelectedQiraa(e.target.value as 'hafs' | 'warsh')}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              disabled={isLoading}
            >
              <option value="hafs">Hafs</option>
              <option value="warsh">Warsh</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">AI Model:</label>
            <Select value={selectedLLM} onValueChange={(value: LLMProvider) => setSelectedLLM(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {llmOptions.map(llm => (
                  <SelectItem key={llm.id} value={llm.id}>
                    <div className="flex items-center gap-2">
                      <span>{llm.icon}</span>
                      <span>{llm.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <RecordingControls
        selectedLLM={selectedLLM}
        selectedQiraa={selectedQiraa}
        selectedRange={selectedRange}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        onError={onError}
        processingStage={processingStage}
        setProcessingStage={setProcessingStage}
        setCurrentAttempt={setCurrentAttempt}
        setAttempts={setAttempts}
        llmOptions={llmOptions}
      />

      {/* Results */}
      {currentAttempt && (
        <RecitationResults
          currentAttempt={currentAttempt}
          selectedQiraa={selectedQiraa}
          llmOptions={llmOptions}
        />
      )}

      {/* Previous Attempts */}
      {attempts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Previous Attempts ({attempts.length - 1})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.slice(1, 4).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={getScoreBadge(attempt.score)}>
                      {attempt.score}%
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {attempt.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      via {llmOptions.find(llm => llm.id === attempt.llmProvider)?.name}
                    </span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {attempt.verseReference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecitationPanel;