'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Course, AcademicSession } from '@/types/admission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ADMISSION_STATUSES } from '@/lib/constants';
import { X } from 'lucide-react';

interface AdminAdmissionsFiltersProps {
  initialFilters: {
    status?: string;
    courseId?: string;
    sessionId?: string;
    searchTerm?: string;
  };
}

interface CoursesResponse {
  courses: Course[];
}

interface AcademicSessionsResponse {
  academicSessions?: AcademicSession[];
  sessions?: AcademicSession[];
}

const ALL_FILTER_VALUE = 'all';

const AdminAdmissionsFilters: React.FC<AdminAdmissionsFiltersProps> = ({ initialFilters }): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(initialFilters.status || '');
  const [courseId, setCourseId] = useState(initialFilters.courseId || '');
  const [sessionId, setSessionId] = useState(initialFilters.sessionId || '');
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');

  const [courses, setCourses] = useState<Course[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async (): Promise<void> => {
      setIsLoadingDropdowns(true);
      try {
        const [coursesRes, sessionsRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/academic-sessions'),
        ]);
  
        if (coursesRes.ok) {
          const coursesData = (await coursesRes.json()) as CoursesResponse;
          setCourses(coursesData.courses);
        } else {
          console.error('Failed to fetch courses for filter');
          setCourses([]);
        }
  
        if (sessionsRes.ok) {
          const sessionsData = (await sessionsRes.json()) as AcademicSessionsResponse;
          setAcademicSessions(sessionsData.academicSessions || sessionsData.sessions || []);
        } else {
          console.error('Failed to fetch academic sessions for filter');
          setAcademicSessions([]);
        }
      } catch (error) {
        console.error('Error fetching dropdown data for filters:', error);
        setCourses([]);
        setAcademicSessions([]);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    void fetchDropdownData();
  }, []);

  const handleFilterChange = useCallback((): void => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (status) current.set('status', status); else current.delete('status');
    if (courseId) current.set('courseId', courseId); else current.delete('courseId');
    if (sessionId) current.set('sessionId', sessionId); else current.delete('sessionId');
    if (searchTerm) current.set('searchTerm', searchTerm); else current.delete('searchTerm');
    current.set('page', '1');

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }, [status, courseId, sessionId, searchTerm, router, pathname, searchParams]);

  const applyFilters = (): void => {
    handleFilterChange();
  };

  const clearFilters = (): void => {
    setStatus('');
    setCourseId('');
    setSessionId('');
    setSearchTerm('');
    const current = new URLSearchParams();
    current.set('page', '1');
    router.push(`${pathname}?${current.toString()}`);
  };

  return (
    <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div>
          <Label htmlFor="filter-searchTerm" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Ref/Name</Label>
          <Input
            id="filter-searchTerm"
            type="text"
            placeholder="Admission Ref or Student Name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="filter-status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
          <Select
            value={status || ALL_FILTER_VALUE}
            onValueChange={(selectedValue) => {
              setStatus(selectedValue === ALL_FILTER_VALUE ? '' : selectedValue);
            }}
            disabled={isLoadingDropdowns}
          >
            <SelectTrigger id="filter-status" className="mt-1">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Statuses</SelectItem>
              {Object.values(ADMISSION_STATUSES).map(sVal => (
                <SelectItem key={sVal} value={sVal}>
                  {sVal.charAt(0).toUpperCase() + sVal.slice(1).toLowerCase().replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-course" className="text-sm font-medium text-gray-700 dark:text-gray-300">Course</Label>
          <Select
            value={courseId || ALL_FILTER_VALUE}
            onValueChange={(selectedValue) => {
              setCourseId(selectedValue === ALL_FILTER_VALUE ? '' : selectedValue);
            }}
            disabled={isLoadingDropdowns || courses.length === 0}
          >
            <SelectTrigger id="filter-course" className="mt-1">
              <SelectValue placeholder={isLoadingDropdowns ? "Loading..." : "All Courses"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id.toString()} value={course.id.toString()}>
                  {course.name} {course.code ? `(${course.code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-session" className="text-sm font-medium text-gray-700 dark:text-gray-300">Academic Session</Label>
          <Select
            value={sessionId || ALL_FILTER_VALUE}
            onValueChange={(selectedValue) => {
              setSessionId(selectedValue === ALL_FILTER_VALUE ? '' : selectedValue);
            }}
            disabled={isLoadingDropdowns || academicSessions.length === 0}
          >
            <SelectTrigger id="filter-session" className="mt-1">
              <SelectValue placeholder={isLoadingDropdowns ? "Loading..." : "All Sessions"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All Sessions</SelectItem>
              {academicSessions.map(session => (
                <SelectItem key={session.id.toString()} value={session.id.toString()}>
                  {session.session_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button onClick={applyFilters} className="w-full sm:w-auto">Apply Filters</Button>
          <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-1 sm:mr-2" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAdmissionsFilters;