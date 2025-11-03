"use client";

import { useReactTable, createColumnHelper, getCoreRowModel, getSortedRowModel, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define the interface locally since it matches the data structure from your actions
interface QuizResultData {
  quizSessionId: string;
  subject: string;
  exam: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage: string;
  totalTimeSpent: number;
  startTime: string;
  examYear?: number;
}

interface QuizResultsTableProps {
  results: QuizResultData[];
}

const columnHelper = createColumnHelper<QuizResultData>();

export default function QuizResultsTable({ results }: QuizResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "startTime", desc: true }]);

  const columns = [
    columnHelper.accessor("exam", { header: "Exam" }),
    columnHelper.accessor("subject", { header: "Subject" }),
    columnHelper.accessor("totalQuestions", { header: "Total Questions" }),
    columnHelper.accessor("correctAnswers", { header: "Correct" }),
    columnHelper.accessor("percentage", { header: "Score", cell: (info) => `${info.getValue()}%` }),
    columnHelper.accessor("totalTimeSpent", {
      header: "Time Spent",
      cell: (info) => {
        const seconds = info.getValue();
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      },
    }),
    columnHelper.accessor("startTime", { 
      header: "Date", 
      cell: (info) => {
        const date = new Date(info.getValue());
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} ${timeStr}`;
      }
    }),
  ];

  const table = useReactTable({
    data: results,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-auto border border-gray-200 rounded-md" style={{ maxHeight: "600px" }}>
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {header.isPlaceholder
                    ? null
                    : <>{header.column.columnDef.header}{header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}</>}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {cell.column.id === 'startTime' 
                    ? `${new Date(cell.getValue() as string).toLocaleDateString()} ${new Date(cell.getValue() as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : cell.renderValue() as React.ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}