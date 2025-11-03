// src/app/api/recitations/progress/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Replace with your actual database client
// import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chapter = searchParams.get('chapter');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get recent attempts
    const recentAttempts = await getRecentAttempts(userId, limit, chapter ? parseInt(chapter) : undefined);
    
    // Get progress summary
    const progressSummary = await getProgressSummary(userId, chapter ? parseInt(chapter) : undefined);

    return NextResponse.json({
      success: true,
      data: {
        recentAttempts,
        progressSummary
      }
    });

  } catch (error: any) {
    console.error('Progress API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get progress data' 
      },
      { status: 500 }
    );
  }
}

// Mock function - replace with actual database query
async function getRecentAttempts(userId: string, limit: number, chapter?: number) {
  try {
    // Example using Prisma:
    /*
    const whereClause = {
      userId,
      ...(chapter ? { startChapter: chapter, endChapter: chapter } : {})
    };

    const attempts = await db.recitationAttempt.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        verseReference: true,
        overallScore: true,
        llmProvider: true,
        qiraa: true,
        audioDuration: true,
        createdAt: true,
        accuracyOverall: true,
        accuracyPronunciation: true,
        accuracyCompleteness: true,
        accuracyOrder: true
      }
    });

    return attempts;
    */

    // Mock data for now
    const mockAttempts = [
      {
        id: 'attempt_1',
        verseReference: '1:1-7',
        overallScore: 92,
        llmProvider: 'gemini',
        qiraa: 'hafs',
        audioDuration: 45,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        accuracyOverall: 92,
        accuracyPronunciation: 95,
        accuracyCompleteness: 90,
        accuracyOrder: 88
      },
      {
        id: 'attempt_2',
        verseReference: '2:1-5',
        overallScore: 85,
        llmProvider: 'openai',
        qiraa: 'hafs',
        audioDuration: 78,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        accuracyOverall: 85,
        accuracyPronunciation: 88,
        accuracyCompleteness: 82,
        accuracyOrder: 85
      }
    ];

    return chapter 
      ? mockAttempts.filter(a => a.verseReference.startsWith(`${chapter}:`))
      : mockAttempts.slice(0, limit);

  } catch (error) {
    console.error('Error getting recent attempts:', error);
    return [];
  }
}

// Mock function - replace with actual database query
async function getProgressSummary(userId: string, chapter?: number) {
  try {
    // Example using Prisma:
    /*
    if (chapter) {
      // Get progress for specific chapter
      const progress = await db.recitationProgress.findUnique({
        where: {
          userId_chapterNumber: {
            userId,
            chapterNumber: chapter
          }
        }
      });

      if (!progress) {
        return {
          chapter,
          totalAttempts: 0,
          bestScore: 0,
          averageScore: 0,
          versesAttempted: [],
          versesMastered: [],
          isCompleted: false
        };
      }

      return {
        chapter: progress.chapterNumber,
        totalAttempts: progress.totalAttempts,
        bestScore: progress.bestScore,
        averageScore: progress.averageScore,
        versesAttempted: progress.versesAttempted,
        versesMastered: progress.versesMastered,
        isCompleted: progress.isChapterCompleted,
        lastAttemptDate: progress.lastAttemptDate
      };
    } else {
      // Get overall progress across all chapters
      const allProgress = await db.recitationProgress.findMany({
        where: { userId },
        orderBy: { chapterNumber: 'asc' }
      });

      const totalAttempts = allProgress.reduce((sum, p) => sum + p.totalAttempts, 0);
      const totalChapters = allProgress.length;
      const completedChapters = allProgress.filter(p => p.isChapterCompleted).length;
      const averageScore = totalAttempts > 0 
        ? allProgress.reduce((sum, p) => sum + (p.averageScore * p.totalAttempts), 0) / totalAttempts
        : 0;

      return {
        totalAttempts,
        totalChapters,
        completedChapters,
        averageScore: Math.round(averageScore * 100) / 100,
        chapterProgress: allProgress.map(p => ({
          chapter: p.chapterNumber,
          attempts: p.totalAttempts,
          bestScore: p.bestScore,
          isCompleted: p.isChapterCompleted
        }))
      };
    }
    */

    // Mock data for now
    if (chapter) {
      return {
        chapter,
        totalAttempts: 15,
        bestScore: 92,
        averageScore: 87.3,
        versesAttempted: [1, 2, 3, 4, 5, 6, 7],
        versesMastered: [1, 2, 3, 6, 7],
        isCompleted: false,
        lastAttemptDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
      };
    } else {
      return {
        totalAttempts: 45,
        totalChapters: 5,
        completedChapters: 2,
        averageScore: 86.7,
        chapterProgress: [
          { chapter: 1, attempts: 15, bestScore: 95, isCompleted: true },
          { chapter: 2, attempts: 12, bestScore: 88, isCompleted: false },
          { chapter: 3, attempts: 8, bestScore: 92, isCompleted: true },
          { chapter: 4, attempts: 6, bestScore: 82, isCompleted: false },
          { chapter: 5, attempts: 4, bestScore: 78, isCompleted: false }
        ]
      };
    }

  } catch (error) {
    console.error('Error getting progress summary:', error);
    return {
      totalAttempts: 0,
      averageScore: 0,
      totalChapters: 0,
      completedChapters: 0
    };
  }
}