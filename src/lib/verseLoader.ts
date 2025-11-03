// src/lib/verseLoader.ts
import { VerseRange } from '@/stores/verseSelectionStore';

export interface QuranVerse {
  id: number;
  jozz: number;
  page: number;
  line_start: number;
  line_end: number;
  aya_no: number;
  text_tashkeel: string;
  text_simple: string;
  sura_no: number;
  sura_name_en: string;
  sura_name_ar: string;
}

export interface VerseText {
  verses: QuranVerse[];
  simpleText: string; // Combined text_simple for LLM comparison
  tashkeelText: string; // Combined text_tashkeel for display
  verseCount: number;
  reference: string;
}

/**
 * Load verses using API route (recommended) or fallback to direct file access
 */
export async function loadVerses(range: VerseRange, qiraa: 'hafs' | 'warsh'): Promise<VerseText> {
  try {
    const { startChapter, startVerse, endChapter, endVerse } = range;
    
    // Validate input range
    const validation = validateVerseRange(range);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    console.log(`Loading verses for range: ${startChapter}:${startVerse} - ${endChapter}:${endVerse} (${qiraa})`);
    
    // Try API route first (recommended)
    try {
      const response = await fetch('/api/quran/verses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startChapter,
          startVerse,
          endChapter,
          endVerse,
          qiraa
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Successfully loaded ${result.verseCount} verses via API`);
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      console.warn('API route failed, trying direct file access:', errorMessage);
      
      // Fallback to direct file access
      return await loadVersesDirectly(range, qiraa);
    }
    
  } catch (error) {
    console.error('Error loading verses:', error);
    throw error;
  }
}

/**
 * Direct file access fallback
 */
async function loadVersesDirectly(range: VerseRange, qiraa: 'hafs' | 'warsh'): Promise<VerseText> {
  const { startChapter, startVerse, endChapter, endVerse } = range;
  const allVerses: QuranVerse[] = [];
  
  // Load all chapters in the range
  for (let chapterNum = startChapter; chapterNum <= endChapter; chapterNum++) {
    const chapterVerses = await loadChapterVerses(chapterNum, qiraa);
    
    // Filter verses based on the range
    let filteredVerses = chapterVerses;
    
    if (chapterNum === startChapter && chapterNum === endChapter) {
      // Same chapter: filter by both start and end verse
      filteredVerses = chapterVerses.filter(v => v.aya_no >= startVerse && v.aya_no <= endVerse);
    } else if (chapterNum === startChapter) {
      // First chapter: filter from start verse onwards
      filteredVerses = chapterVerses.filter(v => v.aya_no >= startVerse);
    } else if (chapterNum === endChapter) {
      // Last chapter: filter up to end verse
      filteredVerses = chapterVerses.filter(v => v.aya_no <= endVerse);
    }
    // Middle chapters: include all verses (no filtering needed)
    
    allVerses.push(...filteredVerses);
  }
  
  if (allVerses.length === 0) {
    throw new Error('No verses found for the specified range');
  }
  
  // Combine texts
  const simpleText = allVerses.map(v => v.text_simple).join(' ');
  const tashkeelText = allVerses.map(v => v.text_tashkeel).join(' ');
  
  // Generate reference
  const reference = startChapter === endChapter 
    ? `${getChapterName(startChapter)}:${startVerse}-${endVerse}`
    : `${getChapterName(startChapter)}:${startVerse} - ${getChapterName(endChapter)}:${endVerse}`;
  
  return {
    verses: allVerses,
    simpleText,
    tashkeelText,
    verseCount: allVerses.length,
    reference
  };
}

/**
 * Load a single chapter's verses from JSON file
 */
async function loadChapterVerses(chapterNumber: number, qiraa: 'hafs' | 'warsh'): Promise<QuranVerse[]> {
  try {
    // Format chapter number with leading zeros (001, 002, etc.)
    const formattedChapter = chapterNumber.toString().padStart(3, '0');
    const filename = `${qiraa}_${formattedChapter}.json`;
    
    // Try multiple possible paths (public folder paths don't need /public prefix)
    const possiblePaths = [
      `/quran/${filename}`,                // Public folder: /public/quran/
      `/data/quran/${filename}`,           // Public folder: /public/data/quran/
      `/data/${filename}`,                 // Public folder: /public/data/
      `/api/quran/data/${filename}`,       // API route fallback
    ];
    
    console.log(`Attempting to load chapter ${chapterNumber} (${qiraa})`);
    
    let lastError: Error | null = null;
    
    for (const filePath of possiblePaths) {
      try {
        console.log(`Trying path: ${filePath}`);
        
        const response = await fetch(filePath, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.text();
          
          if (!data || data.trim().length === 0) {
            throw new Error('Empty response from server');
          }
          
          let verses: QuranVerse[];
          try {
            verses = JSON.parse(data);
          } catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            throw new Error(`Invalid JSON format: ${errorMessage}`);
          }
          
          if (!Array.isArray(verses)) {
            throw new Error('Data is not an array of verses');
          }
          
          if (verses.length === 0) {
            throw new Error('No verses found in the file');
          }
          
          // Validate verse structure
          const invalidVerses = verses.filter(verse => 
            !verse || 
            typeof verse.aya_no !== 'number' ||
            typeof verse.sura_no !== 'number' ||
            !verse.text_simple ||
            !verse.text_tashkeel
          );
          
          if (invalidVerses.length > 0) {
            console.warn(`Found ${invalidVerses.length} invalid verses in chapter ${chapterNumber}`);
          }
          
          // Filter out invalid verses and log success
          const validVerses = verses.filter(verse => 
            verse && 
            typeof verse.aya_no === 'number' &&
            typeof verse.sura_no === 'number' &&
            verse.text_simple &&
            verse.text_tashkeel
          );
          
          if (validVerses.length === 0) {
            throw new Error('No valid verses found after validation');
          }
          
          console.log(`Successfully loaded ${validVerses.length} verses from ${filePath}`);
          return validVerses;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Failed to load from ${filePath}:`, errorMessage);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue; // Try next path
      }
    }
    
    // If we get here, all paths failed
    throw new Error(
      `Failed to load chapter ${chapterNumber} (${qiraa}) from any path. ` +
      `Last error: ${lastError?.message || 'Unknown error'}. ` +
      `Please ensure the file '${filename}' exists in one of these locations: ` +
      possiblePaths.join(', ')
    );
    
  } catch (error) {
    console.error(`Error loading chapter ${chapterNumber} (${qiraa}):`, error);
    throw error;
  }
}

/**
 * Get chapter name by number
 */
export function getChapterName(chapterNumber: number, language: 'en' | 'ar' = 'en'): string {
  // This could be enhanced by loading from a separate chapters.json file
  const chapterNames: Record<number, { en: string; ar: string }> = {
    1: { en: "Al-FÄtiá¸¥ah", ar: "Ø§Ù„ÙÙŽØ§ØªÙØ­Ø©" },
    2: { en: "Al-Baqarah", ar: "Ø§Ù„Ø¨Ù‚Ø±Ø©" },
    3: { en: "Ä€l Ê¿ImrÄn", ar: "Ø¢Ù„ Ø¹Ù…Ø±Ø§Ù†" },
    4: { en: "An-NisÄ'", ar: "Ø§Ù„Ù†Ø³Ø§Ø¡" },
    5: { en: "Al-MÄ'idah", ar: "Ø§Ù„Ù…Ø§Ø¦Ø¯Ø©" },
    6: { en: "Al-AnÊ¿Äm", ar: "Ø§Ù„Ø£Ù†Ø¹Ø§Ù…" },
    7: { en: "Al-AÊ¿rÄf", ar: "Ø§Ù„Ø£Ø¹Ø±Ø§Ù" },
    8: { en: "Al-AnfÄl", ar: "Ø§Ù„Ø£Ù†ÙØ§Ù„" },
    9: { en: "At-Tawbah", ar: "Ø§Ù„ØªÙˆØ¨Ø©" },
    10: { en: "YÅ«nus", ar: "ÙŠÙˆÙ†Ø³" },
    // Add more as needed, or load from a separate file
  };
  
  const chapter = chapterNames[chapterNumber];
  if (!chapter) {
    return language === 'ar' ? `Ø³ÙˆØ±Ø© ${chapterNumber}` : `Chapter ${chapterNumber}`;
  }
  
  return chapter[language];
}

/**
 * Clean Arabic text for comparison (remove diacritics, normalize)
 */
export function cleanArabicText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove diacritics
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    // Remove verse numbers
    .replace(/[Ù -Ù©]+/g, '')
    .replace(/[0-9]+/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two Arabic texts (basic implementation)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const clean1 = cleanArabicText(text1).split(' ').filter(word => word.length > 0);
  const clean2 = cleanArabicText(text2).split(' ').filter(word => word.length > 0);
  
  const longer = clean1.length > clean2.length ? clean1 : clean2;
  const shorter = clean1.length > clean2.length ? clean2 : clean1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  shorter.forEach(word => {
    if (longer.includes(word)) {
      matches++;
    }
  });
  
  return matches / longer.length;
}

/**
 * Validate verse range
 */
export function validateVerseRange(range: VerseRange): { isValid: boolean; error?: string } {
  const { startChapter, startVerse, endChapter, endVerse } = range;
  
  if (!startChapter || !startVerse || !endChapter || !endVerse) {
    return { isValid: false, error: 'All fields are required' };
  }
  
  if (startChapter < 1 || startChapter > 114 || endChapter < 1 || endChapter > 114) {
    return { isValid: false, error: 'Chapter numbers must be between 1 and 114' };
  }
  
  if (startChapter > endChapter) {
    return { isValid: false, error: 'Start chapter cannot be after end chapter' };
  }
  
  if (startChapter === endChapter && startVerse > endVerse) {
    return { isValid: false, error: 'Start verse cannot be after end verse in the same chapter' };
  }
  
  return { isValid: true };
}