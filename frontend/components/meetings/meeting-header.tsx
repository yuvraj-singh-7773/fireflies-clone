'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MeetingDetail } from '@/types';
import { ParticipantAvatars } from './participant-avatars';
import {
  ChevronLeftIcon,
  CalendarIcon,
  ClockIcon,
  ClipboardIcon,
  CheckCircleIcon,
} from '../ui/icons';
import { useToast } from '../ui/toast';

interface MeetingHeaderProps {
  meeting: MeetingDetail;
}

function formatMeetingDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatMeetingTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({ meeting }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Meeting link copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = formatMeetingDate(meeting.date);
  const formattedTime = formatMeetingTime(meeting.date);
  const formattedDuration = formatDuration(meeting.duration_sec);

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top navigation row */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 border border-zinc-800/80 transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Meetings</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-colors"
              title="Copy meeting link"
            >
              {copied ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ClipboardIcon className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Title and metadata row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {meeting.title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                  meeting.status === 'done'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : meeting.status === 'processing'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {meeting.status === 'done' ? 'Processed' : meeting.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formattedDate}</span>
                {formattedTime && <span className="text-zinc-600">·</span>}
                {formattedTime && <span>{formattedTime}</span>}
              </div>

              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formattedDuration}</span>
              </div>

              {meeting.tags && meeting.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {meeting.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800"
                      style={{
                        borderColor: tag.color ? `${tag.color}40` : undefined,
                      }}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                        style={{ backgroundColor: tag.color || '#818cf8' }}
                      />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Participants preview */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="shrink-0 pt-2 md:pt-0">
              <ParticipantAvatars participants={meeting.participants} maxDisplay={4} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
