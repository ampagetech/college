'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type LLM = 'openai' | 'gemini'
type QueryStage = 'idle' | 'listening' | 'transcribing' | 'generating-sql' | 'querying' | 'complete'

interface NlSqlHeaderProps {
  query: string
  setQuery: (text: string) => void
  onExecute: () => void
  isRunning: boolean
  stage: QueryStage
  setSqlModel: (m: LLM) => void
  sqlModel: LLM
  transcribeModel: LLM
  setTranscribeModel: (m: LLM) => void
  onTranscribe: (blob: Blob) => Promise<void>
  onAbort?: () => void
}

export default function NlSqlHeader({
  query,
  setQuery,
  onExecute,
  isRunning,
  stage,
  sqlModel,
  setSqlModel,
  transcribeModel,
  setTranscribeModel,
  onTranscribe,
  onAbort
}: NlSqlHeaderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check microphone permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setMicPermission(result.state === 'granted' ? 'granted' : 'denied')
          result.onchange = () => {
            setMicPermission(result.state === 'granted' ? 'granted' : 'denied')
          }
        })
        .catch(() => setMicPermission('unknown'))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecordingTime(0)
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsRecording(false)
    stopTimer()
  }, [])

  const startRecording = useCallback(async () => {
    if (isRunning) return

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      streamRef.current = stream
      setMicPermission('granted')

      // Check if browser supports MediaRecorder
      if (!MediaRecorder.isTypeSupported('audio/webm') && !MediaRecorder.isTypeSupported('audio/wav')) {
        throw new Error('Your browser does not support audio recording')
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/wav'
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          
          // Check if we have audio data
          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded. Please try again.')
          }

          await onTranscribe(audioBlob)
        } catch (error) {
          console.error('Error processing recording:', error)
        } finally {
          // Cleanup
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          setIsRecording(false)
          stopTimer()
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setIsRecording(false)
        stopTimer()
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      startTimer()

    } catch (error: any) {
      console.error('Recording error:', error)
      setMicPermission('denied')
      setIsRecording(false)
      
      let errorMessage = 'Could not access microphone. '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
      
      alert(errorMessage)
    }
  }, [isRunning, onTranscribe])

  const handleStartStopRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const canRecord = micPermission !== 'denied' && !isRunning
  const canExecute = query.trim().length > 0 && !isRunning

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Query Input Section */}
        <div className="lg:col-span-2 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Natural Language Query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Try: 'Show me all optional fees paid by students in Class 6' or 'What are the highest scoring quiz results?'"
            disabled={isRunning}
          />
          
          {/* Character count and suggestions */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{query.length} characters</span>
            {query.length === 0 && (
              <span className="text-blue-600">💡 Try asking about fees, students, quiz results, or issues</span>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-3">
          {/* Recording Button */}
          {!isRecording ? (
            <button
              onClick={handleStartStopRecording}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                canRecord
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canRecord}
              title={micPermission === 'denied' ? 'Microphone access denied' : 'Start voice recording'}
            >
              <span className="text-lg">🎙️</span>
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStartStopRecording}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium animate-pulse shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span className="text-lg">🛑</span>
              Stop Recording ({formatTime(recordingTime)})
            </button>
          )}

          {/* Execute Button */}
          <button
            onClick={onExecute}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              canExecute
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!canExecute}
          >
            <span className="text-lg">⚡</span>
            Generate & Execute SQL
          </button>

          {/* Reset Button (only show when running) */}
          {isRunning && onAbort && (
            <button
              onClick={onAbort}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
              <span className="text-lg">🔄</span>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Model Selection & Status */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">SQL Generation:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={sqlModel}
            onChange={(e) => setSqlModel(e.target.value as LLM)}
            disabled={isRunning}
          >
            <option value="gemini">🤖 Gemini</option>
            <option value="openai">🧠 OpenAI GPT</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Voice Recognition:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={transcribeModel}
            onChange={(e) => setTranscribeModel(e.target.value as LLM)}
            disabled={isRunning || isRecording}
          >
            <option value="gemini">🎵 Gemini Audio</option>
            <option value="openai">🎧 OpenAI Whisper</option>
          </select>
        </div>

        {/* Microphone Status */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-600">Microphone:</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            micPermission === 'granted' 
              ? 'bg-green-100 text-green-700' 
              : micPermission === 'denied'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {micPermission === 'granted' ? '✓ Ready' : micPermission === 'denied' ? '✗ Denied' : '? Unknown'}
          </span>
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording in progress... Speak clearly</span>
            <span className="ml-auto text-sm">{formatTime(recordingTime)}</span>
          </div>
        </div>
      )}
    </div>
  )
}