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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    // Fetch full details for the specific scheme
    const { data, error } = await supabase
      .from("lesson_scheme")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("🔥 Supabase Query Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    console.log("✅ Scheme Detail Retrieved:", data.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("🔥 Unexpected API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};