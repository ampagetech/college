// C:\DevWeb\college-saas\src\lib\actions\quiz-actions.ts

'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

//================================================
// HELPER FUNCTIONS (No changes needed here)
//================================================
function toTitleCase(str: string | null): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function stripHtml(html: string): string {
    if (!html) return '';
    let text = html
        .replace(/<sub>(.*?)<\/sub>/gi, '_{$1}')
        .replace(/<sup>(.*?)<\/sup>/gi, '^{$1}')
        .replace(/<[^>]*>?/gm, '');
    const entityMap: { [key: string]: string } = { ' ': ' ', '&': '&', '<': '<', '>': '>', '"': '"', "'": "'", '?': '?' };
    text = text.replace(/&[#a-zA-Z0-9]+;/g, (match) => entityMap[match] || match);
    return text.replace(/\s+/g, ' ').trim().replace(/\?\s+$/, '?');
}

//================================================
// TYPES
//================================================

export type QuizQuestion = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
};

export interface QuizFilters {
    exam: string;
    subject: string;
    difficulty: string;
    mode: string;
    display: string;
    question_count: string;
    seconds_per_question: string;
}

export type StartQuizResponse = {
    success: true;
    quiz: QuizQuestion[];
    quizSessionId: string;
    metadata: Omit<QuizFilters, 'exam' | 'subject'>;
} | {
    success: false;
    error: string;
};

// This type is used by submitQuizAnswers
interface QuizAnswer {
  value: string;
  letter: string;
}

interface SubmitQuizResult {
    success: boolean;
    error?: string;
    quizSessionId?: string;
}

//================================================
// ACTIONS
//================================================

export async function startNewQuiz(filters: QuizFilters): Promise<StartQuizResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized. You must be logged in to start a quiz." };
        }
        const userId = session.user.id;
        const { exam: rawExam, subject: rawSubject, question_count } = filters;
        if (!rawExam || !rawSubject) {
            return { success: false, error: "Exam and subject are required parameters." };
        }
        const exam = rawExam.toUpperCase();
        const subject = toTitleCase(rawSubject);
        const count = parseInt(question_count) || 10;
        const supabase = createClient();
        const { count: recordCount, error: checkError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam', exam)
            .eq('subject', subject);
        if (checkError) {
            console.error("Database check error:", checkError);
            return { success: false, error: "Database error checking for questions." };
        }
        if (!recordCount || recordCount === 0) {
            return { success: false, error: `No questions found for ${exam} - ${subject}.` };
        }
        const maxOffset = Math.max(0, recordCount - count);
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1));
        const { data, error: fetchError } = await supabase
            .from('questions')
            .select('*')
            .eq('exam', exam)
            .eq('subject', subject)
            .range(randomOffset, randomOffset + count - 1);
        if (fetchError || !data || data.length === 0) {
            console.error("Query error:", fetchError);
            return { success: false, error: "Failed to fetch questions from the database." };
        }
        const transformedQuestions: QuizQuestion[] = data.map((item) => ({
            id: item.question_extract_pk.toString(),
            text: stripHtml(item.question_html),
            options: [
                stripHtml(item.question_option_a_as_html),
                stripHtml(item.question_option_b_as_html),
                stripHtml(item.question_option_c_as_html),
                stripHtml(item.question_option_d_as_html),
            ].filter((option) => option.trim().length > 0),
            correctAnswer: item.answer_a_b_c_d_e_option,
        }));

        // --- FIX #2 IS HERE ---
        // The quizMetadata object now includes the missing properties.
        const durationSeconds = count * parseInt(filters.seconds_per_question);
        const quizMetadata = {
            difficulty: filters.difficulty || 'All Types',
            mode: filters.mode || 'Practice Mode',
            display: filters.display || 'Single Question',
            question_count: filters.question_count,
            seconds_per_question: filters.seconds_per_question
        };
        const { data: sessionData, error: sessionError } = await supabase
            .from('quiz_user_session')
            .insert({
                user_id: userId,
                subject,
                exam,
                no_qus_selected: count,
                duration_seconds: durationSeconds,
                start_time: new Date().toISOString(),
                metadata: quizMetadata,
            })
            .select('quiz_session_id')
            .single();
        if (sessionError || !sessionData) {
            console.error("Failed to create quiz session:", sessionError);
            return { success: false, error: "Could not create a new quiz session." };
        }
        return {
            success: true,
            quiz: transformedQuestions,
            quizSessionId: sessionData.quiz_session_id,
            metadata: quizMetadata,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unexpected server error occurred.';
        console.error("Start Quiz Action Error:", message);
        return { success: false, error: message };
    }
}

// --- FIX #1 IS HERE ---
// The function signature is now correctly defined with its three arguments.
// Fixed submitQuizAnswers function - replace the existing one in quiz-actions.ts
export async function submitQuizAnswers(
    quizSessionId: string,
    answers: Record<string, QuizAnswer>,
    totalTimeSpent: number
  ): Promise<SubmitQuizResult> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Authentication required' };
      }
      const userId = session.user.id;
      const supabase = createClient();
  
      // --- FIX #1: Fetch all necessary session data, not just the user ID ---
      // We need 'exam' and 'subject' to pass them to the results page context.
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_user_session')
        // Select the columns that the results page will need
        .select('user_id, exam, subject, metadata')
        .eq('quiz_session_id', quizSessionId)
        .single();
  
      if (sessionError || !sessionData || sessionData.user_id !== userId) {
        console.error('Session validation error:', sessionError);
        return { success: false, error: 'Invalid or unauthorized quiz session.' };
      }
  
      const { error: deleteError } = await supabase
        .from('quiz_user_answers')
        .delete()
        .eq('quiz_session_id', quizSessionId);
  
      if (deleteError) {
        console.error('Error clearing previous answers:', deleteError);
        return { success: false, error: 'Failed to clear previous answers.' };
      }
  
      if (Object.keys(answers).length > 0) {
        const answersToInsert = [];
        for (const [questionId, answer] of Object.entries(answers)) {
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .select('answer_a_b_c_d_e_option')
            .eq('question_extract_pk', questionId)
            .single();
          if (questionError) {
            console.error(`Error fetching answer for question ${questionId}:`, questionError);
            continue;
          }
          const isCorrect = answer.letter === questionData.answer_a_b_c_d_e_option;
          answersToInsert.push({
            quiz_session_id: quizSessionId,
            question_extract_pk: questionId,
            selected_answer: answer.letter,
            is_correct: isCorrect,
            answered_at: new Date().toISOString(),
          });
        }
        if (answersToInsert.length > 0) {
          const { error: insertError } = await supabase.from('quiz_user_answers').insert(answersToInsert);
          if (insertError) {
            console.error('Error inserting final quiz answers:', insertError);
            return { success: false, error: 'Failed to save quiz answers.' };
          }
        }
      }
  
      // --- FIX #2: Merge new metadata with existing metadata ---
      // This preserves all the original metadata from when the quiz was started.
      const updatedMetadata = {
        ...sessionData.metadata, // Keep the old metadata
        total_time_spent: totalTimeSpent, // Add the new time spent
      };
  
      const { error: updateError } = await supabase
        .from('quiz_user_session')
        .update({
          end_time: new Date().toISOString(),
          // The exam and subject fields are already in the database; we don't need to update them.
          // We only update the metadata field.
          metadata: updatedMetadata,
        })
        .eq('quiz_session_id', quizSessionId);
  
      if (updateError) {
        console.error('Error updating quiz session completion:', updateError);
        // We don't return an error here as the critical parts (answers) are saved.
      }
  
      return { success: true, quizSessionId };
  
    } catch (error) {
      console.error('Quiz submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during submission'
      };
    }
  }
export async function redirectToResults(quizSessionId: string) {
    redirect(`/quiz/results/${quizSessionId}`);
}