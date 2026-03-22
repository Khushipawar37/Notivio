"use client";

import type { ReactNode } from "react";

export interface SlashCommandItem {
  label: string;
  icon: ReactNode;
  category: string;
  command: () => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  selectedIndex: number;
  filter: string;
  position: { top: number; left: number };
  onSelect: (item: SlashCommandItem) => void;
  onHover: (index: number) => void;
}

export function SlashCommandMenu({
  items,
  selectedIndex,
  filter,
  position,
  onSelect,
  onHover,
}: SlashCommandMenuProps) {
  if (items.length === 0) return null;

  let lastCategory = "";
  return (
    <div
      className="absolute z-50 bg-[#1e1e36] border border-white/10 rounded-xl shadow-2xl py-2 w-64 max-h-72 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 pb-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider">
        {filter ? `Filter: ${filter}` : "Insert block"}
      </div>
      {items.map((item, index) => {
        const showCategory = item.category !== lastCategory;
        lastCategory = item.category;
        return (
          <div key={`${item.category}-${item.label}`}>
            {showCategory && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium text-white/25 uppercase tracking-wider">
                {item.category}
              </div>
            )}
            <button
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-indigo-500/20 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHover(index)}
            >
              <span className="text-white/40">{item.icon}</span>
              {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
