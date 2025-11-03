// src/components/tahfiz/SimilarVersesPanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { useVerseSelectionStore } from '@/stores/verseSelectionStore';

interface SimilarVersesPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

interface SimilarVerse {
  id: string;
  chapter: number;
  verse: number;
  chapterName: string;
  text: string;
  translation: string;
  similarity: number;
  theme: string;
}

const SimilarVersesPanel: React.FC<SimilarVersesPanelProps> = ({
  isLoading,
  setIsLoading,
  onError
}) => {
  const { selectedRange } = useVerseSelectionStore();
  const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);

  // Clear results when verse range changes
  useEffect(() => {
    setSimilarVerses([]);
    setSearchCompleted(false);
    onError(null);
  }, [selectedRange, onError]);

  // Mock function to find similar verses
  const findSimilarVerses = async () => {
    setIsLoading(true);
    onError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock similar verses data
      const mockSimilarVerses: SimilarVerse[] = [
        {
          id: '1',
          chapter: 2,
          verse: 255,
          chapterName: 'Al-Baqarah',
          text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
          translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.',
          similarity: 95,
          theme: 'Divine Unity'
        },
        {
          id: '2',
          chapter: 3,
          verse: 18,
          chapterName: 'Ali Imran',
          text: 'شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
          translation: 'Allah witnesses that there is no deity except Him.',
          similarity: 88,
          theme: 'Divine Unity'
        },
        {
          id: '3',
          chapter: 59,
          verse: 22,
          chapterName: 'Al-Hashr',
          text: 'هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ',
          translation: 'He is Allah, other than whom there is no deity.',
          similarity: 82,
          theme: 'Divine Attributes'
        }
      ];

      setSimilarVerses(mockSimilarVerses);
      setSearchCompleted(true);

    } catch (error) {
      console.error('Error finding similar verses:', error);
      onError('Failed to find similar verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get similarity badge variant
  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 90) return 'default';
    if (similarity >= 75) return 'secondary';
    return 'outline';
  };

  // Format range display
  const formatSelectedRange = () => {
    const { startChapter, startVerse, endChapter, endVerse } = selectedRange;
    if (startChapter === endChapter) {
      return `${startChapter}:${startVerse}-${endVerse}`;
    }
    return `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Similar Verses</h3>
          <p className="text-sm text-gray-600">
            Find verses with similar words and phrases that get mixed up {formatSelectedRange()}
          </p>
        </div>
        
        <Button
          onClick={findSimilarVerses}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Find Similar Verses
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {searchCompleted && similarVerses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">
              Found {similarVerses.length} similar verses
            </h4>
          </div>

          {similarVerses.map((verse) => (
            <Card key={verse.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{verse.chapterName} {verse.chapter}:{verse.verse}</span>
                    <Badge variant={getSimilarityBadge(verse.similarity)}>
                      {verse.similarity}% similar
                    </Badge>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {verse.theme}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Arabic Text */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-lg font-arabic leading-relaxed text-right text-green-800">
                    {verse.text}
                  </p>
                </div>

                {/* Translation */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic">
                    {verse.translation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Context
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {searchCompleted && similarVerses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Similar Verses Found</h3>
            <p className="text-gray-600 mb-4">
              No verses with similar themes were found for the selected range.
            </p>
            <Button onClick={findSimilarVerses} variant="outline">
              Try Different Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchCompleted && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Similar Verses</h3>
            <p className="text-gray-600 mb-4">
              Use AI to find verses that share similar meanings, themes, or concepts with your selected range.
            </p>
            <Button onClick={findSimilarVerses} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Start Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimilarVersesPanel;