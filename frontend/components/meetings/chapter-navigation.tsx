'use client';

import React from 'react';
import { Chapter } from '@/types';
import { formatTime } from './media-player';
import { SparklesIcon, PlayIcon, TagIcon } from '../ui/icons';

interface ChapterNavigationProps {
  chapters: Chapter[];
  currentTime: number; // in seconds
  onSeek: (seconds: number) => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters = [],
  currentTime,
  onSeek,
}) => {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 text-center">
        <p className="text-xs text-zinc-500">No chapters available.</p>
      </div>
    );
  }

  const currentMs = currentTime * 1000;

  return (
    <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Chapters & Agenda
          </h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400 font-medium">
          {chapters.length} topics
        </span>
      </div>

      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
        {chapters.map((ch, idx) => {
          const startSec = ch.start_ms / 1000;
          const endSec = ch.end_ms ? ch.end_ms / 1000 : undefined;
          const isActive =
            currentMs >= ch.start_ms && (ch.end_ms ? currentMs <= ch.end_ms : true);

          return (
            <button
              key={ch.id || idx}
              onClick={() => onSeek(startSec)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all group ${
                isActive
                  ? 'bg-violet-950/40 text-violet-200 border border-violet-500/40 shadow-sm'
                  : 'text-zinc-300 hover:text-white bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {ch.sequence + 1}
                </span>
                <span className="font-medium truncate">{ch.title}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-zinc-400 group-hover:text-zinc-200">
                <PlayIcon className="w-2.5 h-2.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>{formatTime(startSec)}</span>
                {endSec && <span className="text-zinc-600">· {formatTime(endSec)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
