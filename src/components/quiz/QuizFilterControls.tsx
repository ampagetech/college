"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SubjectDropdownAll from "../common/SubjectDropdownAll"; // Import the All version

interface Filters {
  exam: string;
  subject: string;
  startDate: string;
  endDate: string;
}

export default function QuizFilterControls({ filters }: { filters: Filters }) {
  const router = useRouter();
  const [exam, setExam] = useState(filters.exam);
  const [subject, setSubject] = useState(filters.subject);
  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    params.set('exam', exam);
    params.set('subject', subject);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    router.push(`/quiz-results-table?${params.toString()}`);
  };

  // Handle subject change - receives both id and name
  const handleSubjectChange = (id: string, name: string) => {
    setSubject(id); // Store the subject value/id
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={exam} onValueChange={setExam}>
          <SelectTrigger>
            <SelectValue placeholder="Select Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            <SelectItem value="utme">UTME</SelectItem>
            <SelectItem value="post-utme">Post-UTME</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Use the existing SubjectDropdownAll component */}
        <SubjectDropdownAll 
          value={subject} 
          onSubjectChange={handleSubjectChange}
        />
        
        <Input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
        />
        
        <Input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end mt-4">
        <Button type="submit">Show Results</Button>
      </div>
    </form>
  );
}