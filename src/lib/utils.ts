// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Your existing formatDate
export function formatDate(
  date: string | Date,
  formatOrOptions: string | Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.error('Error formatting date: Invalid date input -', date);
      return 'Invalid Date';
    }

    if (typeof formatOrOptions === 'string') {
      // Placeholder for future support with date-fns or similar libs
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // If it's an Intl.DateTimeFormatOptions object
    return d.toLocaleString('en-US', formatOrOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}




export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString()}m ${remainingSeconds.toString()}s`;
}




// --- ADD THIS FUNCTION ---
export function formatCurrency(amount: number, currency: string = 'NGN'): string { // Default to NGN
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn(`[formatCurrency] Invalid amount received: ${amount}. Returning empty string or 'N/A'.`);
      return 'N/A'; // Or an empty string, or throw an error
    }
    return new Intl.NumberFormat('en-NG', { // 'en-NG' for Naira formatting, adjust locale as needed
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`[formatCurrency] Error formatting currency for amount ${amount} and currency ${currency}:`, error);
    return 'Error formatting currency'; // Or handle more gracefully
  }
}
// --- END OF ADDED FUNCTION ---