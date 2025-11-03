import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionData {
  question_extract_pk: string;
  exam: string;
  subject: string;
  question_html: string;
  question_option_a_as_html: string;
  question_option_b_as_html: string;
  question_option_c_as_html: string;
  question_option_d_as_html: string;
  answer_a_b_c_d_e_option: string | null;
  answer_explanation_html: string;
  gemini_long_response: string;
  gemini_question_topic: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  const params = await context.params;
  console.log("API Route Hit: /api/question-details/[questionId]", params.questionId);

  const questionId = params.questionId;
  try {
    // Replace Firebase auth with NextAuth.js session check
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select(
        `
        question_extract_pk,
        exam,
        subject,
        question_html,
        question_option_a_as_html,
        question_option_b_as_html,
        question_option_c_as_html,
        question_option_d_as_html,
        answer_a_b_c_d_e_option,
        answer_explanation_html,
        gemini_long_response,
        gemini_question_topic
        `
      )
      .eq("question_extract_pk", questionId)
      .single();

    if (questionError || !question) {
      console.error("Failed to fetch question:", questionError);
      return NextResponse.json(
        {
          error: "Question not found or error occurred",
          details: questionError?.message || "No data returned",
        },
        { status: 404 }
      );
    }

    const questionData: QuestionData = {
      question_extract_pk: question.question_extract_pk,
      exam: question.exam,
      subject: question.subject,
      question_html: question.question_html,
      question_option_a_as_html: question.question_option_a_as_html,
      question_option_b_as_html: question.question_option_b_as_html,
      question_option_c_as_html: question.question_option_c_as_html,
      question_option_d_as_html: question.question_option_d_as_html,
      answer_a_b_c_d_e_option: question.answer_a_b_c_d_e_option,
      answer_explanation_html: question.answer_explanation_html,
      gemini_long_response: question.gemini_long_response,
      gemini_question_topic: question.gemini_question_topic,
    };

    return NextResponse.json({ data: questionData }, { status: 200 });
  } catch (error) {
    console.error("API Error in /api/question-details/[questionId]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}