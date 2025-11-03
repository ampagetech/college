// src/app/admin/faculties/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Faculty } from '@/types/university';

// --- DATA FETCHING ---

export async function getFacultiesWithCourses(): Promise<{ data: Faculty[]; error: string | null }> {
  const supabase = createClient();
  // Fetch all faculties and their related courses in one go
  const { data, error } = await supabase
    .from('faculties')
    .select(`
      *,
      courses (*)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching faculties and courses:', error);
    return { data: [], error: error.message };
  }

  // The data is already in the nested format we need.
  return { data: data as Faculty[], error: null };
}

// --- FACULTY CRUD ---

type FacultyPayload = { name: string; code: string; dean_name: string | null };

export async function createFaculty(payload: FacultyPayload): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('faculties').insert([payload]);
  if (error) return { error: error.message };
  
  revalidatePath('/admin/faculties');
  return { error: null };
}

export async function updateFaculty(id: string, payload: FacultyPayload): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('faculties').update(payload).eq('id', id);
  if (error) return { error: error.message };
  
  revalidatePath('/admin/faculties');
  return { error: null };
}

export async function deleteFaculty(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('faculties').delete().eq('id', id);
  if (error) {
      // Handle case where faculty has courses
      if (error.code === '23503') { // Foreign key violation
          return { error: 'Cannot delete faculty. It has associated courses. Please delete or reassign courses first.' };
      }
      return { error: error.message };
  }
  
  revalidatePath('/admin/faculties');
  return { error: null };
}

// --- COURSE CRUD ---

type CoursePayload = { name: string; code: string; faculty_id: string; degree_type: string; duration_years: number };

export async function createCourse(payload: CoursePayload): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('courses').insert([payload]);
  if (error) return { error: error.message };

  revalidatePath('/admin/faculties');
  return { error: null };
}

export async function updateCourse(id: string, payload: CoursePayload): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('courses').update(payload).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/faculties');
  return { error: null };
}

export async function deleteCourse(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/faculties');
  return { error: null };
}