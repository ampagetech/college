// C:\DevWeb\college-saas\src\app\api\quiz-session-details\[quizSessionId]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { quizSessionId: string } }
) {
  const { quizSessionId } = params;
  console.log("API Route Hit: /api/quiz-session-details/", quizSessionId);

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // First, verify the user owns this quiz session
    const { data: sessionData, error: sessionError } = await supabase
      .from("quiz_user_session")
      .select("no_qus_selected, user_id")
      .eq("quiz_session_id", quizSessionId)
      .single();

    if (sessionError) {
        console.error("Failed to fetch session:", sessionError);
        return NextResponse.json({ error: "Session not found", details: sessionError.message }, { status: 404 });
    }
    
    if (sessionData.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden", details: "You are not authorized to view this session." }, { status: 403 });
    }

    const { data: userAnswers, error: answerError } = await supabase
      .from("quiz_user_answers")
      .select("question_extract_pk, selected_answer, is_correct")
      .eq("quiz_session_id", quizSessionId);

    if (answerError) {
      console.error("Supabase answer error:", answerError);
      throw new Error(`Supabase error fetching answers: ${answerError.message}`);
    }

    const totalQuestions = sessionData.no_qus_selected;
    const correctAnswers = userAnswers?.filter((answer) => answer.is_correct).length || 0;

    if (!userAnswers || userAnswers.length === 0) {
      return NextResponse.json({
        data: { questions: [], userAnswers: [], correctAnswers, totalQuestions },
      });
    }

    const questionIds = userAnswers.map((answer) => answer.question_extract_pk);
    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select(
        `question_extract_pk, exam, subject, exam_year, question_number, question_html, 
         question_option_a_as_html, question_option_b_as_html, question_option_c_as_html, 
         question_option_d_as_html, answer_a_b_c_d_e_option, answer_explanation_html, 
         gemini_long_response, gemini_question_topic`
      )
      .in("question_extract_pk", questionIds);

    if (questionError) {
      console.error("Supabase question error:", questionError);
      throw new Error(`Supabase error fetching questions: ${questionError.message}`);
    }

    const responseData = {
      questions: questions || [],
      userAnswers,
      correctAnswers,
      totalQuestions,
    };

    return NextResponse.json({ data: responseData });
    
  } catch (error) {
    console.error("API Error in /api/quiz-session-details/[quizSessionId]:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}