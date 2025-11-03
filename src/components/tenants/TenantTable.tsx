// src/components/tenants/TenantTable.tsx
"use client";

import React, { useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender,
  SortingState,
  type Table as TableType
} from "@tanstack/react-table";
import { Tenant, TenantFormData } from '@/types/tenant';
import { saveTenant } from '@/app/(dashboard)/tenants89asdf11/actions';
import { columns } from './columns';
import TenantForm from './TenantForm';
import { useToast } from "@/components/ui/use-toast";

// Import UI components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

interface TenantTableProps {
  initialData: Tenant[];
}

// Define the table meta type for this specific table
interface TenantTableMeta {
  openEditModal: (tenant: Tenant) => void;
}

export default function TenantTable({ initialData }: TenantTableProps) {
  const { toast } = useToast();
  const [data, setData] = useState<Tenant[]>(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: { 
      sorting, 
      globalFilter 
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      openEditModal: (tenant: Tenant) => {
        setEditingTenant(tenant);
        setIsModalOpen(true);
      },
    } as TenantTableMeta,
  });

  const handleOpenAddModal = () => {
    setEditingTenant(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setError(null);
  };

  const handleSaveTenant = async (formData: TenantFormData) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveTenant(formData);

      if (result.success) {
        toast({
          title: "Success!",
          description: `Tenant has been ${formData.id ? 'updated' : 'created'}.`,
          variant: "default", // Changed from "success" to "default"
        });
        
        // Update local data if needed (or let server action handle revalidation)
        if (result.data) {
          if (formData.id) {
            // Update existing tenant
            setData(prev => prev.map(tenant => 
              tenant.id === formData.id ? result.data : tenant
            ));
          } else {
            // Add new tenant
            setData(prev => [...prev, result.data]);
          }
        }
        
        handleCloseModal();
      } else {
        setError(result.error || "An unexpected error occurred.");
        toast({
          title: "Error",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manage Tenants</CardTitle>
          <Button onClick={handleOpenAddModal} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Tenant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search all tenants..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No tenants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
            </DialogTitle>
          </DialogHeader>
          <TenantForm
            initialData={editingTenant}
            onSubmit={handleSaveTenant}
            onCancel={handleCloseModal}
            isSaving={isSaving}
            error={error}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}