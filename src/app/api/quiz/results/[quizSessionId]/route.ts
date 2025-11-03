// Create this file at: /app/api/quiz/results/[quizSessionId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Define the question data type for better type safety
type QuestionData = {
  question_extract_pk: number;
  question_html: string;
  question_option_a_as_html: string;
  question_option_b_as_html: string;
  question_option_c_as_html: string;
  question_option_d_as_html: string;
  answer_a_b_c_d_e_option: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { quizSessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.warn('[DEBUG] Unauthorized request. Session not found.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizSessionId } = params;
    const userId = session.user.id;
    const supabase = createClient();

    console.log('[DEBUG] Fetching quiz session:', { quizSessionId, userId });

    const { data: sessionData, error: sessionError } = await supabase
      .from('quiz_user_session')
      .select(`
        quiz_session_id,
        user_id,
        subject,
        exam,
        no_qus_selected,
        duration_seconds,
        start_time,
        end_time,
        metadata
      `)
      .eq('quiz_session_id', quizSessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !sessionData) {
      console.error('[DEBUG] Error fetching session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    console.log('[DEBUG] Session data retrieved:', sessionData);

    const { data: answersData, error: answersError } = await supabase
      .from('quiz_user_answers')
      .select(`
        question_extract_pk,
        selected_answer,
        is_correct,
        answered_at
      `)
      .eq('quiz_session_id', quizSessionId);

    if (answersError) {
      console.error('[DEBUG] Error fetching answers:', answersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quiz answers' },
        { status: 500 }
      );
    }

    console.log('[DEBUG] Answers retrieved:', answersData?.length);

    const questionIds = answersData?.map(answer => answer.question_extract_pk) || [];

    // Explicitly type questionsData to avoid TypeScript inference issues
    let questionsData: QuestionData[] = [];
    if (questionIds.length > 0) {
      console.log('[DEBUG] Fetching question details for:', questionIds);

      let { data: qData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          question_extract_pk,
          question_html,
          question_option_a_as_html,
          question_option_b_as_html,
          question_option_c_as_html,
          question_option_d_as_html,
          answer_a_b_c_d_e_option
        `)
        .in('question_extract_pk', questionIds);

      if (questionsError) {
        console.warn('[DEBUG] Failed to fetch from `questions`. Trying `question_extracts` instead...');

        const { data: altData, error: altError } = await supabase
          .from('question_extracts')
          .select(`
            question_extract_pk,
            question_html,
            question_option_a_as_html,
            question_option_b_as_html,
            question_option_c_as_html,
            question_option_d_as_html,
            answer_a_b_c_d_e_option
          `)
          .in('question_extract_pk', questionIds);

        if (altError) {
          console.error('[DEBUG] Failed to fetch question details from both sources:', altError);
          return NextResponse.json(
            { success: false, error: 'Failed to fetch question details' },
            { status: 500 }
          );
        }

        qData = altData;
      }

      questionsData = (qData || []) as QuestionData[];
    }

    function stripHtml(html: string): string {
      if (!html) return '';
      let text = html
        .replace(/<sub>(.*?)<\/sub>/gi, '_{$1}')
        .replace(/<sup>(.*?)<\/sup>/gi, '^{$1}')
        .replace(/<[^>]*>?/gm, '');
      const entityMap: { [key: string]: string } = { 
        '&nbsp;': ' ', 
        '&amp;': '&', 
        '&lt;': '<', 
        '&gt;': '>', 
        '&quot;': '"', 
        '&#39;': "'", 
        '&rsquo;': "'" 
      };
      text = text.replace(/&[#a-zA-Z0-9]+;/g, match => entityMap[match] || match);
      return text.replace(/\s+/g, ' ').trim().replace(/\?\s+$/, '?');
    }

    const detailedAnswers = (answersData || []).map(answer => {
      const question = questionsData.find(q => 
        q.question_extract_pk.toString() === answer.question_extract_pk.toString()
      );
      
      if (!question) {
        return {
          questionId: answer.question_extract_pk.toString(),
          questionText: 'Question not found',
          selectedAnswer: answer.selected_answer,
          correctAnswer: 'Unknown',
          isCorrect: answer.is_correct,
          options: []
        };
      }

      const options = [
        stripHtml(question.question_option_a_as_html),
        stripHtml(question.question_option_b_as_html),
        stripHtml(question.question_option_c_as_html),
        stripHtml(question.question_option_d_as_html),
      ].filter(option => option.trim().length > 0);

      return {
        questionId: answer.question_extract_pk.toString(),
        questionText: stripHtml(question.question_html),
        selectedAnswer: answer.selected_answer,
        correctAnswer: question.answer_a_b_c_d_e_option,
        isCorrect: answer.is_correct,
        options
      };
    });

    const totalQuestions = sessionData.no_qus_selected;
    const correctAnswers = detailedAnswers.filter(answer => answer.isCorrect).length;
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalTimeSpent = sessionData.metadata?.total_time_spent || 0;

    const results = {
      quizSessionId: sessionData.quiz_session_id,
      exam: sessionData.exam,
      subject: sessionData.subject,
      totalQuestions,
      correctAnswers,
      totalTimeSpent,
      percentage,
      startTime: sessionData.start_time,
      completedAt: sessionData.end_time,
      answers: detailedAnswers
    };

    console.log('[DEBUG] Final quiz result response:', results);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[DEBUG] Quiz results API unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}