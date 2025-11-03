'use server';

import { createClient } from "@/lib/supabase/server";
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';

interface QuizResultData {
  quizSessionId: string;
  subject: string;
  exam: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage: string;
  totalTimeSpent: number;
  startTime: string;
  examYear?: number;
}

interface Filters {
    exam: string;
    subject: string;
    startDate: string;
    endDate: string;
  }

export async function getQuizResults(filters: Filters): Promise<QuizResultData[]> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    const { exam, subject, startDate, endDate } = filters;

    const formattedStartDate = startDate ? `${startDate}T00:00:00` : null;
    const formattedEndDate = endDate ? `${endDate}T23:59:59` : null;

    const supabase = createClient();

    let query = supabase
      .from('quiz_user_session')
      .select('quiz_session_id, exam, subject, no_qus_selected, duration_seconds, start_time, end_time, exam_year')
      .eq('user_id', userId);

    if (exam && exam.toLowerCase() !== 'all') {
        query = query.eq('exam', exam);
    }
    if (subject && subject.toLowerCase() !== 'all' && subject !== 'All Subjects') {
        query = query.eq('subject', subject);
    }
    if (formattedStartDate) {
        query = query.gte('start_time', formattedStartDate);
    }
    if (formattedEndDate) {
        query = query.lte('start_time', formattedEndDate);
    }

    const { data: sessions, error: sessionError } = await query;

    if (sessionError) {
      console.error("Failed to fetch quiz sessions:", sessionError);
      throw new Error("Failed to fetch quiz sessions");
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    const quizSessionIds = sessions.map(session => session.quiz_session_id);
    const { data: userAnswers, error: answerError } = await supabase
      .from('quiz_user_answers')
      .select('quiz_session_id, question_extract_pk, is_correct')
      .in('quiz_session_id', quizSessionIds);

    if (answerError) {
      console.error("Failed to fetch user answers:", answerError);
      throw new Error("Failed to fetch answers");
    }
    
    const answersBySession = (userAnswers || []).reduce((acc, answer) => {
        acc[answer.quiz_session_id] = acc[answer.quiz_session_id] || [];
        acc[answer.quiz_session_id].push(answer);
        return acc;
    }, {} as Record<string, typeof userAnswers>);

    const results = sessions.map(session => {
      const sessionAnswers = answersBySession[session.quiz_session_id] || [];
      const totalQuestions = session.no_qus_selected;
      const correctAnswers = sessionAnswers.filter(answer => answer.is_correct).length;
      
      const endTime = session.end_time ? new Date(session.end_time) : new Date(session.start_time);
      const startTime = new Date(session.start_time);
      const totalTimeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      const clampedTimeSpent = Math.min(totalTimeSpent, session.duration_seconds || totalTimeSpent);
      const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(2) : '0.00';

      return {
        quizSessionId: session.quiz_session_id,
        exam: session.exam,
        subject: session.subject,
        totalQuestions,
        correctAnswers,
        percentage,
        totalTimeSpent: clampedTimeSpent,
        startTime: session.start_time,
        examYear: session.exam_year,
      };
    });

    return results;
}
