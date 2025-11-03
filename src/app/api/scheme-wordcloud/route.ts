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

    if (!level || !subject) {
      return NextResponse.json({ 
        error: 'Level and Subject are required parameters' 
      }, { status: 400 });
    }

    console.log("📡 Calling get_tokens with:", { filter_level: level, filter_term: term || "", filter_subject: subject });

    const { data: tokenData, error: tokenError } = await supabase
      .rpc("get_tokens", {
        filter_level: level,
        filter_term: term || "",
        filter_subject: subject
      });

    if (tokenError) {
      console.error("🔥 Supabase Query Error:", tokenError);
      return NextResponse.json({ error: tokenError.message }, { status: 500 });
    }

    console.log("✅ Supabase Response:", tokenData?.length, "tokens found.", "Data:", tokenData);

    const words: { [key: string]: { count: number; ids: string[] } } = {};
    
    tokenData.forEach((item: { token: string }, index: number) => {
      const token = item.token;
      if (typeof token === "string" && token.length > 0) {
        const normalizedToken = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
        if (!words[normalizedToken]) {
          words[normalizedToken] = { count: 0, ids: [] };
        }
        words[normalizedToken].count += 1;
        if (!words[normalizedToken].ids.includes(String(index))) {
          words[normalizedToken].ids.push(String(index));
        }
      }
    });

    const wordArray = Object.keys(words)
      .map(word => ({
        value: word,
        count: words[word].count,
        id: words[word].ids[0]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);

    console.log("📤 Final Word Array:", wordArray);

    return NextResponse.json({ data: wordArray });
  } catch (error) {
    console.error("🔥 Unexpected API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};