// src/components/tahfiz/VerseRangeModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BookOpen, RotateCcw } from 'lucide-react';
import { useVerseSelectionStore, VerseRange } from '@/stores/verseSelectionStore';

interface VerseRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Quran chapter data with verse counts
const quranChapters = [
  { number: 1, name: "Al-Fatihah", verses: 7 },
  { number: 2, name: "Al-Baqarah", verses: 286 },
  { number: 3, name: "Ali 'Imran", verses: 200 },
  { number: 4, name: "An-Nisa", verses: 176 },
  { number: 5, name: "Al-Ma'idah", verses: 120 },
  // Add more chapters as needed - this is a simplified list
  // In production, you'd want the complete list of 114 chapters
];

const VerseRangeModal: React.FC<VerseRangeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { selectedRange, setSelectedRange, resetToDefault } = useVerseSelectionStore();
  
  const [startChapter, setStartChapter] = useState(selectedRange.startChapter);
  const [startVerse, setStartVerse] = useState(selectedRange.startVerse);
  const [endChapter, setEndChapter] = useState(selectedRange.endChapter);
  const [endVerse, setEndVerse] = useState(selectedRange.endVerse);

  // Get max verses for a chapter
  const getMaxVerses = (chapterNumber: number) => {
    const chapter = quranChapters.find(c => c.number === chapterNumber);
    return chapter ? chapter.verses : 1;
  };

  // Sync internal state with store when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartChapter(selectedRange.startChapter);
      setStartVerse(selectedRange.startVerse);
      setEndChapter(selectedRange.endChapter);
      setEndVerse(selectedRange.endVerse);
    }
  }, [isOpen, selectedRange]);

  // Validate if range is contiguous and valid
  const isValidRange = (range: VerseRange): boolean => {
    if (range.startChapter > range.endChapter) return false;
    if (range.startChapter === range.endChapter && range.startVerse > range.endVerse) return false;
    return true;
  };

  // Handle start chapter change
  const handleStartChapterChange = (chapterStr: string) => {
    const chapter = parseInt(chapterStr);
    const newStartVerse = 1;
    let newEndChapter = endChapter;
    let newEndVerse = endVerse;
    
    // If end chapter is before start chapter, update it
    if (endChapter < chapter) {
      newEndChapter = chapter;
      newEndVerse = getMaxVerses(chapter);
    }
    
    setStartChapter(chapter);
    setStartVerse(newStartVerse);
    setEndChapter(newEndChapter);
    setEndVerse(newEndVerse);
  };

  // Handle end chapter change
  const handleEndChapterChange = (chapterStr: string) => {
    const chapter = parseInt(chapterStr);
    const newEndVerse = getMaxVerses(chapter);
    let newStartChapter = startChapter;
    let newStartVerse = startVerse;
    
    // If start chapter is after end chapter, update it
    if (startChapter > chapter) {
      newStartChapter = chapter;
      newStartVerse = 1;
    }
    
    setStartChapter(newStartChapter);
    setStartVerse(newStartVerse);
    setEndChapter(chapter);
    setEndVerse(newEndVerse);
  };

  // Handle verse changes
  const handleStartVerseChange = (verse: number) => {
    setStartVerse(verse);
  };

  const handleEndVerseChange = (verse: number) => {
    setEndVerse(verse);
  };

  // Reset to Al-Fatihah
  const handleReset = () => {
    setStartChapter(1);
    setStartVerse(1);
    setEndChapter(1);
    setEndVerse(7);
  };

  // Apply changes
  const handleApply = () => {
    const newRange = {
      startChapter,
      startVerse,
      endChapter,
      endVerse
    };
    
    if (isValidRange(newRange)) {
      setSelectedRange(newRange);
      onClose();
    }
  };

  // Cancel changes
  const handleCancel = () => {
    // Reset to store values
    setStartChapter(selectedRange.startChapter);
    setStartVerse(selectedRange.startVerse);
    setEndChapter(selectedRange.endChapter);
    setEndVerse(selectedRange.endVerse);
    onClose();
  };

  const currentRange = { startChapter, startVerse, endChapter, endVerse };
  const isRangeValid = isValidRange(currentRange);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Verse Selection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Start Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-green-700">Start Position</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Chapter</Label>
                <Select
                  value={startChapter.toString()}
                  onValueChange={handleStartChapterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quranChapters.map(chapter => (
                      <SelectItem key={chapter.number} value={chapter.number.toString()}>
                        {chapter.number}. {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">
                  Verse (1-{getMaxVerses(startChapter)})
                </Label>
                <div className="px-2">
                  <Slider
                    value={[startVerse]}
                    onValueChange={(value) => handleStartVerseChange(value[0])}
                    max={getMaxVerses(startChapter)}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-medium">{startVerse}</span>
                    <span>{getMaxVerses(startChapter)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* End Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-red-700">End Position</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Chapter</Label>
                <Select
                  value={endChapter.toString()}
                  onValueChange={handleEndChapterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quranChapters.filter(c => c.number >= startChapter).map(chapter => (
                      <SelectItem key={chapter.number} value={chapter.number.toString()}>
                        {chapter.number}. {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">
                  Verse (1-{getMaxVerses(endChapter)})
                </Label>
                <div className="px-2">
                  <Slider
                    value={[endVerse]}
                    onValueChange={(value) => handleEndVerseChange(value[0])}
                    max={getMaxVerses(endChapter)}
                    min={startChapter === endChapter ? startVerse : 1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{startChapter === endChapter ? startVerse : 1}</span>
                    <span className="font-medium">{endVerse}</span>
                    <span>{getMaxVerses(endChapter)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Range Validation */}
          {!isRangeValid && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              Invalid range: End position must be after start position
            </div>
          )}

          {/* Current Selection Preview */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">Selected Range</div>
            <div className="text-sm text-blue-700">
              {startChapter === endChapter ? 
                `Chapter ${startChapter} verses ${startVerse}-${endVerse}` : 
                `Chapter ${startChapter}:${startVerse} to Chapter ${endChapter}:${endVerse}`
              }
            </div>
            <div className="text-xs text-blue-600 font-mono mt-1">
              {startChapter}:{startVerse} - {endChapter}:{endVerse}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={!isRangeValid}
            >
              Apply Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerseRangeModal;