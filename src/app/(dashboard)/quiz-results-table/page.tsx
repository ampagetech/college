import { Card, CardContent } from "@/components/ui/card";
import { getQuizResults } from "@/lib/actions/quiz-results-table-actions";
import QuizFilterControls from "@/components/quiz/QuizFilterControls";
import QuizResultsTable from "@/components/quiz/QuizResultsTable";
import { Suspense } from "react";

// Define SearchParams interface directly since it's not exported from common
interface SearchParams {
  exam?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
}

export default async function QuizResultsTablePage({ searchParams }: { searchParams: SearchParams }) {
  const exam = searchParams.exam || "all";
  const subject = searchParams.subject || "all";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";

  const filters = { exam, subject, startDate, endDate };

  const results = await getQuizResults(filters);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <QuizFilterControls filters={filters} />
            <Suspense fallback={<p>Loading...</p>}>
              <QuizResultsTable results={results} />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}