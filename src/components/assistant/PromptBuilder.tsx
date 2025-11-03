// src/components/PromptBuilder.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";

// Define the valid grade levels as a union type
type GradeLevel = "JSS-1" | "JSS-2" | "JSS-3" | "SS-1" | "SS-2" | "SS-3";

interface PromptBuilderProps {
  level: GradeLevel; // Restrict level to specific grade levels
  subjectName: string;
  topic: string;
  promptType: string;
  onPromptChange: (prompt: string) => void;
}

const PromptBuilder = ({
  level,
  subjectName,
  topic,
  promptType,
  onPromptChange,
}: PromptBuilderProps) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isAutoPrompt, setIsAutoPrompt] = useState(true);
  const [error, setError] = useState<string>("");

  // Grade level mapping for US equivalent grades, memoized to prevent re-creation
  const gradeMap = useMemo((): Record<GradeLevel, string> => ({
    "JSS-1": "7th Grade (Middle School)",
    "JSS-2": "8th Grade (Middle School)",
    "JSS-3": "9th Grade (High School)",
    "SS-1": "10th Grade (High School)",
    "SS-2": "11th Grade (High School)",
    "SS-3": "12th Grade (High School)",
  }), []); // Empty dependency array since gradeMap is static

  // Wrap buildPromptTemplate in useCallback with all dependencies
  const buildPromptTemplate = useCallback(() => {
    // Only proceed if all required fields are filled
    if (!level || !subjectName || !topic) {
      setError("Please complete all selections first");
      return "";
    }

    setError("");

    // Convert Nigerian school level to US grade equivalent
    const gradeLevel = gradeMap[level] || level;

    // Fix the base prompt to avoid redundancy and be more specific
    const basePrompt = `As an experienced educator teaching ${subjectName} at ${gradeLevel} level, `;

    const promptTemplates = {
      Explanation: `${basePrompt}explain the topic "${topic}". Include fundamental concepts and clear examples that are appropriate for this grade level.`,

      Context: `${basePrompt}provide real-world context and practical applications for "${topic}". Use examples that ${gradeLevel} students can relate to.`,

      Example: `${basePrompt}provide detailed examples and practice problems about "${topic}". Include step-by-step solutions suitable for this grade level.`,

      Application: `${basePrompt}demonstrate how "${topic}" is applied in real-life situations. Include hands-on activities or experiments that help students understand the concept better.`,

      Question: `${basePrompt}create a set of assessment questions about "${topic}". Include a mix of:
1. Basic understanding questions
2. Application-based problems
3. Critical thinking challenges
All questions should be appropriate for this grade level.`,
    };

    return promptTemplates[promptType as keyof typeof promptTemplates] || promptTemplates.Explanation;
  }, [level, subjectName, topic, promptType, gradeMap]);

  // Trigger prompt generation when dependencies change
  useEffect(() => {
    if (topic && isAutoPrompt) {
      const generatedPrompt = buildPromptTemplate();
      setPrompt(generatedPrompt);
      onPromptChange(generatedPrompt);
    }
  }, [topic, level, subjectName, promptType, isAutoPrompt, onPromptChange, buildPromptTemplate]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsAutoPrompt(false);
    setPrompt(e.target.value);
    onPromptChange(e.target.value);
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {isAutoPrompt ? "Auto-generated prompt" : "Custom prompt"}
            </span>
            <button
              onClick={() => {
                setIsAutoPrompt(true);
                const generatedPrompt = buildPromptTemplate();
                setPrompt(generatedPrompt);
                onPromptChange(generatedPrompt);
              }}
              className="text-sm text-blue-500 hover:text-blue-700"
              type="button"
            >
              Reset to auto
            </button>
          </div>
          <Textarea
            value={prompt}
            onChange={handlePromptChange}
            rows={3}
            placeholder={!topic ? "Select a topic to generate prompt..." : "Your prompt will appear here based on the topic..."}
            className="w-full resize-y"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptBuilder;