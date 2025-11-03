// src/components/tahfiz/RecitationResults.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Play,
  Pause,
  BookOpen,
  User,
  Target
} from 'lucide-react';

import { RecitationAttempt } from '@/types/tahfiz';
import TextComparison from './TextComparison';

interface RecitationResultsProps {
  currentAttempt: RecitationAttempt;
  selectedQiraa: 'hafs' | 'warsh';
  llmOptions: Array<{ id: string; name: string; icon: string; description: string }>;
}

const RecitationResults: React.FC<RecitationResultsProps> = ({
  currentAttempt,
  selectedQiraa,
  llmOptions
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'transcribed' | 'comparison'>('comparison');

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play recorded audio
  const playRecording = (audioBlob: Blob) => {
    if (audio) {
      audio.pause();
    }
    const newAudio = new Audio(URL.createObjectURL(audioBlob));
    setAudio(newAudio);
    
    newAudio.onplay = () => setIsPlaying(true);
    newAudio.onpause = () => setIsPlaying(false);
    newAudio.onended = () => setIsPlaying(false);
    
    newAudio.play();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Latest Analysis
          <Badge variant={getScoreBadge(currentAttempt.score)}>
            {currentAttempt.score}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score and Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Analyzed by:</span>
            <span className="font-medium">
              {llmOptions.find(llm => llm.id === currentAttempt.llmProvider)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Duration:</span>
            <span className="font-mono">{formatDuration(currentAttempt.duration)}</span>
          </div>
        </div>

        {/* Feedback and Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">AI Feedback</h4>
          <p className="text-sm text-gray-700 mb-3">{currentAttempt.feedback}</p>
          
          {/* Accuracy Details */}
          {currentAttempt.accuracyDetails && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {currentAttempt.accuracyDetails.overallAccuracy}%
                </div>
                <div className="text-xs text-gray-600">Overall</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {currentAttempt.accuracyDetails.pronunciation}%
                </div>
                <div className="text-xs text-gray-600">Pronunciation</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {currentAttempt.accuracyDetails.completeness}%
                </div>
                <div className="text-xs text-gray-600">Completeness</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {currentAttempt.accuracyDetails.correctOrder}%
                </div>
                <div className="text-xs text-gray-600">Order</div>
              </div>
            </div>
          )}

          {/* Mistakes */}
          {currentAttempt.mistakes && currentAttempt.mistakes.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement:</h5>
              <ul className="text-sm text-red-600 space-y-1">
                {currentAttempt.mistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>{mistake.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {currentAttempt.suggestions && currentAttempt.suggestions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-green-700 mb-2">Suggestions:</h5>
              <ul className="text-sm text-green-600 space-y-1">
                {currentAttempt.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Result Comparison
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'original'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            Original Verses
          </button>
          <button
            onClick={() => setActiveTab('transcribed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'transcribed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Your Recitation
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'comparison' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Result - Accuracy Overlay
              </h4>
              <div className="text-sm text-gray-600 mb-3">
                <span className="inline-block w-4 h-4 bg-green-200 rounded mr-2"></span>
                Correct matches
                <span className="inline-block w-4 h-4 bg-red-200 rounded mr-2 ml-4"></span>
                Missing or incorrect words
              </div>
              <TextComparison
                originalText={currentAttempt.originalText}
                transcribedText={currentAttempt.transcription}
                tashkeelText={currentAttempt.tashkeelText}
              />
            </div>
          )}

          {activeTab === 'original' && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Original Verses ({currentAttempt.verseReference}) - {selectedQiraa.toUpperCase()}
              </h4>
              <div className="text-sm text-gray-700 leading-relaxed" style={{ 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '18px',
                lineHeight: '2',
                direction: 'rtl',
                textAlign: 'right'
              }}>
                {currentAttempt.tashkeelText}
              </div>
            </div>
          )}

          {activeTab === 'transcribed' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Recitation (Transcribed)
              </h4>
              <div className="text-sm text-gray-700 leading-relaxed" style={{ 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '16px',
                lineHeight: '1.8',
                direction: 'rtl',
                textAlign: 'right'
              }}>
                {currentAttempt.transcription}
              </div>
            </div>
          )}
        </div>

        {/* Audio Playback */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => playRecording(currentAttempt.audioBlob)}
            variant="outline"
            size="sm"
            disabled={isPlaying}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Playing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play Recording
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecitationResults;