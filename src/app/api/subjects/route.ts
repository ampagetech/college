// app/api/subjects/route.ts
import { NextResponse } from 'next/server';
import subjects from '@/lib/subject.json';

export async function GET() {
  try {
    // Transform the JSON data to match the expected format
    const formattedSubjects = subjects.map((subject, index) => ({
      id: index + 1,
      name: subject.label,
      value: subject.value,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json(formattedSubjects);
  } catch (error) {
    const errorDetails = error instanceof Error
      ? { message: error.message }
      : { message: 'An unexpected error occurred' };
    console.error('Error loading subjects:', error);
    return NextResponse.json({ error: errorDetails.message }, { status: 500 });
  }
}