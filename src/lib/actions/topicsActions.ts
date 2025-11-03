// src/lib/actions/topicsActions.ts

"use server";

import { createClient } from '@/lib/supabase/server';

// This is the shape of the data that your TopicDropdown component expects.
// We define it here for type safety.
export type Topic = {
  id: string;
  name: string; // Corresponds to 'topic_short' from the database
  topic_long: string;
  content: string;
  activity: string;
};

// This function replaces the need for the /api/topics route
export async function getTopics(level: string, term: string, subject: string): Promise<{ data?: Topic[]; error?: string }> {
  // Use the secure server-side Supabase client, just like in your other actions
  const supabase = createClient();

  // Input validation
  if (!level || !term || !subject) {
    return { error: "Level, Term, and Subject are required to fetch topics." };
  }

  try {
    // This is the exact same query from your /api/topics/route.ts
    const { data: lessonData, error } = await supabase
      .from('lesson_scheme')
      .select('id, topic_short, topic_long, content, activity')
      .eq('level', level)
      .eq('term', term)
      .eq('subject', subject)
      .order('topic_short', { ascending: true });

    if (error) {
      // If Supabase returns an error, we throw it to be caught by the catch block
      throw error;
    }

    // This is the exact same data transformation from your route.ts.
    // It's crucial because your front-end components expect 'name', not 'topic_short'.
    const formattedTopics: Topic[] = lessonData.map(topic => ({
      id: topic.id.toString(),
      name: topic.topic_short,
      topic_long: topic.topic_long,
      content: topic.content,
      activity: topic.activity
    }));

    // Return the data in the same { data } format as your other actions
    return { data: formattedTopics };

  } catch (err: any) {
    // Use the same error handling pattern as your other actions
    console.error("Error fetching topics:", err);
    return { error: err.message };
  }
}