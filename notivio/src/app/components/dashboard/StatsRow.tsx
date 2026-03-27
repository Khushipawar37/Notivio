"use client";

import { Card, CardContent } from "../../components/ui/card";

interface StatsRowProps {
  stats: {
    totalNotebooks: number;
    totalNotes: number;
    flashcardsCreated: number;
    missionsCompleted: number;
    insightPoints: number;
  };
}

const metricConfig: Array<{ key: keyof StatsRowProps["stats"]; label: string }> = [
  { key: "totalNotebooks", label: "Total Notebooks" },
  { key: "totalNotes", label: "Total Notes" },
  { key: "flashcardsCreated", label: "Flashcards Created" },
  { key: "missionsCompleted", label: "Missions Completed" },
  { key: "insightPoints", label: "Insight Points" },
];

export default function StatsRow({ stats }: StatsRowProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metricConfig.map((metric) => (
        <Card
          key={metric.key}
          className="rounded-xl border-[#c6ac8f]/30 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#6f5b43]">{stats[metric.key]}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
