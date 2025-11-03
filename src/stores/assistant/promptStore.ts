// src/store/promptStore.ts
import { create } from 'zustand';

interface PromptState {
  prompt: string;
  error: string;
}

interface PromptActions {
  setPrompt: (prompt: string) => void;
  generatePrompt: (metadata: {
    level: string;
    subject: string;
    topic: string;
    promptType?: string;
    topicLong?: string;
    lessonContent?: string;
    activity?: string;
  }) => void;
  reset: () => void;
}

const initialState: PromptState = {
  prompt: '',
  error: '',
};

// Grade mapping with complexity levels from PromptContent
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
  'SSS 3': { grade: 'Senior Secondary 3', complexity: 'complex senior secondary principles' },
  // Map FilterControls levels for consistency
  '12th Grade (High School)': { grade: 'Senior Secondary 3', complexity: 'complex senior secondary principles' },
  '11th Grade (High School)': { grade: 'Senior Secondary 2', complexity: 'advanced secondary concepts' },
  '10th Grade (High School)': { grade: 'Senior Secondary 1', complexity: 'senior secondary foundations' },
  '9th Grade (High School)': { grade: 'Junior Secondary 3', complexity: 'advanced junior secondary concepts' },
  '8th Grade (High School)': { grade: 'Junior Secondary 2', complexity: 'intermediate secondary principles' },
  '7th Grade (High School)': { grade: 'Junior Secondary 1', complexity: 'junior secondary concepts' },
};

export const usePromptStore = create<PromptState & PromptActions>((set) => ({
  ...initialState,

  setPrompt: (prompt) =>
    set(() => ({
      prompt,
      error: '',
    })),

  generatePrompt: (metadata) =>
    set(() => {
      const {
        level,
        subject,
        topic,
        promptType = 'Explanation',
        topicLong = topic,
        lessonContent = 'Based on the curriculum requirements',
        activity = 'Following educational guidelines',
      } = metadata;

      try {
        if (!level || !subject || !topic) {
          return { prompt: '', error: 'Please complete all selections first' };
        }

        const gradeInfo = gradeMap[level] || { grade: level, complexity: 'appropriate concepts' };
        const basePrompt = `As an educational AI tutor for ${gradeInfo.grade} (${level}) students, focusing on ${subject}, please provide a comprehensive lesson on:`;

        const promptTemplates = {
          Explanation: `${basePrompt}

TOPIC: ${topicLong}

CONTEXT FROM CURRICULUM:
${lessonContent}

PLANNED ACTIVITIES:
${activity}

Please structure your response to include:

1. CORE EXPLANATION:
   - Focus on ${gradeInfo.complexity}
   - Break down "${topic}" into manageable parts
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
- Maintain focus on ${subject} curriculum
- Ensure all activities are classroom-safe`,

          Context: `${basePrompt}

TOPIC: ${topicLong}

CONTEXT FROM CURRICULUM:
${lessonContent}

Provide real-world context and practical applications for "${topic}". Structure your response to include:

1. RELEVANT CONTEXT:
   - Connect to ${gradeInfo.complexity}
   - Use examples ${gradeInfo.grade} students can relate to
   - Include local and global perspectives

2. PRACTICAL APPLICATIONS:
   - Show how "${topic}" applies in daily life
   - Highlight career or societal relevance
   - Maintain age-appropriate explanations

SAFETY AND APPROPRIATENESS:
- Ensure examples are suitable for ${gradeInfo.grade}
- Align with ${subject} curriculum`,

          Example: `${basePrompt}

TOPIC: ${topicLong}

CONTEXT FROM CURRICULUM:
${lessonContent}

Provide detailed examples and practice problems about "${topic}". Structure your response to include:

1. GUIDED EXAMPLES:
   - Start with simple cases
   - Progress to ${gradeInfo.complexity}
   - Include step-by-step solutions
   - Use age-appropriate scenarios

2. PRACTICE PROBLEMS:
   - Provide exercises for ${gradeInfo.grade}
   - Offer clear instructions
   - Include answers for verification

SAFETY AND APPROPRIATENESS:
- Keep content aligned with ${subject}
- Ensure examples suit ${gradeInfo.grade}`,

          Application: `${basePrompt}

TOPIC: ${topicLong}

CONTEXT FROM CURRICULUM:
${lessonContent}

PLANNED ACTIVITIES:
${activity}

Demonstrate how "${topic}" is applied in real-life situations. Structure your response to include:

1. APPLICATION EXAMPLES:
   - Show practical uses at ${gradeInfo.complexity}
   - Connect to students’ experiences
   - Use clear, relatable scenarios

2. HANDS-ON ACTIVITIES:
   - Suggest safe, supervised exercises
   - List materials and precautions
   - Tailor to ${gradeInfo.grade} classroom

SAFETY AND APPROPRIATENESS:
- Ensure activities are classroom-safe
- Maintain ${subject} focus`,

          Question: `${basePrompt}

TOPIC: ${topicLong}

CONTEXT FROM CURRICULUM:
${lessonContent}

Create a set of assessment questions about "${topic}". Structure your response to include:

1. BASIC UNDERSTANDING QUESTIONS:
   - Test core concepts for ${gradeInfo.grade}
   - Use simple, clear phrasing

2. APPLICATION-BASED PROBLEMS:
   - Apply ${gradeInfo.complexity}
   - Relate to real-world scenarios

3. CRITICAL THINKING CHALLENGES:
   - Encourage analysis for ${gradeInfo.grade}
   - Align with ${subject} curriculum

SAFETY AND APPROPRIATENESS:
- Keep questions age-appropriate
- Ensure educational relevance`,
        };

        const generatedPrompt = promptTemplates[promptType as keyof typeof promptTemplates] || promptTemplates.Explanation;
        return { prompt: generatedPrompt, error: '' };
      } catch (error) {
        return {
          prompt: '',
          error: error instanceof Error ? error.message : 'Failed to generate prompt',
        };
      }
    }),

  reset: () => set(initialState),
}));