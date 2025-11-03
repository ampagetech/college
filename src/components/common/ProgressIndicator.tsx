'use client'

import { useEffect, useState } from 'react'

type QueryStage = 'idle' | 'listening' | 'transcribing' | 'generating-sql' | 'querying' | 'complete'

interface ProgressIndicatorProps {
  isRunning: boolean
  message?: string
  stage: QueryStage
  className?: string
}

export default function ProgressIndicator({ 
  isRunning, 
  message, 
  stage, 
  className = '' 
}: ProgressIndicatorProps) {
  const [dots, setDots] = useState('')
  const [progress, setProgress] = useState(0)

  // Animated dots effect
  useEffect(() => {
    if (!isRunning) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.'
        if (prev === '.') return '..'
        if (prev === '..') return '...'
        return ''
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isRunning])

  // Progress bar animation
  useEffect(() => {
    if (!isRunning) {
      setProgress(0)
      return
    }

    const getProgressByStage = () => {
      switch (stage) {
        case 'listening': return 25
        case 'transcribing': return 50
        case 'generating-sql': return 75
        case 'querying': return 90
        case 'complete': return 100
        default: return 0
      }
    }

    const targetProgress = getProgressByStage()
    setProgress(targetProgress)
  }, [isRunning, stage])

  const getStageIcon = () => {
    switch (stage) {
      case 'listening': return '🎙️'
      case 'transcribing': return '✍️'
      case 'generating-sql': return '🧠'
      case 'querying': return '🔍'
      case 'complete': return '✅'
      default: return '⏳'
    }
  }

  const getStageColor = () => {
    switch (stage) {
      case 'listening': return 'text-blue-600'
      case 'transcribing': return 'text-purple-600'
      case 'generating-sql': return 'text-orange-600'
      case 'querying': return 'text-green-600'
      case 'complete': return 'text-green-700'
      default: return 'text-gray-600'
    }
  }

  const getProgressBarColor = () => {
    switch (stage) {
      case 'listening': return 'bg-blue-500'
      case 'transcribing': return 'bg-purple-500'
      case 'generating-sql': return 'bg-orange-500'
      case 'querying': return 'bg-green-500'
      case 'complete': return 'bg-green-600'
      default: return 'bg-gray-500'
    }
  }

  if (!isRunning && stage !== 'complete') return null

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-2xl animate-pulse">
          {getStageIcon()}
        </span>
        <div className="flex-1">
          <p className={`font-medium ${getStageColor()}`}>
            {message || 'Processing'}{dots}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stage === 'listening' && 'Waiting for voice input...'}
            {stage === 'transcribing' && 'Converting speech to text...'}
            {stage === 'generating-sql' && 'Creating SQL query from your request...'}
            {stage === 'querying' && 'Executing query against database...'}
            {stage === 'complete' && 'Task completed successfully!'}
          </p>
        </div>
        <div className="text-sm font-medium text-gray-600">
          {progress}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        >
          {/* Animated shimmer effect */}
          {isRunning && (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white via-transparent opacity-30 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between mt-2 text-xs">
        <span className={stage === 'listening' ? getStageColor() : 'text-gray-400'}>
          Listen
        </span>
        <span className={stage === 'transcribing' ? getStageColor() : 'text-gray-400'}>
          Transcribe
        </span>
        <span className={stage === 'generating-sql' ? getStageColor() : 'text-gray-400'}>
          Generate
        </span>
        <span className={stage === 'querying' ? getStageColor() : 'text-gray-400'}>
          Execute
        </span>
        <span className={stage === 'complete' ? getStageColor() : 'text-gray-400'}>
          Complete
        </span>
      </div>
    </div>
  )
}