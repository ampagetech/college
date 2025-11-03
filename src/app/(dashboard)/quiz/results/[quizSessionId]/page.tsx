import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import QuizResultsClient from "@/components/quiz/QuizResultsClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface ResultsPageProps {
  params: {
    quizSessionId: string;
  };
}

async function getQuizResultsData(quizSessionId: string, userId: string) {
  // 1. Fetch the quiz session
  const { data: sessionData, error: sessionError } = await supabase
    .from("quiz_user_session")
    .select("*")
    .eq("quiz_session_id", quizSessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !sessionData) {
    console.error("Error fetching session or session not found:", sessionError);
    return null;
  }

  // 2. Fetch user's answers
  const { data: userAnswers, error: answersError } = await supabase
    .from("quiz_user_answers")
    .select("*")
    .eq("quiz_session_id", quizSessionId);

  if (answersError) {
    console.error("Error fetching user answers:", answersError);
    return null;
  }

  // 3. Fetch full question details
  const questionIds = userAnswers?.map((a) => a.question_extract_pk) || [];
  let questions = [];

  if (questionIds.length > 0) {
    const { data: fetchedQuestions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .in("question_extract_pk", questionIds);

    if (questionsError || !fetchedQuestions) {
      console.error("Error fetching questions:", questionsError);
      return null;
    }
    questions = fetchedQuestions;
  }

  // 4. Compute stats
  const correctAnswers = userAnswers?.filter((a) => a.is_correct).length || 0;
  const totalQuestions = sessionData.no_qus_selected;
  const totalTimeSpent = sessionData.metadata?.total_time_spent || 0;

  // 5. Transform the data before returning it
  return {
    session: {
      ...sessionData,
      exam: { exam_name: sessionData.exam },
      subject: { subject_name: sessionData.subject },
    },
    userAnswers: userAnswers || [],
    questions,
    stats: {
      correctAnswers,
      wrongAnswers: (userAnswers?.length || 0) - correctAnswers,
      unattempted: totalQuestions - (userAnswers?.length || 0),
      totalQuestions,
      score:
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0,
      timeSpent: totalTimeSpent,
    },
  };
}

export default async function QuizResultsPage({ params }: ResultsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return notFound();
  }

  const resultsData = await getQuizResultsData(
    params.quizSessionId,
    session.user.id
  );

  if (!resultsData) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <QuizResultsClient results={resultsData} />
    </div>
  );
}