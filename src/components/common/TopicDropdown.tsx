// src/components/TopicDropdown.tsx
"use client";

interface Topic {
  id: string;
  name: string;
  topic_long: string;
  content: string;
  activity: string;
}

interface LessonDetails {
  text: {
    topic_long: string;
    content: string;
    activity: string;
  };
}

interface TopicDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onLessonDetailsChange: (details: LessonDetails) => void;
  topics: Topic[];
  isLoading: boolean;
}

export default function TopicDropdown({
  value,
  onChange,
  onLessonDetailsChange,
  topics,
  isLoading,
}: TopicDropdownProps) {
  const handleTopicChange = (newValue: string) => {
    onChange(newValue);
    // Find the selected topic and call onLessonDetailsChange with its details
    const selectedTopic = topics.find((topic) => topic.name === newValue);
    if (selectedTopic) {
      onLessonDetailsChange({
        text: {
          topic_long: selectedTopic.topic_long,
          content: selectedTopic.content,
          activity: selectedTopic.activity,
        },
      });
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => handleTopicChange(e.target.value)}
      disabled={isLoading || topics.length === 0}
      className="p-2 border rounded w-full bg-white dark:bg-gray-800"
    >
      <option value="">{isLoading ? "Loading..." : "Select Topic"}</option>
      {Array.isArray(topics) &&
        topics.map((topic) => (
          <option key={topic.id} value={topic.name}>
            {topic.name}
          </option>
        ))}
    </select>
  );
}