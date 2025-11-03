import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { level, term, subject } = await request.json();

    const { data, error } = await supabase
      .from('lesson_scheme')
      .select('id, topic_short, topic_long, content, activity')
      .eq('level', level)
      .eq('term', term)
      .eq('subject', subject)
      .order('topic_short');

    if (error) {
      throw error;
    }

    const formattedTopics = data.map(topic => ({
      id: topic.id.toString(),
      name: topic.topic_short,
      topic_long: topic.topic_long,
      content: topic.content,
      activity: topic.activity
    }));

    return NextResponse.json(formattedTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}