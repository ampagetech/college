import { useResponseStore } from '@/stores/assistant/responseStore';

interface PromptTabProps {
  className?: string;
}

export function PromptTab({ className }: PromptTabProps) {
  const { prompt, setPrompt } = useResponseStore();

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <textarea
        value={prompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your prompt here..."
      />
    </div>
  );
}