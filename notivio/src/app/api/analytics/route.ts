import { NextRequest, NextResponse } from 'next/server';

interface Analytics {
  totalNotes: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  quizzesCompleted: number;
  overallQuizScore: number;
  studySessions: Array<{
    date: string;
    duration: number;
    notesCreated: number;
    quizzesCompleted: number;
  }>;
  topicStats: Array<{
    topic: string;
    notes: number;
    timeSpent: number;
    quizScore: number;
  }>;
  dailyActivity: Array<{ date: string; count: number }>;
  weekStreak: number;
}

// Mock data generator
function generateAnalytics(range: 'week' | 'month' | 'all'): Analytics {
  const now = new Date();
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
  const studySessions = [];
  const dailyActivity = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (Math.random() > 0.3) {
      studySessions.push({
        date: dateStr,
        duration: Math.floor(Math.random() * 120) + 30,
        notesCreated: Math.floor(Math.random() * 5) + 1,
        quizzesCompleted: Math.floor(Math.random() * 3),
      });

      dailyActivity.push({
        date: dateStr,
        count: Math.floor(Math.random() * 8) + 2,
      });
    }
  }

  const totalNotes = studySessions.reduce((sum, s) => sum + s.notesCreated, 0);
  const totalTime = studySessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    totalNotes,
    totalTimeSpent: totalTime,
    averageSessionDuration: studySessions.length
      ? Math.round(totalTime / studySessions.length)
      : 0,
    quizzesCompleted: studySessions.reduce((sum, s) => sum + s.quizzesCompleted, 0),
    overallQuizScore: Math.floor(Math.random() * 25) + 75, // 75-100
    studySessions,
    topicStats: [
      { topic: 'Mathematics', notes: 12, timeSpent: 480, quizScore: 85 },
      { topic: 'Science', notes: 15, timeSpent: 600, quizScore: 78 },
      { topic: 'History', notes: 10, timeSpent: 420, quizScore: 90 },
      { topic: 'Languages', notes: 10, timeSpent: 920, quizScore: 75 },
    ],
    dailyActivity,
    weekStreak: Math.floor(Math.random() * 10) + 1,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'month') as
      | 'week'
      | 'month'
      | 'all';

    const analytics = generateAnalytics(range);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
