import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  console.log("API Route Hit: /api/quiz_results");
  try {
    const { searchParams } = new URL(req.url);
    const quizSessionId = searchParams.get('quizSessionId')?.trim();
    const startDate = searchParams.get('startDate')?.trim(); // e.g., "2025-03-20"
    const endDate = searchParams.get('endDate')?.trim();     // e.g., "2025-03-20"

    if (!quizSessionId) {
      return NextResponse.json(
        { error: "Missing quizSessionId" },
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

    const UserId = session.user.id;

    // Step 1: Log raw inputs
    console.log("Raw Inputs:", { quizSessionId, startDate, endDate });

    // Step 2: Format date ranges properly for datetime comparison
    // If a startDate is provided, set time to beginning of day (00:00:00)
    // If an endDate is provided, set time to end of day (23:59:59)
    let formattedStartDate = null;
    let formattedEndDate = null;
    
    if (startDate) {
      formattedStartDate = `${startDate}T00:00:00`;
    }
    
    if (endDate) {
      formattedEndDate = `${endDate}T23:59:59`;
    }

    // Step 3: Log adjusted dates
    console.log("Formatted Date Range:", { formattedStartDate, formattedEndDate });

    // Step 4: Build and log the query
    let query = supabase
      .from('quiz_user_session')
      .select('start_time, end_time, duration_seconds, no_qus_selected, user_id')
      .eq('quiz_session_id', quizSessionId)
      .eq('user_id', UserId);

    if (formattedStartDate) {
      query = query.gte('start_time', formattedStartDate);
      console.log("Filter Applied: start_time >= ", formattedStartDate);
    }
    if (formattedEndDate) {
      query = query.lte('start_time', formattedEndDate);
      console.log("Filter Applied: start_time <= ", formattedEndDate);
    }

    // Step 5: Execute query and log results
    const { data, error } = await query;
    console.log("Query Result:", data);
    console.log("Query Error:", error);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: "No quiz session found", details: error?.message || "No data" },
        { status: 404 }
      );
    }

    // Take the first record for simplicity
    const sessionData = data[0];

    // Minimal response for now to focus on date issue
    return NextResponse.json({
      start_time: sessionData.start_time,
      message: "Found session",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}