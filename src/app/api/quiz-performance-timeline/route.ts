// C:\DevWeb\college-saas\src\app\api\quiz-performance-timeline\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const exam = searchParams.get('exam')?.trim();
    const subject = searchParams.get('subject')?.trim();
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();

    const formattedStartDate = startDate ? `${startDate}T00:00:00` : null;
    const formattedEndDate = endDate ? `${endDate}T23:59:59` : null;

    let sessionQuery = supabase
      .from('quiz_user_session')
      .select('quiz_session_id, start_time, no_qus_selected')
      .eq('user_id', userId) // Use NextAuth user ID
      .order('start_time', { ascending: true });

    if (exam && exam.toLowerCase() !== 'all') {
      sessionQuery = sessionQuery.eq('exam', exam);
    }
    if (subject && subject.toLowerCase() !== 'all' && subject !== 'All Subjects') {
      sessionQuery = sessionQuery.eq('subject', subject);
    }
    if (formattedStartDate) {
      sessionQuery = sessionQuery.gte('start_time', formattedStartDate);
    }
    if (formattedEndDate) {
      sessionQuery = sessionQuery.lte('start_time', formattedEndDate);
    }

    const { data: sessions, error: sessionError } = await sessionQuery;
    if (sessionError) {
      throw new Error(`Database error fetching sessions: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const quizSessionIds = sessions.map(s => s.quiz_session_id);
    const { data: answers, error: answerError } = await supabase
      .from('quiz_user_answers')
      .select('quiz_session_id, is_correct')
      .in('quiz_session_id', quizSessionIds);

    if (answerError) {
      throw new Error(`Database error fetching answers: ${answerError.message}`);
    }
    
    // Group answers by session ID for efficient lookup
    const answersBySession = (answers || []).reduce((acc, answer) => {
        acc[answer.quiz_session_id] = acc[answer.quiz_session_id] || [];
        acc[answer.quiz_session_id].push(answer);
        return acc;
    }, {} as Record<string, typeof answers>);

    const performanceData = sessions.map(session => {
      const sessionAnswers = answersBySession[session.quiz_session_id] || [];
      const correctAnswers = sessionAnswers.filter(a => a.is_correct).length;
      const totalQuestions = session.no_qus_selected;
      const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100) : 0;

      return {
        date: session.start_time,
        percentage: Number(percentage.toFixed(2)),
        totalQuestions,
        correctAnswers
      };
    });

    return NextResponse.json({ data: performanceData });

  } catch (error) {
    console.error("API Error in quiz-performance-timeline:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}