import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest, 
  { params }: { params: { quizSessionId: string } }
) {
  const { quizSessionId } = params;

  try {
    // Replace Firebase auth with NextAuth.js session check
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No valid session found' },
        { status: 401 }
      );
    }

    const UserId = session.user.id;

    // Fetch quiz session to verify user
    const { data: quizSession, error: sessionError } = await supabase
      .from('quiz_user_session')
      .select('user_id')
      .eq('quiz_session_id', quizSessionId)
      .single();

    if (sessionError || !quizSession || quizSession.user_id !== UserId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this quiz session' },
        { status: 403 }
      );
    }

    // Fetch user answers
    const { data: answers, error } = await supabase
      .from('quiz_user_answers')
      .select('question_extract_pk, selected_answer, is_correct, answered_at')
      .eq('quiz_session_id', quizSessionId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch answers', details: error.message },
        { status: 500 }
      );
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: answers });
  } catch (error) {
    console.error('Quiz answers retrieval error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}