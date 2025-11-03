import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { useCallback } from 'react';

interface PromptContentProps {
  content: string;
  isLoading: boolean;
  onChange?: (value: string) => void;
  level?: string;
  subjectName?: string;
  topic?: string;
  topicLong?: string;
  lessonContent?: string;
  activity?: string;
  buttonLabels: {
    generate: string;
    reset: string;
    clear: string;
  };
  selectedLLM: 'chatgpt' | 'gemini' | 'deepseek';
  onGenerate?: () => Promise<void>;
  onGenerateReady?: (fn: () => Promise<void>) => void;
}

const gradeMap: Record<string, { grade: string; complexity: string }> = {
  'Primary 1': { grade: 'Primary 1', complexity: 'basic foundational concepts' },
  'Primary 2': { grade: 'Primary 2', complexity: 'fundamental principles' },
  'Primary 3': { grade: 'Primary 3', complexity: 'intermediate concepts' },
  'Primary 4': { grade: 'Primary 4', complexity: 'advanced fundamentals' },
  'Primary 5': { grade: 'Primary 5', complexity: 'complex principles' },
  'Primary 6': { grade: 'Primary 6', complexity: 'advanced concepts' },
  'JSS 1': { grade: 'Junior Secondary 1', complexity: 'junior secondary concepts' },
  'JSS 2': { grade: 'Junior Secondary 2', complexity: 'intermediate secondary principles' },
  'JSS 3': { grade: 'Junior Secondary 3', complexity: 'advanced junior secondary concepts' },
  'SSS 1': { grade: 'Senior Secondary 1', complexity: 'senior secondary foundations' },
  'SSS 2': { grade: 'Senior Secondary 2', complexity: 'advanced secondary concepts' },
  'SSS 3': { grade: 'Senior Secondary 3', complexity: 'complex senior secondary principles' }
};

export function PromptContent({
  content, 
  isLoading,
  onChange,
  buttonLabels,
  level,
  subjectName,
  topic,
  topicLong,
  lessonContent,
  activity
}: PromptContentProps) {
  const [isAutoPrompt, setIsAutoPrompt] = useState(true);
  const [error, setError] = useState<string>("");
  const [prompt, setPrompt] = useState(content);
  const [safetyContext, setSafetyContext] = useState({
    level,
    subject: subjectName,
    originalTopic: topic
  });
  
  // Using useRef to prevent the function itself from causing 
  // re-renders when used in the dependency array
  // const buildPromptRef = useRef<() => string>();
  const buildPromptRef = useRef<(() => string) | undefined>(undefined);
  
  // Set up the function only once and update its internal references
  useEffect(() => {
    buildPromptRef.current = () => {
      if (!level || !subjectName || !topic) {
        return "";
      }

      const gradeInfo = gradeMap[level] || { grade: level, complexity: "appropriate concepts" };
      
      return `As an educational AI tutor for ${gradeInfo.grade} (${level}) students, focusing on ${subjectName}, please provide a comprehensive lesson on:

TOPIC: ${topicLong || topic}

CONTEXT FROM CURRICULUM:
${lessonContent || "Based on the curriculum requirements"}

PLANNED ACTIVITIES:
${activity || "Following educational guidelines"}

Please structure your response to include:

1. CORE EXPLANATION:
   - Focus on ${gradeInfo.complexity}
   - Break down the topic into manageable parts
   - Use age-appropriate language and examples
   - Define key terms clearly

2. REAL-WORLD APPLICATIONS:
   - Connect to students' daily experiences
   - Show practical relevance
   - Consider local and global contexts

3. GUIDED EXAMPLES:
   - Start with simple examples
   - Progress to more challenging ones
   - Include step-by-step explanations

4. PRACTICAL ACTIVITIES:
   - Suggest safe, supervised exercises
   - Include necessary safety precautions
   - List required materials
   - Consider classroom environment

SAFETY AND APPROPRIATENESS:
- Keep content age-appropriate
- Follow educational guidelines
- Maintain focus on ${subjectName} curriculum
- Ensure all activities are classroom-safe

Please maintain academic focus and educational appropriateness throughout.`;
    };
  }, [level, subjectName, topic, topicLong, lessonContent, activity]);

  // Simplified version that uses the ref
  const buildComprehensivePrompt = useCallback(() => {
    return buildPromptRef.current?.() || "";
  }, []);

  const handleClear = () => {
    setPrompt('');
    setIsAutoPrompt(false);
    onChange?.('');
    setError('');
  };

  const handleRestore = () => {
    if (!level || !subjectName || !topic) {
      setError("Please complete all selections first");
      return;
    }
    
    setError('');
    const generatedPrompt = buildComprehensivePrompt();
    setPrompt(generatedPrompt);
    setIsAutoPrompt(true);
    onChange?.(generatedPrompt);
  };

  useEffect(() => {
    setSafetyContext({ level, subject: subjectName, originalTopic: topic });
  }, [level, subjectName, topic]);

  useEffect(() => {
    setSafetyContext({ level, subject: subjectName, originalTopic: topic });
  }, [level, subjectName, topic]);
  
  const prevPrompt = useRef<string | null>(null);
  
  useEffect(() => {
    if (!topic || !isAutoPrompt || !level || !subjectName) {
      return;
    }
  
    const generatedPrompt = buildComprehensivePrompt();
  
    if (prevPrompt.current !== generatedPrompt) {
      setError('');
      setPrompt(generatedPrompt);
      onChange?.(generatedPrompt);
      prevPrompt.current = generatedPrompt;
    }
  }, [topic, level, subjectName, isAutoPrompt, onChange, buildComprehensivePrompt]);
  

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setIsAutoPrompt(false);
    
    if (!newPrompt.toLowerCase().includes(safetyContext.subject?.toLowerCase() || '') ||
        !newPrompt.toLowerCase().includes(safetyContext.originalTopic?.toLowerCase() || '')) {
      setError("Please maintain focus on the selected subject and topic. For other subjects or topics, please use the topic selector.");
    } else {
      setError("");
    }
    
    setPrompt(newPrompt);
    onChange?.(newPrompt);
  };

  if (isLoading) {
    return <div>Loading prompt content...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Prompt</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading}
          >
            {buttonLabels.clear}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRestore}
            disabled={isLoading}
          >
            {buttonLabels.reset}
          </Button>
        </div>
      </div>
      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {safetyContext.subject && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          <p>Subject: {safetyContext.subject}</p>
          <p>Grade Level: {gradeMap[safetyContext.level || '']?.grade || safetyContext.level}</p>
          <p>Topic: {safetyContext.originalTopic}</p>
        </div>
      )}

      <Textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter your prompt here..."
        className="min-h-[400px] w-full whitespace-pre-wrap font-mono text-sm leading-relaxed p-4"
      />
    </div>
  );
}