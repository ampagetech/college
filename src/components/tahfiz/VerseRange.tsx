// src/components/tahfiz/VerseSelector.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, RotateCcw } from 'lucide-react';
import { useVerseSelectionStore, VerseRange } from '@/stores/verseSelectionStore';

type QiraaType = 'hafs' | 'warsh';

interface CompactVerseSelectorProps {
  className?: string;
}

// Simplified Quran chapters list

const quranChapters = [
  { number: 1, name: "الفَاتِحَة", verses: 7 },
  { number: 2, name: "البَقَرَة", verses: 286 },
  { number: 3, name: "آلِ عِمرَان", verses: 200 },
  { number: 4, name: "النِّسَاء", verses: 176 },
  { number: 5, name: "المَائِدَة", verses: 120 },
  { number: 6, name: "الأَنعَام", verses: 165 },
  { number: 7, name: "الأَعرَاف", verses: 206 },
  { number: 8, name: "الأَنفَال", verses: 75 },
  { number: 9, name: "التَّوبَة", verses: 129 },
  { number: 10, name: "يُونُس", verses: 109 },
  { number: 11, name: "هُود", verses: 123 },
  { number: 12, name: "يُوسُف", verses: 111 },
  { number: 13, name: "الرَّعْد", verses: 43 },
  { number: 14, name: "إِبْرَاهِيم", verses: 52 },
  { number: 15, name: "الحِجْر", verses: 99 },
  { number: 16, name: "النَّحْل", verses: 128 },
  { number: 17, name: "الإِسْرَاء", verses: 111 },
  { number: 18, name: "الكَهْف", verses: 110 },
  { number: 19, name: "مَرْيَم", verses: 98 },
  { number: 20, name: "طَه", verses: 135 },
  { number: 21, name: "الأَنْبِيَاء", verses: 112 },
  { number: 22, name: "الحَجّ", verses: 78 },
  { number: 23, name: "المُؤْمِنُون", verses: 118 },
  { number: 24, name: "النُّور", verses: 64 },
  { number: 25, name: "الفُرْقَان", verses: 77 },
  { number: 26, name: "الشُّعَرَاء", verses: 227 },
  { number: 27, name: "النَّمْل", verses: 93 },
  { number: 28, name: "القَصَص", verses: 88 },
  { number: 29, name: "العَنكَبُوت", verses: 69 },
  { number: 30, name: "الرُّوم", verses: 60 },
  { number: 31, name: "لُقْمَان", verses: 34 },
  { number: 32, name: "السَّجْدَة", verses: 30 },
  { number: 33, name: "الأَحْزَاب", verses: 73 },
  { number: 34, name: "سَبَإ", verses: 54 },
  { number: 35, name: "فَاطِر", verses: 45 },
  { number: 36, name: "يَس", verses: 83 },
  { number: 37, name: "الصَّافَّات", verses: 182 },
  { number: 38, name: "ص", verses: 88 },
  { number: 39, name: "الزُّمَر", verses: 75 },
  { number: 40, name: "غَافِر", verses: 85 },
  { number: 41, name: "فُصِّلَت", verses: 54 },
  { number: 42, name: "الشُّورَى", verses: 53 },
  { number: 43, name: "الزُّخْرُف", verses: 89 },
  { number: 44, name: "الدُّخَان", verses: 59 },
  { number: 45, name: "الجَاثِيَة", verses: 37 },
  { number: 46, name: "الأَحْقَاف", verses: 35 },
  { number: 47, name: "مُحَمَّد", verses: 38 },
  { number: 48, name: "الفَتْح", verses: 29 },
  { number: 49, name: "الحُجُرَات", verses: 18 },
  { number: 50, name: "ق", verses: 45 },
  { number: 51, name: "الذَّارِيَات", verses: 60 },
  { number: 52, name: "الطُّور", verses: 49 },
  { number: 53, name: "النَّجْم", verses: 62 },
  { number: 54, name: "القَمَر", verses: 55 },
  { number: 55, name: "الرَّحْمَٰن", verses: 78 },
  { number: 56, name: "الوَاقِعَة", verses: 96 },
  { number: 57, name: "الحَدِيد", verses: 29 },
  { number: 58, name: "المُجَادَلَة", verses: 22 },
  { number: 59, name: "الحَشْر", verses: 24 },
  { number: 60, name: "المُمتحَنَة", verses: 13 },
  { number: 61, name: "الصَّفّ", verses: 14 },
  { number: 62, name: "الجُمُعَة", verses: 11 },
  { number: 63, name: "المُنَافِقُون", verses: 11 },
  { number: 64, name: "التَّغَابُن", verses: 18 },
  { number: 65, name: "الطَّلَاق", verses: 12 },
  { number: 66, name: "التَّحْرِيم", verses: 12 },
  { number: 67, name: "المُلْك", verses: 30 },
  { number: 68, name: "القَلَم", verses: 52 },
  { number: 69, name: "الحَاقَّة", verses: 52 },
  { number: 70, name: "المَعَارِج", verses: 44 },
  { number: 71, name: "نُوح", verses: 28 },
  { number: 72, name: "الجِنّ", verses: 28 },
  { number: 73, name: "المُزَّمِّل", verses: 20 },
  { number: 74, name: "المُدَّثِّر", verses: 56 },
  { number: 75, name: "القِيَامَة", verses: 40 },
  { number: 76, name: "الإِنسَان", verses: 31 },
  { number: 77, name: "المُرْسَلَات", verses: 50 },
  { number: 78, name: "النَّبَأ", verses: 40 },
  { number: 79, name: "النَّازِعَات", verses: 46 },
  { number: 80, name: "عَبَسَ", verses: 42 },
  { number: 81, name: "التَّكْوِير", verses: 29 },
  { number: 82, name: "الانفِطَار", verses: 19 },
  { number: 83, name: "المُطَفِّفِين", verses: 36 },
  { number: 84, name: "الانشِقَاق", verses: 25 },
  { number: 85, name: "البُرُوج", verses: 22 },
  { number: 86, name: "الطَّارِق", verses: 17 },
  { number: 87, name: "الأَعْلَى", verses: 19 },
  { number: 88, name: "الغَاشِيَة", verses: 26 },
  { number: 89, name: "الفَجْر", verses: 30 },
  { number: 90, name: "البَلَد", verses: 20 },
  { number: 91, name: "الشَّمْس", verses: 15 },
  { number: 92, name: "اللَّيْل", verses: 21 },
  { number: 93, name: "الضُّحَى", verses: 11 },
  { number: 94, name: "الشَّرْح", verses: 8 },
  { number: 95, name: "التِّين", verses: 8 },
  { number: 96, name: "العَلَق", verses: 19 },
  { number: 97, name: "القَدْر", verses: 5 },
  { number: 98, name: "البَيِّنَة", verses: 8 },
  { number: 99, name: "الزَّلْزَلَة", verses: 8 },
  { number: 100, name: "العَادِيَات", verses: 11 },
  { number: 101, name: "القَارِعَة", verses: 11 },
  { number: 102, name: "التَّكَاثُر", verses: 8 },
  { number: 103, name: "العَصْر", verses: 3 },
  { number: 104, name: "الهُمَزَة", verses: 9 },
  { number: 105, name: "الفِيل", verses: 5 },
  { number: 106, name: "قُرَيْش", verses: 4 },
  { number: 107, name: "المَاعُون", verses: 7 },
  { number: 108, name: "الكَوْثَر", verses: 3 },
  { number: 109, name: "الكَافِرُون", verses: 6 },
  { number: 110, name: "النَّصْر", verses: 3 },
  { number: 111, name: "المَسَد", verses: 5 },
  { number: 112, name: "الإِخْلَاص", verses: 4 },
  { number: 113, name: "الفَلَق", verses: 5 },
  { number: 114, name: "النَّاس", verses: 6 },
];


const qiraaOptions = [
  { id: 'hafs', name: 'Hafs', description: 'Hafs an Asim' },
  { id: 'warsh', name: 'Warsh', description: 'Warsh an Nafi' }
];

const CompactVerseSelector: React.FC<CompactVerseSelectorProps> = ({ className = '' }) => {
  const { selectedRange, setSelectedRange } = useVerseSelectionStore();
  const [qiraa, setQiraa] = useState<QiraaType>('hafs');
  
  const [startChapter, setStartChapter] = useState(selectedRange.startChapter);
  const [startVerse, setStartVerse] = useState(selectedRange.startVerse);
  const [endChapter, setEndChapter] = useState(selectedRange.endChapter);
  const [endVerse, setEndVerse] = useState(selectedRange.endVerse);

  // Get max verses for a chapter
  const getMaxVerses = (chapterNumber: number) => {
    const chapter = quranChapters.find(c => c.number === chapterNumber);
    return chapter ? chapter.verses : 1;
  };

  // Get chapter name
  const getChapterName = (chapterNumber: number) => {
    const chapter = quranChapters.find(c => c.number === chapterNumber);
    return chapter ? chapter.name : `Chapter ${chapterNumber}`;
  };

  // Update store when local state changes
  useEffect(() => {
    const newRange = { startChapter, startVerse, endChapter, endVerse };
    setSelectedRange(newRange);
  }, [startChapter, startVerse, endChapter, endVerse, setSelectedRange]);

  // Handle start chapter change
  const handleStartChapterChange = (chapterStr: string) => {
    const chapter = parseInt(chapterStr);
    setStartChapter(chapter);
    setStartVerse(1);
    
    // Adjust end if needed
    if (endChapter < chapter) {
      setEndChapter(chapter);
      setEndVerse(getMaxVerses(chapter));
    }
  };

  // Handle end chapter change
  const handleEndChapterChange = (chapterStr: string) => {
    const chapter = parseInt(chapterStr);
    setEndChapter(chapter);
    setEndVerse(getMaxVerses(chapter));
    
    // Adjust start if needed
    if (startChapter > chapter) {
      setStartChapter(chapter);
      setStartVerse(1);
    }
  };

  // Handle verse input changes with validation
  const handleVerseChange = (type: 'startVerse' | 'endVerse', value: string) => {
    const numValue = parseInt(value) || 1;
    
    if (type === 'startVerse') {
      const maxVerse = startChapter === endChapter ? endVerse : getMaxVerses(startChapter);
      const validValue = Math.max(1, Math.min(numValue, maxVerse));
      setStartVerse(validValue);
    } else {
      const minVerse = startChapter === endChapter ? startVerse : 1;
      const validValue = Math.max(minVerse, Math.min(numValue, getMaxVerses(endChapter)));
      setEndVerse(validValue);
    }
  };

  // Reset to Al-Fatihah
  const handleReset = () => {
    setStartChapter(1);
    setStartVerse(1);
    setEndChapter(1);
    setEndVerse(7);
  };

  // Format range display
  const formatRangeDisplay = () => {
    if (startChapter === endChapter) {
      return {
        title: getChapterName(startChapter),
        subtitle: `Verses ${startVerse}-${endVerse}`,
        reference: `${startChapter}:${startVerse}-${endVerse}`
      };
    } else {
      return {
        title: `${getChapterName(startChapter)} to ${getChapterName(endChapter)}`,
        subtitle: `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`,
        reference: `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`
      };
    }
  };

  const rangeDisplay = formatRangeDisplay();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Tahfiz</h1>
        <p className="text-gray-600 text-sm">Quran Memorization & Study Tools</p>
      </div>

      {/* Controls Row */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Start Position */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-green-700">Start</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Select value={startChapter.toString()} onValueChange={handleStartChapterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quranChapters.map(chapter => (
                        <SelectItem key={chapter.number} value={chapter.number.toString()}>
                          <span className="text-xs">{chapter.number}. {chapter.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={startVerse}
                    onChange={(e) => handleVerseChange('startVerse', e.target.value)}
                    min={1}
                    max={startChapter === endChapter ? endVerse : getMaxVerses(startChapter)}
                    className="h-8 text-xs text-center"
                    placeholder="Verse"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Max: {getMaxVerses(startChapter)}
              </div>
            </div>

            {/* End Position */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-red-700">End</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Select value={endChapter.toString()} onValueChange={handleEndChapterChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quranChapters.filter(c => c.number >= startChapter).map(chapter => (
                        <SelectItem key={chapter.number} value={chapter.number.toString()}>
                          <span className="text-xs">{chapter.number}. {chapter.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={endVerse}
                    onChange={(e) => handleVerseChange('endVerse', e.target.value)}
                    min={startChapter === endChapter ? startVerse : 1}
                    max={getMaxVerses(endChapter)}
                    className="h-8 text-xs text-center"
                    placeholder="Verse"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Max: {getMaxVerses(endChapter)}
              </div>
            </div>

            {/* Qiraa Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-purple-700">Qira'a</Label>
              <Select value={qiraa} onValueChange={(value: QiraaType) => setQiraa(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qiraaOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="text-xs">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-gray-500 text-xs">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 text-center">
                Reading variant
              </div>
            </div>

            {/* Actions & Display */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Actions</Label>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full h-8 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Al-Fatihah default
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Selection Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-900 font-medium">{rangeDisplay.title}</div>
          <div className="text-sm text-blue-700">{rangeDisplay.subtitle}</div>
          <div className="text-xs text-blue-600 font-mono">{rangeDisplay.reference}</div>
          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {qiraaOptions.find(q => q.id === qiraa)?.name}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactVerseSelector;