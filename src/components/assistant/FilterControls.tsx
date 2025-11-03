// src/components/FilterControls.tsx
import { useFilterStore } from '@/stores/assistant/filterStore';
import { useState } from 'react'; // Removed useEffect and useRef
import TopicDropdown from './TopicDropdown';
import SubjectDropdown from './SubjectDropdown';

interface FilterControlsProps {
  onLessonDetailsChange: (details: { text: { topic_long: string; content: string; activity: string } }) => void;
}

const levelOptions = [
  { display: 'SS-3', value: '12th Grade (High School)' },
  { display: 'SS-2', value: '11th Grade (High School)' },
  { display: 'SS-1', value: '10th Grade (High School)' },
  { display: 'JS-3', value: '9th Grade (High School)' },
  { display: 'JS-2', value: '8th Grade (High School)' },
  { display: 'JS-1', value: '7th Grade (High School)' },
];

export default function FilterControls({ onLessonDetailsChange }: FilterControlsProps) {
  const { level, term, subject, topic, topics, setFilters, fetchTopics } = useFilterStore();
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  type FilterState = {
    level: string;
    term: string;
    subject: string;
    topic: string;
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    if (field === 'level') {
      const selectedOption = levelOptions.find((option) => option.display === value);
      setFilters({ [field]: selectedOption ? selectedOption.value : '' });
      if (topic) setFilters({ topic: '' });
    } else if (field === 'term') {
      setFilters({ [field]: value });
      if (topic) setFilters({ topic: '' });
    } else if (field === 'subject') {
      setFilters({ [field]: value });
      if (topic) setFilters({ topic: '' });
      if (value && level && term) {
        setIsLoadingTopics(true);
        fetchTopics(level, term, value)
          .then(() => console.log('Topics fetched successfully'))
          .catch((error) => console.error('Error fetching topics:', error))
          .finally(() => setIsLoadingTopics(false));
      }
    } else if (field === 'topic') {
      setFilters({ [field]: value });
      // Assuming TopicDropdown provides lesson details via onLessonDetailsChange
      // We’ll trigger it here with a placeholder until TopicDropdown is updated
      if (value && level && term && subject) {
        onLessonDetailsChange({
          text: {
            topic_long: value, // Replace with actual topic_long from TopicDropdown if available
            content: '', // Placeholder; ideally from TopicDropdown or API
            activity: '', // Placeholder; ideally from TopicDropdown or API
          },
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <label htmlFor="level" className="block text-sm font-medium">Level</label>
          <select
            id="level"
            value={levelOptions.find((option) => option.value === level)?.display || ''}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Level</option>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.display}>
                {option.display}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="term" className="block text-sm font-medium">Term</label>
          <select
            id="term"
            value={term}
            onChange={(e) => handleFilterChange('term', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Term</option>
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="3rd Term">3rd Term</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="subject" className="block text-sm font-medium">Subject</label>
          <SubjectDropdown
            value={subject}
            onSubjectChange={(id, name) => handleFilterChange('subject', name)}
          />
        </div>

        <div className="flex-1">
          <label htmlFor="topic" className="block text-sm font-medium">Topic</label>
          <TopicDropdown
            value={topic}
            onChange={(value) => handleFilterChange('topic', value)}
            onLessonDetailsChange={onLessonDetailsChange} // Pass callback to TopicDropdown
            topics={topics}
            isLoading={isLoadingTopics}
          />
        </div>
      </div>
    </div>
  );
}