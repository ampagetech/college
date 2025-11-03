'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Admission, Course, AcademicSession, UserProfile } from '@/types/admission';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ADMISSION_API_ROUTES, ADMISSION_STATUSES, PATHS } from '@/lib/constants';

// Zod schema for form validation - remove .default() to make status required
const admissionFormSchema = z.object({
  user_id: z.string().uuid({ message: "Please select a student." }),
  course_id: z.string().uuid({ message: "Please select a course." }),
  academic_session_id: z.string().uuid({ message: "Please select an academic session." }),
  admission_date: z.date().min(new Date("1900-01-01"), "Admission date is required."),
  status: z.nativeEnum(ADMISSION_STATUSES), // Removed .default() to make it required
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

interface ApiErrorResponse {
  error?: string;
}

interface AdmissionResponse {
  id: string;
  user_id: string;
  course_id: string;
  academic_session_id: string;
  admission_date: string;
  status: keyof typeof ADMISSION_STATUSES;
}

interface ManageAdmissionFormProps {
  mode: 'create' | 'edit';
  initialData?: Admission | null;
  admissionId?: string;
  users?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>[];
  courses?: Course[];
  academicSessions?: AcademicSession[];
}

const ManageAdmissionForm: React.FC<ManageAdmissionFormProps> = ({
  mode,
  initialData,
  admissionId,
  users,
  courses,
  academicSessions,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      user_id: initialData?.user_id || '',
      course_id: initialData?.course_id || '',
      academic_session_id: initialData?.academic_session_id || '',
      admission_date: initialData?.admission_date ? new Date(initialData.admission_date) : new Date(),
      status: initialData?.status || ADMISSION_STATUSES.PROVISIONAL,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        user_id: initialData.user_id || '',
        course_id: initialData.course_id || '',
        academic_session_id: initialData.academic_session_id || '',
        admission_date: initialData.admission_date ? new Date(initialData.admission_date) : new Date(),
        status: initialData.status,
      });
    } else if (mode === 'create') {
      reset({
        user_id: '',
        course_id: '',
        academic_session_id: '',
        admission_date: new Date(),
        status: ADMISSION_STATUSES.PROVISIONAL,
      });
    }
  }, [initialData, mode, reset]);

  const onSubmit: SubmitHandler<AdmissionFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log(`[ManageAdmissionForm] Submitting form data for ${mode} mode:`, data);
    try {
      const payload = {
        ...data,
        admission_date: format(data.admission_date, "yyyy-MM-dd"),
      };
      console.log(`[ManageAdmissionForm] Payload for API:`, payload);

      const url = mode === 'create'
        ? ADMISSION_API_ROUTES.ADMIN_CREATE_ADMISSION
        : ADMISSION_API_ROUTES.ADMIN_UPDATE_ADMISSION.replace('[id]', admissionId || '');
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      console.log(`[ManageAdmissionForm] API URL: ${url}, Method: ${method}`);

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`[ManageAdmissionForm] API Response Status: ${String(response.status)}`);

      if (!response.ok) {
        const errorData: ApiErrorResponse = (await response.json().catch(() => ({ error: 'Failed to parse error response from API.' }))) as ApiErrorResponse;
        console.error(`[ManageAdmissionForm] API Error Data:`, errorData);
        throw new Error(errorData.error || `Failed to ${mode} admission. Status: ${String(response.status)}`);
      }

      const responseData: AdmissionResponse = (await response.json()) as AdmissionResponse;
      console.log(`[ManageAdmissionForm] API Success Data:`, responseData);

      console.log(`SUCCESS: Admission ${mode === 'create' ? 'Created' : 'Updated'}. Description: The admission record has been successfully ${mode === 'create' ? 'created' : 'updated'}.`);
      router.push(PATHS.ADMIN_ADMISSIONS);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error(`[ManageAdmissionForm] Error during ${mode} admission:`, error);
      console.error(`ERROR: Error ${mode === 'create' ? 'Creating' : 'Updating'} Admission. Description: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student Selection */}
      <div>
        <Label htmlFor="user_id">Student</Label>
        <Controller
          name="user_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || undefined} disabled={mode === 'edit'}>
              <SelectTrigger id="user_id">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {users && users.length > 0 ? (
                  users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.first_name || ''} ${user.last_name || ''} (${user.email})`.trim()}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-users" disabled>No users available</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.user_id && <p className="text-sm text-red-600 mt-1">{errors.user_id.message}</p>}
      </div>

      {/* Course Selection */}
      <div>
        <Label htmlFor="course_id">Course</Label>
        <Controller
          name="course_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <SelectTrigger id="course_id">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses && courses.length > 0 ? (
                  courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.code}) - {course.degree_type}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.course_id && <p className="text-sm text-red-600 mt-1">{errors.course_id.message}</p>}
      </div>

      {/* Academic Session Selection */}
      <div>
        <Label htmlFor="academic_session_id">Academic Session</Label>
        <Controller
          name="academic_session_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <SelectTrigger id="academic_session_id">
                <SelectValue placeholder="Select an academic session" />
              </SelectTrigger>
              <SelectContent>
                {academicSessions && academicSessions.length > 0 ? (
                  academicSessions.map(session => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.session_name} {session.is_current ? '(Current)' : ''}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-sessions" disabled>No academic sessions available</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.academic_session_id && <p className="text-sm text-red-600 mt-1">{errors.academic_session_id.message}</p>}
      </div>

      {/* Admission Date */}
      <div>
        <Label htmlFor="admission_date">Admission Date</Label>
        <Controller
          name="admission_date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(field.value, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.admission_date && <p className="text-sm text-red-600 mt-1">{errors.admission_date.message}</p>}
      </div>

      {/* Status Selection */}
      <div>
        <Label htmlFor="status">Admission Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ADMISSION_STATUSES).map(statusVal => (
                  <SelectItem key={statusVal} value={statusVal}>
                    {statusVal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            router.back();
          }}
          disabled={isSubmitting}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Admission' : 'Save Changes')}
        </Button>
      </div>
    </form>
  );
};

export default ManageAdmissionForm;