// src/components/tenants/TenantForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tenant } from '@/types/tenant';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Define the form schema. This remains the same.
const tenantFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  subscription_start: z.date().nullable().optional(),
  subscription_end: z.date().nullable().optional(),
  paid: z.boolean().default(false),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

interface TenantFormProps {
  initialData?: Tenant | null;
  onSubmit: (data: TenantFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  error?: string | null;
}

// Helper to safely parse a string into a Date object
const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export default function TenantForm({ initialData, onSubmit, onCancel, isSaving, error }: TenantFormProps) {
  // CORRECTION 1: Removed the explicit generic <TenantFormData> from useForm.
  // This allows react-hook-form to infer the type directly from the resolver,
  // avoiding the conflict caused by potentially duplicate type definitions.
  const form = useForm({
    resolver: zodResolver(tenantFormSchema),
    // CORRECTION 2: Used nullish coalescing (??) for better handling of null/undefined values.
    // This ensures that nullable fields default to empty strings for the input controls.
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      address: initialData?.address ?? '',
      contact: initialData?.contact ?? '',
      telephone: initialData?.telephone ?? '',
      state: initialData?.state ?? '',
      city: initialData?.city ?? '',
      subscription_start: parseDate(initialData?.subscription_start),
      subscription_end: parseDate(initialData?.subscription_end),
      paid: initialData?.paid ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      // CORRECTION 3: Also updated form.reset to use nullish coalescing for consistency.
      form.reset({
        id: initialData.id,
        name: initialData.name ?? '',
        email: initialData.email ?? '',
        address: initialData.address ?? '',
        contact: initialData.contact ?? '',
        telephone: initialData.telephone ?? '',
        state: initialData.state ?? '',
        city: initialData.city ?? '',
        subscription_start: parseDate(initialData.subscription_start),
        subscription_end: parseDate(initialData.subscription_end),
        paid: initialData.paid ?? false,
      });
    }
  }, [initialData, form]);

  // Helper to convert date to YYYY-MM-DD for the input element
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // The rest of the component remains the same.
  // The {...field} spread will now correctly pass values that are guaranteed to be
  // of the types expected by the input components (e.g., string, not null).
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subscription_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Start</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subscription_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription End</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Subscription Paid</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Tenant'}
          </Button>
        </div>
      </form>
    </Form>
  );
}