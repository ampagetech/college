// src/lib/actions/settings-actions.ts
"use server";
import { createClient } from '@/lib/supabase/server';

export type UniversitySettingsMap = {
  [key: string]: string;
};

export async function getUniversitySettings(): Promise<{ data?: UniversitySettingsMap; error?: string }> {
  const supabase = createClient();
  try {
    const settingKeys = [
      'university_name',
      'university_motto',
      'contact_phone_1',
      'university_website'
    ];

    const { data, error } = await supabase
      .from('university_settings')
      .select('setting_key, setting_value')
      .in('setting_key', settingKeys);

    if (error) throw error;

    const settingsMap = data.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as UniversitySettingsMap);

    return { data: settingsMap };

  } catch (err: any) {
    console.error("Error fetching university settings:", err);
    return { error: err.message || 'Database query failed.' };
  }
}