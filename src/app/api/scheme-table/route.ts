import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const GET = async (req: Request) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("🚨 Missing Supabase credentials!");
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(req.url);
    console.log("🔍 Incoming Query Params:", searchParams.toString());

    const level = searchParams.get("level");
    const term = searchParams.get("term");
    const subject = searchParams.get("subject");
    const searchQuery = searchParams.get("searchQuery");

    let baseQuery = supabase
      .from("lesson_scheme")
      .select("id, nigerian_level, subject, term, week, topic_long");

    if (level) baseQuery = baseQuery.eq("nigerian_level", level);
    
    // Handle "All Terms" option
    if (term && term !== "All Terms") {
      baseQuery = baseQuery.eq("term", term);
    }
    
    if (subject) baseQuery = baseQuery.eq("subject", subject);
    if (searchQuery) {
      baseQuery = baseQuery.or(`topic_long.ilike.%${searchQuery}%`);
    }

    // Fetch all rows
    const { data, error } = await baseQuery;

    if (error) {
      console.error("🔥 Supabase Query Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Supabase Response:", data?.length, "records found.");
    return NextResponse.json({ data });
  } catch (error) {
    console.error("🔥 Unexpected API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};