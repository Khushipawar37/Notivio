'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader } from 'lucide-react';

interface StudySession {
  date: string;
  duration: number; // minutes
  notesCreated: number;
  quizzesCompleted: number;
}

interface TopicStats {
  topic: string;
  notes: number;
  timeSpent: number; // minutes
  quizScore: number; // 0-100
}

interface Analytics {
  totalNotes: number;
  totalTimeSpent: number; // minutes
  averageSessionDuration: number;
  quizzesCompleted: number;
  overallQuizScore: number;
  studySessions: StudySession[];
  topicStats: TopicStats[];
  dailyActivity: Array<{ date: string; count: number }>;
  weekStreak: number;
}

interface StudyAnalyticsDashboardProps {
  userId?: string;
}

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
];

export function StudyAnalyticsDashboard({
  userId,
}: StudyAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?range=${timeRange}`, {
          headers: userId ? { 'X-User-ID': userId } : {},
        });

        if (!response.ok) {
          throw new Error('Failed to load analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Set mock data for demo
        setAnalytics(generateMockAnalytics());
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Failed to load analytics. Please try again.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Study Analytics</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range === 'all' ? 'All Time' : range === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Total Notes</p>
          <p className="text-3xl font-bold text-blue-600">
            {analytics.totalNotes}
          </p>
          <p className="text-xs text-gray-500 mt-2">Created in period</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Study Time</p>
          <p className="text-3xl font-bold text-green-600">
            {Math.round(analytics.totalTimeSpent / 60)}h
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Avg: {analytics.averageSessionDuration}m per session
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Quizzes Done</p>
          <p className="text-3xl font-bold text-purple-600">
            {analytics.quizzesCompleted}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Score: {analytics.overallQuizScore}%
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Study Streak</p>
          <p className="text-3xl font-bold text-orange-600">
            {analytics.weekStreak}d
          </p>
          <p className="text-xs text-gray-500 mt-2">Keep it going!</p>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
          <TabsTrigger value="topics">Topics Breakdown</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Study Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Notes by Topic</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.topicStats}
                    dataKey="notes"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.topicStats.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Topic Stats Table */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Topic Performance</h3>
              <div className="space-y-4">
                {analytics.topicStats.map((topic) => (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{topic.topic}</span>
                      <span className="text-xs text-gray-600">
                        {topic.notes} notes
                      </span>
                    </div>
                    <Progress value={topic.quizScore} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(topic.timeSpent / 60)}h studied</span>
                      <span className="font-medium">{topic.quizScore}% avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Learning Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analytics.studySessions.map((s, idx) => ({
                  name: idx,
                  duration: s.duration,
                  notes: s.notesCreated,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="duration"
                  stroke="#8B5CF6"
                  name="Duration (min)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="notes"
                  stroke="#EC4899"
                  name="Notes Created"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Study Sessions</h3>
        <div className="space-y-3">
          {analytics.studySessions.slice(0, 5).map((session, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-sm">{session.date}</p>
                <p className="text-xs text-gray-600">
                  {session.duration}m session
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {session.notesCreated} notes
                </p>
                <p className="text-xs text-gray-600">
                  {session.quizzesCompleted} quizzes
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Mock data generator for demo
function generateMockAnalytics(): Analytics {
  const now = new Date();
  const studySessions: StudySession[] = [];
  const dailyActivity: Array<{ date: string; count: number }> = [];

  for (let i = 29; i >= 0; i--) {
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

  return {
    totalNotes: 47,
    totalTimeSpent: 3420,
    averageSessionDuration: 65,
    quizzesCompleted: 24,
    overallQuizScore: 82,
    studySessions,
    topicStats: [
      { topic: 'Mathematics', notes: 12, timeSpent: 480, quizScore: 85 },
      { topic: 'Science', notes: 15, timeSpent: 600, quizScore: 78 },
      { topic: 'History', notes: 10, timeSpent: 420, quizScore: 90 },
      { topic: 'Languages', notes: 10, timeSpent: 920, quizScore: 75 },
    ],
    dailyActivity,
    weekStreak: 5,
  };
}

export default StudyAnalyticsDashboard;
