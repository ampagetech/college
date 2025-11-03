"use client";

import React, { useMemo } from 'react';

interface TextComparisonProps {
  originalText: string;
  transcribedText: string;
  tashkeelText: string;
}

const TextComparison: React.FC<TextComparisonProps> = ({
  originalText,
  transcribedText,
  tashkeelText
}) => {
  const comparison = useMemo(() => {
    return compareTexts(originalText, transcribedText, tashkeelText);
  }, [originalText, transcribedText, tashkeelText]);

  const textStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '18px',
    lineHeight: '2',
    direction: 'rtl' as const,
    textAlign: 'right' as const,
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const
  };

  return (
    <div className="space-y-6">
      {/* Original Quranic Text */}
      <div className="bg-green-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">
          Original Text (with Tashkeel):
        </h5>
        <div style={textStyle} className="text-gray-900">
          {tashkeelText}
        </div>
      </div>

      {/* Your Recitation */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">
          Your Recitation:
        </h5>
        <div style={textStyle} className="text-gray-900">
          {transcribedText}
        </div>
      </div>

      {/* Comparison View */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">
          Comparison (missed in red, added in green, common in black):
        </h5>
        <div style={textStyle}>
          {comparison.map((part, index) => (
            <span
              key={index}
              className={`${
                part.type === 'added'
                  ? 'text-green-600 bg-green-100'
                  : part.type === 'removed'
                  ? 'text-red-600 bg-red-100'
                  : 'text-black'
              }`}
            >
              {part.text}
            </span>
          ))}
        </div>
      </div>

      {/* Simple Stats */}
      <div className="text-sm text-gray-600">
        <span>Words missed: </span>
        <span className="font-medium text-red-600">
          {comparison.filter(p => p.type === 'removed').length}
        </span>
        <span className="ml-4">Words added: </span>
        <span className="font-medium text-green-600">
          {comparison.filter(p => p.type === 'added').length}
        </span>
      </div>
    </div>
  );
};

// Arabic text normalization function
function normalizeArabic(text: string): string {
  return text
    .normalize('NFC') // Unicode normalization
    // Remove Quranic diacritics + tashkeel
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, '')
    // Normalize alef variants to bare alef
    .replace(/[إأآا]/g, 'ا')
    // Normalize final ya to ya
    .replace(/ى/g, 'ي')
    // Remove punctuation
    .replace(/[.,;:!?()[\]{}]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Custom diff implementation based on diff-match-patch approach
function diff_main(text1: string, text2: string): Array<{op: number, text: string}> {
  // Simple implementation of Myers algorithm for word-level diff
  const words1 = text1.split(/\s+/).filter(w => w.length > 0);
  const words2 = text2.split(/\s+/).filter(w => w.length > 0);
  
  const n = words1.length;
  const m = words2.length;
  
  // Create LCS table
  const lcs: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find diff
  const diff: Array<{op: number, text: string}> = [];
  let i = n, j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      diff.unshift({op: 0, text: words1[i - 1]}); // Equal
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      diff.unshift({op: 1, text: words2[j - 1]}); // Insert
      j--;
    } else if (i > 0) {
      diff.unshift({op: -1, text: words1[i - 1]}); // Delete
      i--;
    }
  }
  
  return diff;
}

// Clean up diff for semantic meaning
function diff_cleanupSemantic(diffs: Array<{op: number, text: string}>): Array<{op: number, text: string}> {
  const cleanedDiffs: Array<{op: number, text: string}> = [];
  let currentOp = null;
  let currentText = '';
  
  for (const diff of diffs) {
    if (diff.op === currentOp) {
      // Merge consecutive operations of same type
      currentText += ' ' + diff.text;
    } else {
      // Push previous diff if exists
      if (currentOp !== null && currentText.trim()) {
        cleanedDiffs.push({op: currentOp, text: currentText.trim()});
      }
      // Start new diff
      currentOp = diff.op;
      currentText = diff.text;
    }
  }
  
  // Push final diff
  if (currentOp !== null && currentText.trim()) {
    cleanedDiffs.push({op: currentOp, text: currentText.trim()});
  }
  
  return cleanedDiffs;
}

// Main comparison function
function compareTexts(originalText: string, transcribedText: string, tashkeelText: string) {
  // Normalize both texts
  const normalizedOriginal = normalizeArabic(originalText);
  const normalizedTranscribed = normalizeArabic(transcribedText);
  
  // Get raw diff
  const rawDiffs = diff_main(normalizedOriginal, normalizedTranscribed);
  
  // Clean up diff for better semantic grouping
  const cleanedDiffs = diff_cleanupSemantic(rawDiffs);
  
  // Map back to tashkeel text
  const tashkeelWords = tashkeelText.split(/\s+/).filter(w => w.length > 0);
  const originalWords = normalizedOriginal.split(/\s+/).filter(w => w.length > 0);
  
  // Create word mapping from normalized to tashkeel
  const wordMap = new Map<string, string>();
  let tashkeelIndex = 0;
  
  for (const originalWord of originalWords) {
    if (tashkeelIndex < tashkeelWords.length) {
      const tashkeelWord = tashkeelWords[tashkeelIndex];
      const normalizedTashkeel = normalizeArabic(tashkeelWord);
      if (normalizedTashkeel === originalWord) {
        wordMap.set(originalWord, tashkeelWord);
        tashkeelIndex++;
      }
    }
  }
  
  // Convert diffs to display format
  const result: Array<{type: string, text: string}> = [];
  
  for (const diff of cleanedDiffs) {
    if (diff.op === 0) {
      // Equal - use tashkeel version
      const words = diff.text.split(/\s+/);
      const tashkeelWords = words.map(word => wordMap.get(word) || word);
      result.push({
        type: 'equal',
        text: tashkeelWords.join(' ')
      });
    } else if (diff.op === -1) {
      // Deleted from original (missing in transcription)
      const words = diff.text.split(/\s+/);
      const tashkeelWords = words.map(word => wordMap.get(word) || word);
      result.push({
        type: 'removed',
        text: tashkeelWords.join(' ')
      });
    } else if (diff.op === 1) {
      // Added in transcription (extra words)
      result.push({
        type: 'added',
        text: diff.text
      });
    }
  }
  
  return result.filter(part => part.text.trim().length > 0);
}

export default TextComparison;