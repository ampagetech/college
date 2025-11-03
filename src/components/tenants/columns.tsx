// src/components/tenants/columns.tsx
"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Tenant } from '@/types/tenant';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Edit } from "lucide-react";

// Use generic type parameters to match TanStack Table's expected interface
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends unknown> {
    openEditModal?: (tenant: TData) => void;
  }
}

const columnHelper = createColumnHelper<Tenant>();

export const columns = [
  // --- Name Column (Increased Width) ---
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => <div className="pl-4 font-medium">{info.getValue()}</div>,
    size: 300,
  }),

  // --- Paid Column ---
  columnHelper.accessor("paid", {
    header: "Paid",
    cell: (info) => (
      <Badge 
        variant={info.getValue() ? "default" : "destructive"} 
        className={`capitalize ${info.getValue() ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
      >
        {info.getValue() ? "Yes" : "No"}
      </Badge>
    ),
    size: 80,
    enableSorting: false,
  }),

  // --- State Column ---
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => info.getValue() || "-",
    size: 150,
  }),

  // --- Subscription End Column ---
  columnHelper.accessor("subscription_end", {
    header: "Sub End",
    cell: (info) => {
      const dateValue = info.getValue();
      try {
        return dateValue ? new Date(dateValue).toLocaleDateString() : "-";
      } catch (e) {
        return dateValue || "-";
      }
    },
    size: 120,
  }),

  // --- Action Column ---
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right pr-4">Actions</div>,
    cell: ({ row, table }) => (
      <div className="text-right pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.options.meta?.openEditModal?.(row.original)}
          aria-label="Edit Tenant"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
    size: 80,
  }),
];