import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { quizSessionId, questionId, selectedAnswer } = await req.json();

    if (!quizSessionId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: "Missing required fields", details: "quizSessionId, questionId, and selectedAnswer are required" },
        { status: 400 }
      );
    }

    // Replace Firebase auth with NextAuth.js session check
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Fetch the correct answer from the questions table
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('answer_a_b_c_d_e_option')
      .eq('question_extract_pk', parseInt(questionId))
      .single();

    if (questionError || !questionData) {
      console.error("Failed to fetch question:", questionError);
      return NextResponse.json(
        { error: "Failed to fetch question data", details: questionError?.message || "Question not found" },
        { status: 500 }
      );
    }

    const correctAnswer = questionData.answer_a_b_c_d_e_option;
    const isCorrect = selectedAnswer === correctAnswer;

    // Insert the answer into quiz_user_answers
    const { error } = await supabase
      .from('quiz_user_answers')
      .insert({
        quiz_session_id: quizSessionId,
        question_extract_pk: parseInt(questionId),
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to save answer to database:", error);
      return NextResponse.json(
        { error: "Failed to save answer", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}