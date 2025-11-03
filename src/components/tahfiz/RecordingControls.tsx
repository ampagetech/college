// src/components/tahfiz/RecordingControls.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Loader2
} from 'lucide-react';
import { VerseRange } from '@/stores/verseSelectionStore';
import { VerseText } from '@/lib/verseLoader';
import { RecitationAttempt, LLMProvider } from '@/types/tahfiz';



interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

interface RecordingControlsProps {
  selectedLLM: LLMProvider;
  selectedQiraa: 'hafs' | 'warsh';
  selectedRange: VerseRange;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  processingStage: 'idle' | 'transcribing' | 'analyzing' | 'complete';
  setProcessingStage: (stage: 'idle' | 'transcribing' | 'analyzing' | 'complete') => void;
  setCurrentAttempt: (attempt: RecitationAttempt | null) => void;
  setAttempts: (updater: (prev: RecitationAttempt[]) => RecitationAttempt[]) => void;
  llmOptions: Array<{ id: string; name: string; icon: string; description: string }>;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  selectedLLM,
  selectedQiraa,
  selectedRange,
  isLoading,
  setIsLoading,
  onError,
  processingStage,
  setProcessingStage,
  setCurrentAttempt,
  setAttempts,
  llmOptions
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio level monitoring
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;
    const normalizedLevel = (average / 255) * 100;
    
    setRecordingState(prev => ({ ...prev, audioLevel: normalizedLevel }));
    
    if (recordingState.isRecording && !recordingState.isPaused) {
      requestAnimationFrame(monitorAudioLevel);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      onError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Setup audio context for level monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioLevel: 0
      });

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);

      // Start audio level monitoring
      monitorAudioLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        setRecordingState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          audioLevel: 0
        });

        // Process the recording
        await processRecording(audioBlob);
      };
    }
  };

  // Process recording with selected LLM
  const processRecording = async (audioBlob: Blob) => {
    setIsLoading(true);
    setProcessingStage('transcribing');

    try {
      // Step 1: Transcribe audio
      const transcription = await transcribeAudio(audioBlob);
      setProcessingStage('analyzing');

      // Step 2: Get verse text for comparison
      const verseText = await getVerseText(selectedRange, selectedQiraa);

      // Step 3: Compare with LLM
      const analysis = await compareWithLLM(transcription, verseText, selectedLLM);

      // Create attempt record
      const attempt: RecitationAttempt = {
        id: Date.now().toString(),
        timestamp: new Date(),
        audioBlob,
        transcription,
        score: analysis.score,
        feedback: analysis.feedback,
        llmProvider: selectedLLM,
        duration: recordingState.duration,
        originalText: verseText.simpleText,
        tashkeelText: verseText.tashkeelText,
        verseReference: verseText.reference,
        accuracyDetails: analysis.accuracyDetails,
        mistakes: analysis.mistakes,
        suggestions: analysis.suggestions
      };

      setCurrentAttempt(attempt);
      setAttempts(prev => [attempt, ...prev]);
      setProcessingStage('complete');

      // Save to database (don't block UI if this fails)
      try {
        await saveAttemptToDatabase(attempt, verseText);
      } catch (saveError) {
        console.error('Failed to save to database:', saveError);
        onError('Results analyzed successfully, but failed to save to database. Your session data is still available.');
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      onError(error instanceof Error ? error.message : 'Failed to process recording. Please try again.');
      setProcessingStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  // Transcribe audio using API
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model', selectedLLM === 'openai' ? 'openai' : 'gemini');
      formData.append('language', 'ar');
      formData.append('context', 'quran');
      
      const { startChapter, startVerse, endChapter, endVerse } = selectedRange;
      if (startChapter === endChapter) {
        formData.append('verseReference', `${startChapter}:${startVerse}-${endVerse}`);
      } else {
        formData.append('verseReference', `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`);
      }

      const response = await fetch('/api/quran/transcribe_recitation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('No transcription text received');
      }

      return data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  };

  // Get verse text from JSON files
  const getVerseText = async (range: VerseRange, qiraa: 'hafs' | 'warsh'): Promise<VerseText> => {
    try {
      const { loadVerses } = await import('@/lib/verseLoader');
      return await loadVerses(range, qiraa);
    } catch (error) {
      console.error('Error loading verses:', error);
      throw new Error('Failed to load verses. Please check your selection and try again.');
    }
  };

  // Compare with LLM
  const compareWithLLM = async (
    transcription: string, 
    verseText: VerseText, 
    llm: LLMProvider
  ) => {
    try {
      const response = await fetch('/api/quran/compare_memorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcribedText: transcription,
          originalText: verseText.simpleText,
          originalTashkeel: verseText.tashkeelText,
          verseReference: verseText.reference,
          llmProvider: llm,
          verseCount: verseText.verseCount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Comparison failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing with LLM:', error);
      throw new Error('Failed to get AI feedback. Please try again.');
    }
  };

  // Save attempt to database
  const saveAttemptToDatabase = async (attempt: RecitationAttempt, verseText: VerseText) => {
    try {
      const userId = 'demo_user_123'; // Replace with actual user management
      
      if (!userId) {
        console.warn('No user ID available, skipping database save');
        return;
      }

      const response = await fetch('/api/recitations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          verseSelection: {
            startChapter: selectedRange.startChapter,
            startVerse: selectedRange.startVerse,
            endChapter: selectedRange.endChapter,
            endVerse: selectedRange.endVerse,
            qiraa: selectedQiraa,
            reference: verseText.reference
          },
          recording: {
            duration: attempt.duration,
          },
          transcription: {
            text: attempt.transcription,
            originalText: attempt.originalText,
            tashkeelText: attempt.tashkeelText
          },
          analysis: {
            llmProvider: attempt.llmProvider,
            score: attempt.score,
            feedback: attempt.feedback,
            accuracyDetails: attempt.accuracyDetails,
            mistakes: attempt.mistakes,
            suggestions: attempt.suggestions,
            confidence: 0.8
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recitation');
      }

      const result = await response.json();
      console.log('Recitation saved successfully:', result.attemptId);

    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Recording Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Status */}
          {recordingState.isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium">Recording</span>
                </div>
                <span className="text-red-700 font-mono text-lg">
                  {formatDuration(recordingState.duration)}
                </span>
              </div>
              
              {/* Audio Level Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Audio Level</span>
                  <span>{Math.round(recordingState.audioLevel)}%</span>
                </div>
                <Progress 
                  value={recordingState.audioLevel} 
                  className="h-2"
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3">
            {!recordingState.isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Mic className="h-5 w-5" />
                🎤 Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                <Square className="h-5 w-5" />
                Stop Recording
              </Button>
            )}
            
            <Button
              onClick={() => {
                setCurrentAttempt(null);
                setProcessingStage('idle');
                onError(null);
              }}
              variant="outline"
              disabled={recordingState.isRecording || isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingStage !== 'idle' && processingStage !== 'complete' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {processingStage === 'transcribing' && 'Transcribing Audio...'}
                  {processingStage === 'analyzing' && 'Analyzing with AI...'}
                </div>
                <div className="text-sm text-gray-600">
                  {processingStage === 'transcribing' && 'Converting speech to text'}
                  {processingStage === 'analyzing' && `Getting feedback from ${selectedLLM}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default RecordingControls;