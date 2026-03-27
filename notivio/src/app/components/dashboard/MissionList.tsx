"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
}

interface MissionListProps {
  missions: Mission[];
}

export default function MissionList({ missions }: MissionListProps) {
  return (
    <Card className="rounded-xl border-[#c6ac8f]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#6f5b43]">Recommended Missions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Missions will appear here once ASC recommendations are available.
          </p>
        ) : (
          missions.slice(0, 3).map((mission) => (
            <article
              key={mission.id}
              className="rounded-lg border border-[#c6ac8f]/25 bg-[#fffdf9] p-3 transition-colors hover:bg-[#f7f1e7]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-[#6f5b43]">{mission.title}</h3>
                <span className="rounded-full bg-[#c6ac8f]/20 px-2 py-0.5 text-xs font-semibold text-[#6f5b43]">
                  +{mission.points}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{mission.description}</p>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
