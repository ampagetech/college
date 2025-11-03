// src/lib/actions/payments-info.ts
"use server";

import { createClient } from '@/lib/supabase/server';

export type BankInfo = {
  "Bank Name": string;
  "Account No": string;
  "Account Name": string;
};

export async function getBankDetails(): Promise<{ data?: BankInfo[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('university_settings')
      .select('setting_key, setting_value')
      .or('setting_key.ilike.bank_%_name,setting_key.ilike.bank_%_account_number');

    if (error) {
      console.error("Supabase Error: Failed to fetch raw bank settings.", error);
      return { error: `Database Error: ${error.message}` };
    }
    
    // For debugging: Let's see what the database actually returned.
    // Check your server's terminal logs for this output.
    console.log("Raw bank settings from Supabase:", data);

    if (!data || data.length === 0) {
      console.log("No bank settings found in the database matching the query.");
      return { data: [] };
    }

    const bankMap: { [key: string]: Partial<BankInfo> } = {};

    data.forEach(item => {
      let identifier = '';

      // --- START OF FIX ---
      // This is the corrected, more robust logic for creating the identifier.
      if (item.setting_key.endsWith('_name')) {
        identifier = item.setting_key.replace('_name', '');
      } else if (item.setting_key.endsWith('_account_number')) {
        identifier = item.setting_key.replace('_account_number', '');
      }
      // --- END OF FIX ---

      // If we couldn't determine an identifier, skip this item.
      if (!identifier) return;

      if (!bankMap[identifier]) {
        bankMap[identifier] = { "Account Name": "Jewel University" };
      }

      if (item.setting_key.endsWith('_name')) {
        bankMap[identifier]["Bank Name"] = item.setting_value;
      } else if (item.setting_key.endsWith('_account_number')) {
        bankMap[identifier]["Account No"] = item.setting_value;
      }
    });

    const bankDetails = Object.values(bankMap).filter(
      (bank): bank is BankInfo =>
        !!bank["Bank Name"] && !!bank["Account No"]
    );

    bankDetails.sort((a, b) => a["Bank Name"].localeCompare(b["Bank Name"]));
    
    // For debugging: Let's see the final processed data.
    console.log("Processed bank details to be sent to client:", bankDetails);

    return { data: bankDetails };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    console.error('Error in getBankDetails:', err);
    return { error: message };
  }
}