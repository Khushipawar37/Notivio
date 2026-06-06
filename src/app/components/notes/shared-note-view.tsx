"use client";

import { useEffect, useState } from "react";

interface SharedPayload {
  role: "viewer" | "editor";
  note: {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export function SharedNoteView({ token }: { token: string }) {
  const [data, setData] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/notes/shared-access?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        setError("Invalid or expired share link.");
        return;
      }
      setData((await response.json()) as SharedPayload);
    };

    void load();
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] px-4 pb-16 pt-32">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] px-4 pb-16 pt-32">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#d8c6b2] bg-white p-4 text-[#6f5b43]">
          Loading shared note...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 pb-16 pt-32">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#d8c6b2] bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#5d4a34]">{data.note.title}</h1>
          <p className="mt-1 text-xs text-[#8e775e]">
            Shared access role: {data.role} • Last updated {new Date(data.note.updatedAt).toLocaleString()}
          </p>
        </div>
        <article
          className="prose max-w-none prose-headings:text-[#5d4a34] prose-p:text-[#6f5b43]"
          dangerouslySetInnerHTML={{ __html: data.note.content }}
        />
      </div>
    </main>
  );
}
