// src/components/common/RowsPerPageSelector.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

// Define the props the component will accept
interface RowsPerPageSelectorProps {
  /** The default number of items to show per page if not specified in the URL. */
  defaultLimit?: number;
  /** An array of numbers to show as options in the dropdown. */
  options?: number[];
}

const defaultOptions = [10, 20, 50, 100];

export default function RowsPerPageSelector({
  defaultLimit = 10,
  options = defaultOptions,
}: RowsPerPageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read the current limit from the URL, or fall back to the provided default
  const currentLimit = searchParams.get('limit') || String(defaultLimit);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set('limit', newLimit);
    // When changing the number of items, it's best practice to go back to page 1
    params.set('page', '1'); 
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="rows-per-page" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Rows per page:
      </label>
      <select
        id="rows-per-page"
        value={currentLimit}
        onChange={handleLimitChange}
        disabled={isPending}
        className="block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}