// src/components/assistant/ContentTab.tsx
import { useState, useEffect } from 'react';
import { usePromptStore } from '@/stores/assistant/promptStore';
import { useResponseStore } from '@/stores/assistant/responseStore';
import { useQuestionStore } from '@/stores/assistant/questionStore';
import { useVideoStore } from '@/stores/assistant/videoStore';
import { useFilterStore } from '@/stores/assistant/filterStore';
import YoutubeMediaBuilder from '@/components/assistant/YoutubeMediaBuilder';
import VideoCardDisplay from '@/components/assistant/VideoCardDisplay';
import { ResponseFormatter } from '@/components/assistant/ResponseFormatter';

interface ContentTabProps {
  tabType: 'response' | 'videos' | 'questions';
  selectedLLM: 'chatgpt' | 'gemini' | 'deepseek';
  buttonLabel: string;
  apiKey?: string | null;
}

const ContentTab = ({ tabType, selectedLLM, buttonLabel, apiKey }: ContentTabProps) => {
  const { prompt } = usePromptStore();
  const { response, error: responseError, setResponse, setError: setResponseError, clear: clearResponse } = useResponseStore();
  const { questions, error: questionsError, setQuestions, setError: setQuestionsError, clear: clearQuestions } = useQuestionStore();
  const { videos, clear: clearVideos } = useVideoStore();
  const { subject, topic, level } = useFilterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [videosError, setVideosError] = useState<string>('');
  
  // TTS state management
  const [isReading, setIsReading] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [readingMode, setReadingMode] = useState<'continuous' | 'paragraph'>('paragraph');

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }

    // Cleanup function to stop any ongoing speech
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    console.log(`Clearing ${tabType} store due to topic change:`, topic);
    switch (tabType) {
      case 'response':
        clearResponse();
        break;
      case 'videos':
        clearVideos();
        break;
      case 'questions':
        clearQuestions();
        break;
    }
  }, [topic, tabType, clearResponse, clearVideos, clearQuestions]);

  const getContent = () => {
    console.log(`Getting content for ${tabType}:`, { response, videos, questions });
    switch (tabType) {
      case 'response':
        return response;
      case 'videos':
        return videos;
      case 'questions':
        return questions;
      default:
        return '';
    }
  };

  const getError = () => {
    switch (tabType) {
      case 'response':
        return responseError;
      case 'videos':
        return videosError;
      case 'questions':
        return questionsError;
      default:
        return '';
    }
  };

  const setError = (message: string) => {
    switch (tabType) {
      case 'response':
        setResponseError(message);
        break;
      case 'videos':
        setVideosError(message);
        break;
      case 'questions':
        setQuestionsError(message);
        break;
    }
  };

  // Function to remove week pattern from content
  const processContent = (content: string) => {
    if (!content) return '';
    
    // More comprehensive regex to catch all Wk_ patterns in different contexts
    // This handles:
    // 1. Plain text starting with Wk_XX:
    // 2. Headings with markdown (# or ## or ###) followed by Wk_XX:
    // 3. Bold text (**Wk_XX:**) 
    // 4. Any line containing Wk_XX: pattern
    
    let processed = content;
    
    // Remove from Markdown headings (# Wk_XX:, ## Wk_XX:, etc.)
    processed = processed.replace(/(^|\n)(#{1,6})\s*Wk_\d+:\s*/gm, '$1$2 ');
    
    // Remove from bold text (**Wk_XX:**)
    processed = processed.replace(/\*\*Wk_\d+:\*\*/g, '');
    processed = processed.replace(/\*\*Wk_\d+:\s*/g, '**');
    
    // Remove from beginning of paragraphs
    processed = processed.replace(/(^|\n)Wk_\d+:\s*/gm, '$1');
    
    return processed;
  };

  // Function to split content into paragraphs
  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    
    // Split by double newlines or single newlines followed by certain patterns
    let paragraphs = text
      .split(/\n\s*\n|\n(?=[A-Z]|\d+\.|\*|\-|#)/) // Split on double newlines or before new sections
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Further split very long paragraphs (over 500 characters) at sentence boundaries
    const splitLongParagraphs: string[] = [];
    
    paragraphs.forEach(paragraph => {
      if (paragraph.length > 500) {
        // Split at sentence boundaries for long paragraphs
        const sentences = paragraph.match(/[^\.!?]+[\.!?]+/g) || [paragraph];
        let currentChunk = '';
        
        sentences.forEach(sentence => {
          if (currentChunk.length + sentence.length > 500 && currentChunk.length > 0) {
            splitLongParagraphs.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        });
        
        if (currentChunk.trim().length > 0) {
          splitLongParagraphs.push(currentChunk.trim());
        }
      } else {
        splitLongParagraphs.push(paragraph);
      }
    });
    
    return splitLongParagraphs;
  };

  // Function to clean text for speech synthesis (remove markdown formatting)
  const cleanTextForSpeech = (text: string) => {
    if (!text) return '';
    
    let cleanText = text;
    
    // Remove markdown formatting
    cleanText = cleanText.replace(/#{1,6}\s*/g, ''); // Remove heading markers
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
    cleanText = cleanText.replace(/`(.*?)`/g, '$1'); // Remove inline code markers
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
    cleanText = cleanText.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Remove links, keep text
    cleanText = cleanText.replace(/^\s*[-*+]\s+/gm, ''); // Remove list markers
    cleanText = cleanText.replace(/^\s*\d+\.\s+/gm, ''); // Remove numbered list markers
    cleanText = cleanText.replace(/\n{2,}/g, '\n'); // Replace multiple newlines with single
    cleanText = cleanText.replace(/\n/g, ' '); // Replace newlines with spaces
    cleanText = cleanText.replace(/\s{2,}/g, ' '); // Replace multiple spaces with single
    cleanText = cleanText.trim();
    
    return cleanText;
  };

  // Function to read a specific paragraph
  const readParagraph = (paragraphIndex: number) => {
    if (!speechSynthesis || !paragraphs[paragraphIndex]) return;

    const textToRead = cleanTextForSpeech(paragraphs[paragraphIndex]);
    if (!textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Configure speech settings
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      if (readingMode === 'paragraph') {
        // Pause after each paragraph in paragraph mode
        setIsReading(false);
        setIsPaused(true);
        
        // Check if there are more paragraphs
        if (paragraphIndex < paragraphs.length - 1) {
          setCurrentParagraph(paragraphIndex + 1);
        } else {
          // Reset if we've reached the end
          setCurrentParagraph(0);
          setIsPaused(false);
        }
      } else {
        // Continuous mode - move to next paragraph automatically
        if (paragraphIndex < paragraphs.length - 1) {
          setCurrentParagraph(paragraphIndex + 1);
          // Small delay before next paragraph
          setTimeout(() => {
            readParagraph(paragraphIndex + 1);
          }, 500);
        } else {
          setIsReading(false);
          setCurrentParagraph(0);
        }
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      setIsPaused(false);
      setError('An error occurred while reading the text.');
    };

    speechSynthesis.speak(utterance);
  };

  // Main read aloud handler
  const handleReadAloud = () => {
    if (!speechSynthesis) {
      setError('Text-to-speech is not supported in your browser.');
      return;
    }

    const content = getProcessedContent();
    if (!content) {
      setError('No content available to read. Please generate content first.');
      return;
    }

    if (isReading) {
      // Stop reading
      speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    if (isPaused && paragraphs.length > 0) {
      // Continue reading from current paragraph
      readParagraph(currentParagraph);
      return;
    }

    // Start new reading session
    const paragraphsToRead = splitIntoParagraphs(content);
    setParagraphs(paragraphsToRead);
    setCurrentParagraph(0);

    if (readingMode === 'paragraph') {
      // Read paragraph by paragraph
      readParagraph(0);
    } else {
      // Read continuously
      const textToRead = cleanTextForSpeech(content);
      if (!textToRead.trim()) {
        setError('No readable text found in the content.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Configure speech settings
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Event handlers
      utterance.onstart = () => {
        setIsReading(true);
      };

      utterance.onend = () => {
        setIsReading(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        setError('An error occurred while reading the text.');
      };

      speechSynthesis.speak(utterance);
    }
  };

  // Toggle reading mode
  const toggleReadingMode = () => {
    if (isReading) return; // Don't change mode while reading
    
    setReadingMode(prev => prev === 'paragraph' ? 'continuous' : 'paragraph');
    setIsPaused(false);
    setCurrentParagraph(0);
  };

  // Skip to previous paragraph
  const skipToPrevious = () => {
    if (currentParagraph > 0 && speechSynthesis) {
      speechSynthesis.cancel();
      setCurrentParagraph(currentParagraph - 1);
      setIsReading(false);
      setIsPaused(true);
    }
  };

  // Skip to next paragraph
  const skipToNext = () => {
    if (currentParagraph < paragraphs.length - 1 && speechSynthesis) {
      speechSynthesis.cancel();
      setCurrentParagraph(currentParagraph + 1);
      setIsReading(false);
      setIsPaused(true);
    }
  };

  const handleGenerateContent = async () => {
    if (!prompt) {
      setError('No prompt available. Please generate a prompt first.');
      return;
    }

    // Check if API key is available for Gemini
    if (selectedLLM === 'gemini' && !apiKey) {
      setError('API key not available. Please check your configuration.');
      return;
    }

    if (tabType === 'videos') {
      return; // Handled by YoutubeMediaBuilder
    }

    setIsLoading(true);
    try {
      const apiEndpoint = '/api/llm';
      let modifiedPrompt = prompt;

      if (tabType === 'questions') {
        if (!response) {
          setError('Please generate a response first in the "Response" tab to provide context for questions.');
          setIsLoading(false);
          return;
        }
        modifiedPrompt = `${prompt}\n\nNow, using the above prompt and the following lesson content, generate at least 5 practice questions:\n"${response}"\nStructure as:\n1. Basic Questions\n2. Application Questions\n3. Critical Thinking Questions\nInclude answers where appropriate.`;
      }

      const payload = {
        prompt: modifiedPrompt,
        topic: topic || 'General',
        subject: subject || 'General',
        model: selectedLLM,
      };

      console.log(`${tabType} payload:`, JSON.stringify(payload, null, 2));

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Use the apiKey prop instead of storedApiKey from store
      if (selectedLLM === 'gemini' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const fetchResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        console.log(`${tabType} API error response:`, JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error?.message || `Failed to fetch ${tabType}`);
      }

      const data = await fetchResponse.json();
      console.log(`${tabType} API success response:`, JSON.stringify(data, null, 2));

      // Process the content to remove week patterns before storing
      const processedResponse = processContent(data.response);

      switch (tabType) {
        case 'response':
          setResponse(processedResponse);
          break;
        case 'questions':
          setQuestions(processedResponse);
          break;
      }
    } catch (err) {
      console.error(`${tabType} Fetch error:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch ${tabType}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure existing content is also processed for display
  const getProcessedContent = () => {
    const content = getContent();
    return content ? processContent(content) : '';
  };

  // Check if content exists for TTS functionality
  const hasContent = () => {
    const content = getProcessedContent();
    return content && content.trim().length > 0;
  };

  return (
    <div className="space-y-4">
      {tabType === 'videos' ? (
        <YoutubeMediaBuilder
          textContent={response}
          level={level || 'General'}
          subjectName={subject || 'General'}
          topic={topic || 'General'}
          onSearchStart={() => setIsLoading(true)}
          onVideosGenerated={() => setIsLoading(false)}
        />
      ) : (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            {tabType === 'response' ? 'AI Response' : 'Practice Questions'}
          </h2>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center"
              onClick={handleGenerateContent}
              disabled={isLoading || (selectedLLM === 'gemini' && !apiKey)}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                buttonLabel
              )}
            </button>

            {/* TTS Controls - Only show for response and questions tabs */}
            {(tabType === 'response' || tabType === 'questions') && (
              <div className="flex items-center space-x-2">
                {/* Reading Mode Toggle */}
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    readingMode === 'paragraph' 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={toggleReadingMode}
                  disabled={isReading}
                  title={`Switch to ${readingMode === 'paragraph' ? 'continuous' : 'paragraph-by-paragraph'} reading`}
                >
                  {readingMode === 'paragraph' ? '¶' : '▶▶'}
                </button>

                {/* Previous Paragraph Button */}
                {readingMode === 'paragraph' && paragraphs.length > 0 && (
                  <button
                    className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:bg-gray-300"
                    onClick={skipToPrevious}
                    disabled={currentParagraph === 0 || (!isReading && !isPaused)}
                    title="Previous paragraph"
                  >
                    ⏮
                  </button>
                )}

                {/* Main Read Aloud Button */}
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center"
                  onClick={handleReadAloud}
                  disabled={!hasContent() || !speechSynthesis}
                  title={
                    !hasContent() 
                      ? 'Generate content first to enable read aloud' 
                      : isReading 
                        ? 'Stop reading' 
                        : isPaused 
                          ? 'Continue reading from current paragraph'
                          : 'Start reading aloud'
                  }
                >
                  {isReading ? (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                      Stop
                    </>
                  ) : isPaused ? (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon points="5,3 19,12 5,21"></polygon>
                      </svg>
                      Continue
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                      Read Aloud
                    </>
                  )}
                </button>

                {/* Next Paragraph Button */}
                {readingMode === 'paragraph' && paragraphs.length > 0 && (
                  <button
                    className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:bg-gray-300"
                    onClick={skipToNext}
                    disabled={currentParagraph === paragraphs.length - 1 || (!isReading && !isPaused)}
                    title="Next paragraph"
                  >
                    ⏭
                  </button>
                )}

                {/* Progress Indicator */}
                {readingMode === 'paragraph' && paragraphs.length > 0 && (isReading || isPaused) && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                    {currentParagraph + 1}/{paragraphs.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {getError() && <p className="text-red-500">{getError()}</p>}

      {isLoading && tabType !== 'videos' ? (
        <div className="text-center text-gray-500">Loading {tabType}...</div>
      ) : getContent() ? (
        <div className="prose max-w-none">
          {tabType === 'videos' ? (
            <VideoCardDisplay videoContent={getContent()} />
          ) : (
            <ResponseFormatter text={getProcessedContent()} />
          )}
        </div>
      ) : (
        <div className="text-gray-500">Click &quot;{buttonLabel}&quot; to see the {tabType} content.</div>
      )}
    </div>
  );
};

export default ContentTab;