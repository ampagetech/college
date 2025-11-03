"use client";

import { useEffect, useRef } from 'react';
import { useQuizStore } from "@/stores/quiz/quizStore";

export default function QuizTimer() {
  // Get timer-related state from the store
  const { quizData, decrementRemainingTime, setTimeUp } = useQuizStore();
  const { remainingTime, isTimeUp } = quizData;
  
  // Ref to store the interval ID
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Only start the timer if we have remaining time and the timer is not already up
    if (remainingTime > 0 && !isTimeUp) {
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Start a new interval
      timerIntervalRef.current = setInterval(() => {
        decrementRemainingTime();
      }, 1000);
    } else if (remainingTime <= 0 && !isTimeUp) {
      // If time is up but the flag isn't set, set it
      setTimeUp();
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [remainingTime, isTimeUp, decrementRemainingTime, setTimeUp]);

  const getTimeColor = () => {
    if (remainingTime < 60) return 'text-red-800 bg-red-100';
    if (remainingTime < 300) return 'text-orange-800 bg-orange-100';
    return 'text-blue-800 bg-blue-100';
  };

  return (
    <div className={`${getTimeColor()} px-4 py-2 rounded-lg font-semibold text-lg shadow-sm flex items-center gap-2`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Remains: {formatTime(remainingTime)}</span>
    </div>
  );
}