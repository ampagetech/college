// src/types/university.ts
export interface Course {
    id: string;
    name: string;
    code: string;
    faculty_id: string;
    degree_type: string;
    duration_years: number;
    created_at?: string;
  }
  
  export interface Faculty {
    id: string;
    name: string;
    code: string;
    dean_name: string | null;
    courses: Course[]; // We will nest the courses under each faculty
    created_at?: string;
  }