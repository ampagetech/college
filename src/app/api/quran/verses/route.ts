// src/app/api/quran/verses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

interface VerseRequest {
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  qiraa: 'hafs' | 'warsh';
}

export async function POST(request: NextRequest) {
  try {
    const body: VerseRequest = await request.json();
    const { startChapter, startVerse, endChapter, endVerse, qiraa } = body;

    // Validate input
    if (!startChapter || !startVerse || !endChapter || !endVerse) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    if (!['hafs', 'warsh'].includes(qiraa)) {
      return NextResponse.json({ 
        error: 'Invalid qiraa. Must be hafs or warsh' 
      }, { status: 400 });
    }

    if (startChapter < 1 || startChapter > 114 || endChapter < 1 || endChapter > 114) {
      return NextResponse.json({ 
        error: 'Invalid chapter number. Must be between 1 and 114' 
      }, { status: 400 });
    }

    if (startChapter > endChapter || (startChapter === endChapter && startVerse > endVerse)) {
      return NextResponse.json({ 
        error: 'Invalid verse range: start must be before or equal to end' 
      }, { status: 400 });
    }

    console.log(`Loading verses: ${startChapter}:${startVerse} - ${endChapter}:${endVerse} (${qiraa})`);

    const allVerses: QuranVerse[] = [];
    
    // Load verses from all chapters in the range
    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
      try {
        const chapterVerses = await loadChapterFromFile(chapter, qiraa);
        
        // Filter verses based on the range - FIXED: More precise filtering
        const filteredVerses = chapterVerses.filter(verse => {
          // Ensure verse belongs to the correct chapter
          if (verse.sura_no !== chapter) {
            return false;
          }

          if (chapter === startChapter && chapter === endChapter) {
            // Same chapter: filter by verse range (INCLUSIVE)
            return verse.aya_no >= startVerse && verse.aya_no <= endVerse;
          } else if (chapter === startChapter) {
            // First chapter: from startVerse to end of chapter
            return verse.aya_no >= startVerse;
          } else if (chapter === endChapter) {
            // Last chapter: from beginning to endVerse (INCLUSIVE)
            return verse.aya_no <= endVerse;
          } else {
            // Middle chapters: all verses
            return true;
          }
        });
        
        console.log(`Chapter ${chapter}: Found ${chapterVerses.length} total verses, filtered to ${filteredVerses.length} verses`);
        
        if (filteredVerses.length === 0) {
          console.warn(`No verses found for chapter ${chapter} in range ${startVerse}-${endVerse}`);
        }
        
        allVerses.push(...filteredVerses);
        
      } catch (error) {
        console.error(`Error loading chapter ${chapter}:`, error);
        return NextResponse.json({ 
          error: `Failed to load chapter ${chapter}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }
    
    if (allVerses.length === 0) {
      return NextResponse.json({ 
        error: 'No verses found for the selected range. Please check your selection.' 
      }, { status: 404 });
    }

    // Sort verses to ensure correct order
    allVerses.sort((a, b) => {
      if (a.sura_no !== b.sura_no) {
        return a.sura_no - b.sura_no;
      }
      return a.aya_no - b.aya_no;
    });
    
    // Combine texts
    const simpleText = allVerses
      .map(verse => verse.text_simple?.trim())
      .filter(text => text && text.length > 0)
      .join(' ');
    
    const tashkeelText = allVerses
      .map(verse => verse.text_tashkeel?.trim())
      .filter(text => text && text.length > 0)
      .join(' ');

    if (!simpleText || !tashkeelText) {
      return NextResponse.json({ 
        error: 'Empty verse texts found. Please check the data files.' 
      }, { status: 500 });
    }
    
    // Create reference string
    const reference = startChapter === endChapter 
      ? (startVerse === endVerse 
          ? `${startChapter}:${startVerse}` 
          : `${startChapter}:${startVerse}-${endVerse}`)
      : `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`;
    
    const result = {
      verses: allVerses,
      simpleText: simpleText.trim(),
      tashkeelText: tashkeelText.trim(),
      verseCount: allVerses.length,
      reference
    };

    console.log(`Successfully loaded ${allVerses.length} verses for range ${reference}`);
    console.log(`Sample text: ${simpleText.substring(0, 100)}...`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Verses API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load verses' },
      { status: 500 }
    );
  }
}

async function loadChapterFromFile(chapterNumber: number, qiraa: 'hafs' | 'warsh'): Promise<QuranVerse[]> {
  try {
    // Format chapter number with leading zeros (001, 002, etc.)
    const formattedChapter = chapterNumber.toString().padStart(3, '0');
    const filename = `${qiraa}_${formattedChapter}.json`;
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'lib', 'data', 'quran', filename),
      path.join(process.cwd(), 'public', 'data', 'quran', filename),
      path.join(process.cwd(), 'data', 'quran', filename),
      path.join(process.cwd(), 'public', 'quran', filename),
    ];
    
    let fileContent: string = '';
    let usedPath: string = '';
    
    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath);
        fileContent = await fs.readFile(filePath, 'utf8');
        usedPath = filePath;
        console.log(`Successfully loaded ${filename} from ${filePath}`);
        break;
      } catch (error) {
        // Continue to next path
        continue;
      }
    }
    
    if (!fileContent) {
      throw new Error(`File not found: ${filename}. Tried paths: ${possiblePaths.join(', ')}`);
    }
    
    // Parse and validate the file
    let verses: QuranVerse[];
    try {
      verses = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON in ${filename}: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
    }
    
    if (!Array.isArray(verses)) {
      throw new Error(`Data in ${filename} is not an array`);
    }
    
    if (verses.length === 0) {
      throw new Error(`No verses found in ${filename}`);
    }

    // Validate verse structure
    const validVerses = verses.filter(verse => 
      verse && 
      typeof verse.aya_no === 'number' &&
      typeof verse.sura_no === 'number' &&
      verse.text_simple &&
      verse.text_tashkeel
    );

    if (validVerses.length === 0) {
      throw new Error(`No valid verses found in ${filename}`);
    }

    if (validVerses.length !== verses.length) {
      console.warn(`${filename}: Found ${verses.length - validVerses.length} invalid verses out of ${verses.length}`);
    }
    
    return validVerses;
    
  } catch (error: any) {
    console.error(`Error loading chapter ${chapterNumber} (${qiraa}):`, error);
    throw new Error(`Failed to load chapter ${chapterNumber}: ${error.message}`);
  }
}