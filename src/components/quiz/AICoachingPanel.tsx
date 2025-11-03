"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Bot, User, Send, Mic, MicOff, Volume2, VolumeX, Loader2, BookOpen, MessageSquare
} from "lucide-react";
import { useAICoaching, LLMProvider } from "@/hooks/useAICoaching";
import { Question, UserAnswer } from "./QuizResultsClient"; // Adjust import path as needed

// Progress Indicator Component
const ProgressIndicator = ({ stage }: { stage: 'idle' | 'listening' | 'transcribing' | 'generating-response' | 'complete' }) => {
  const stageInfo = {
    listening: { icon: '🎤', title: 'Listening...', desc: 'Speak your question now.', color: 'text-red-600' },
    transcribing: { icon: '🔄', title: 'Processing Speech...', desc: 'Converting your voice to text.', color: 'text-amber-600' },
    'generating-response': { icon: '🧠', title: 'AI is Thinking...', desc: 'Generating a helpful response.', color: 'text-blue-600' },
    complete: { icon: '✅', title: 'Complete!', desc: 'Response ready.', color: 'text-green-600' },
    idle: null
  }[stage];

  if (!stageInfo) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
      <span className="text-lg">{stageInfo.icon}</span>
      <div>
        <div className={`font-medium ${stageInfo.color}`}>{stageInfo.title}</div>
        <div className="text-gray-600 text-xs">{stageInfo.desc}</div>
      </div>
    </div>
  );
};

// Welcome/Empty State Component
const WelcomeState = ({ onRequestExplanation, isLoading }: { onRequestExplanation: () => void; isLoading: boolean }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
    <Bot className="h-16 w-16 text-blue-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Tutor Ready</h3>
    <p className="text-gray-600 mb-6 max-w-sm">
      Get a detailed explanation of this question or ask me anything about the topic.
    </p>
    <div className="space-y-3">
      <Button 
        onClick={onRequestExplanation}
        disabled={isLoading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
        Get Standard Explanation
      </Button>
      <p className="text-xs text-gray-500">
        Or type your own question below
      </p>
    </div>
  </div>
);

// Main Component
interface AICoachingPanelProps {
  question: Question;
  userAnswer: UserAnswer | undefined;
  session: any;
  onClose: () => void;
}

const AICoachingPanel: React.FC<AICoachingPanelProps> = ({ question, userAnswer, session, onClose }) => {
  const {
    messages, inputText, setInputText, isLoading, isRecording, isProcessing, isSpeaking,
    progressStage, selectedLLM, setSelectedLLM, messagesEndRef,
    handleSendMessage, handleStartStopRecording, handleTextToSpeech, requestStandardExplanation
  } = useAICoaching({ question, userAnswer, session });

  const llmOptions: { id: LLMProvider; name: string; icon: string; }[] = [
    { id: 'gemini', name: 'Gemini', icon: '🔷' },
    { id: 'claude', name: 'Claude', icon: '🟠' },
    { id: 'chatgpt', name: 'ChatGPT', icon: '🟢' },
  ];

  const hasMessages = messages.length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">AI Tutor</span>
          <select
            value={selectedLLM}
            onChange={(e) => setSelectedLLM(e.target.value as LLMProvider)}
            className="text-xs px-2 py-1 border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading || isRecording || isProcessing}
          >
            {llmOptions.map(llm => <option key={llm.id} value={llm.id}>{llm.icon} {llm.name}</option>)}
          </select>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>×</Button>
      </div>

      {progressStage !== 'idle' && <div className="p-2 border-b"><ProgressIndicator stage={progressStage} /></div>}
      
      {/* Messages or Welcome State */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!hasMessages ? (
          <WelcomeState onRequestExplanation={requestStandardExplanation} isLoading={isLoading} />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'ai' && <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mb-2" />}
                <div className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.type === 'ai' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTextToSpeech(msg.content)}>
                        {isSpeaking ? <VolumeX className="h-3 w-3 text-red-500" /> : <Volume2 className="h-3 w-3 text-blue-500" />}
                      </Button>
                      <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && !messages.some(m => m.id > Date.now() - 500) && (
              <div className="flex items-end gap-2 justify-start">
                <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mb-2" />
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Action Buttons (shown when there are messages) */}
      {hasMessages && (
        <div className="px-3 py-2 border-t bg-gray-50">
          <Button
            onClick={requestStandardExplanation}
            disabled={isLoading || isRecording || isProcessing}
            variant="outline"
            size="sm"
            className="w-full mb-2 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BookOpen className="h-3 w-3" />
            )}
            Get Another Explanation
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask anything..." disabled={isLoading || isRecording || isProcessing}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleStartStopRecording} variant={isRecording ? "destructive" : "outline"} size="icon" disabled={isLoading || isProcessing}>
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={() => handleSendMessage()} size="icon" disabled={isLoading || isRecording || isProcessing || !inputText.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 h-4">
          {isRecording && <span className="text-red-500 flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>Recording...</span>}
          {isProcessing && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Processing...</span>}
        </div>
      </div>
    </div>
  );
};

export default AICoachingPanel;