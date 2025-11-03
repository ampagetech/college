// hooks/useAICoaching.ts

import { useState, useRef, useEffect, useCallback } from "react";
import { Question, UserAnswer } from "@/components/quiz/QuizResultsClient";

// Define a more specific type for the initial context
type CoachingContext = {
  question: Question;
  userAnswer: UserAnswer | undefined;
  session: any;
};

// LLM Provider type
export type LLMProvider = 'gemini' | 'claude' | 'chatgpt';

// Message type
type Message = {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

// Hook
export const useAICoaching = (context: CoachingContext) => {
  const { question, userAnswer, session } = context;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progressStage, setProgressStage] = useState<'idle' | 'listening' | 'transcribing' | 'generating-response' | 'complete'>('idle');
  const [selectedLLM, setSelectedLLM] = useState<LLMProvider>('gemini');
  
  // Keep track of current question to clear conversation when it changes
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Clear conversation when question changes (but don't auto-start)
  useEffect(() => {
    if (question?.question_extract_pk !== currentQuestionId) {
      console.log('Question changed, clearing conversation history');
      setMessages([]);
      setCurrentQuestionId(question?.question_extract_pk || null);
    }
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, [question?.question_extract_pk]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const generateFallbackResponse = useCallback((input: string, q: Question, ua: UserAnswer | undefined) => {
    const correctAnswer = q.answer_a_b_c_d_e_option;
    const selectedAnswer = ua?.selected_answer;
    
    if (!ua?.is_correct && selectedAnswer && correctAnswer) {
      return `I can see why you chose option ${selectedAnswer}, but the correct answer is ${correctAnswer}. The key difference is in understanding the concept. Let me break down why ${correctAnswer} is correct and why ${selectedAnswer} doesn't fully address the question.`;
    } else if (ua?.is_correct && correctAnswer) {
      return `Excellent! You correctly chose option ${correctAnswer}. The key concept here is important for understanding this topic. Would you like me to explain why the other options were incorrect?`;
    }
    return `Let me help you understand this concept better. What specific part would you like me to clarify?`;
  }, []);

  // New function to generate standard explanation prompt
  const generateStandardExplanation = useCallback(() => {
    if (!question || !userAnswer) return "";

    const isCorrect = userAnswer.is_correct;
    const selectedAnswer = userAnswer.selected_answer;
    const correctAnswer = question.answer_a_b_c_d_e_option;

    let prompt = "";
    
    if (!isCorrect && selectedAnswer) {
      prompt = `I selected option ${selectedAnswer} but the correct answer is ${correctAnswer}. Please first explain why my answer (${selectedAnswer}) is incorrect, then provide a complete explanation of this question including why ${correctAnswer} is the correct answer and briefly explain why each of the other options (A, B, C, D) are incorrect.`;
    } else if (isCorrect) {
      prompt = `I correctly answered ${correctAnswer}. Please provide a complete explanation of this question, explaining why ${correctAnswer} is correct and briefly explain why each of the other options are incorrect.`;
    } else {
      prompt = `I didn't attempt this question. Please provide a complete explanation including why ${correctAnswer} is the correct answer and briefly explain why each of the other options (A, B, C, D) are incorrect.`;
    }

    return prompt;
  }, [question, userAnswer]);

  // New function to request standard explanation
  const requestStandardExplanation = useCallback(async () => {
    const explanationPrompt = generateStandardExplanation();
    if (explanationPrompt) {
      await handleSendMessage(explanationPrompt);
    }
  }, [generateStandardExplanation]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = { 
      id: Date.now(), 
      type: 'user', 
      content: textToSend, 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInputText("");
    setIsLoading(true);
    setProgressStage('generating-response');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          llmProvider: selectedLLM,
          context: { question, userAnswer, session },
          history: messages.map(m => ({ type: m.type, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response || generateFallbackResponse(textToSend, question, userAnswer),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateFallbackResponse(textToSend, question, userAnswer),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
      setProgressStage('complete');
      setTimeout(() => setProgressStage('idle'), 1500);
    }
  }, [inputText, selectedLLM, question, userAnswer, session, messages, generateFallbackResponse]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Transcription failed: ${response.statusText}`);

      const data = await response.json();
      if (!data.text) throw new Error('No transcription text received');

      setInputText(data.text);
      await handleSendMessage(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Error transcribing audio. Please try typing your question.');
    } finally {
      setIsProcessing(false);
      setProgressStage('idle');
    }
  }, [handleSendMessage]);

  const startRecording = useCallback(async () => {
    try {
      setProgressStage('listening');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        setProgressStage('transcribing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setProgressStage('idle');
      alert('Microphone access denied or not available. Please type your question instead.');
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleStartStopRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleTextToSpeech = useCallback((text: string) => {
    if (!synthRef.current) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [isSpeaking]);

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    isRecording,
    isProcessing,
    isSpeaking,
    progressStage,
    selectedLLM,
    setSelectedLLM,
    messagesEndRef,
    handleSendMessage,
    handleStartStopRecording,
    handleTextToSpeech,
    requestStandardExplanation // Export the new function
  };
};