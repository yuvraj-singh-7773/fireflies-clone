'use client';

import React from 'react';
import { TranscriptComment, TranscriptHighlight, TranscriptSegment as SegmentType } from '@/types';
import { formatTime } from './media-player';
import { PlayIcon } from '../ui/icons';
import { TranscriptComments } from './transcript-comments';

interface TranscriptSegmentProps {
  segment: SegmentType;
  speakerName: string;
  isActive: boolean;
  onSeekToSegment: (startSeconds: number) => void;
  searchQuery: string;
  isCurrentMatchSegment: boolean;
  comments: TranscriptComment[];
  isComposerOpen: boolean;
  isSubmittingComment: boolean;
  deletingCommentId: string | null;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onSubmitComment: (text: string, authorName: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  highlight?: TranscriptHighlight;
  isHighlightBusy: boolean;
  onToggleHighlight: () => Promise<void>;
}

const SPEAKER_COLORS = [
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'bg-rose-500/20 text-rose-300 border-rose-500/40',
];

function getSpeakerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
}

function getSpeakerInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Safely highlights matching query occurrences in text without innerHTML
 */
function renderHighlightedText(text: string, query: string, isCurrentMatch: boolean) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const trimmed = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();

  const parts: React.ReactNode[] = [];
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, startIndex);

  let keyCounter = 0;

  while (matchIndex !== -1) {
    // Push preceding non-matching text
    if (matchIndex > startIndex) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {text.substring(startIndex, matchIndex)}
        </span>
      );
    }

    // Push matched text
    const matchedSubstring = text.substring(matchIndex, matchIndex + trimmed.length);
    parts.push(
      <mark
        key={`match-${keyCounter++}`}
        className={`px-0.5 rounded font-semibold transition-all ${
          isCurrentMatch
            ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-300 shadow-sm'
            : 'bg-amber-500/30 text-amber-200 border-b border-amber-400/50'
        }`}
      >
        {matchedSubstring}
      </mark>
    );

    startIndex = matchIndex + trimmed.length;
    matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  }

  // Push remaining text
  if (startIndex < text.length) {
    parts.push(
      <span key={`text-${keyCounter++}`}>{text.substring(startIndex)}</span>
    );
  }

  return <span>{parts}</span>;
}

export const TranscriptSegmentItem: React.FC<TranscriptSegmentProps> = ({
  segment,
  speakerName,
  isActive,
  onSeekToSegment,
  searchQuery,
  isCurrentMatchSegment,
  comments,
  isComposerOpen,
  isSubmittingComment,
  deletingCommentId,
  onOpenComposer,
  onCloseComposer,
  onSubmitComment,
  onDeleteComment,
  highlight,
  isHighlightBusy,
  onToggleHighlight,
}) => {
  const startSeconds = segment.start_ms / 1000;
  const timeFormatted = formatTime(startSeconds);
  const colorClass = getSpeakerColor(speakerName);
  const initials = getSpeakerInitials(speakerName);

  return (
    <div
      id={`transcript-segment-${segment.id}`}
      className={`group relative rounded-xl transition-all duration-200 p-3 sm:p-4 select-text border ${
        isActive
          ? 'bg-violet-950/30 border-violet-500/50 shadow-md shadow-violet-500/5 ring-1 ring-violet-500/30'
          : highlight
          ? 'bg-amber-500/10 border-amber-400/50'
          : isCurrentMatchSegment
          ? 'bg-amber-950/20 border-amber-500/40'
          : 'bg-zinc-900/40 hover:bg-zinc-900/90 border-zinc-800/60 hover:border-zinc-700/80'
      }`}
    >
      <div
        className="flex items-start gap-3 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => onSeekToSegment(startSeconds)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSeekToSegment(startSeconds);
          }
        }}
        aria-label={`Transcript segment at ${timeFormatted} by ${speakerName}: ${segment.text}`}
      >
        {/* Speaker Avatar / Initials */}
        <div
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 select-none shadow-sm ${colorClass}`}
          title={speakerName}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header row: Speaker Name + Timestamp button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300 transition-colors">
              {speakerName}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeekToSegment(startSeconds);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-400 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/30 border border-zinc-800/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
              title="Seek to this point"
              aria-label={`Seek to timestamp ${timeFormatted}`}
            >
              <PlayIcon className="w-2.5 h-2.5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>{timeFormatted}</span>
            </button>
          </div>

          {/* Transcript Text */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed group-hover:text-zinc-100 transition-colors">
            {renderHighlightedText(segment.text, searchQuery, isCurrentMatchSegment)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void onToggleHighlight()}
        disabled={isHighlightBusy}
        aria-label={highlight ? 'Remove transcript highlight' : 'Highlight transcript segment'}
        className={`mt-2 text-[11px] font-medium rounded px-2 py-1 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${highlight ? 'text-amber-200 border-amber-400/40 bg-amber-500/10' : 'text-zinc-500 border-zinc-800 hover:text-amber-200 hover:border-amber-400/40'} disabled:opacity-50`}
      >
        {isHighlightBusy ? 'Saving…' : highlight ? 'Highlighted' : 'Highlight'}
      </button>

      <TranscriptComments
        comments={comments}
        isComposerOpen={isComposerOpen}
        isSubmitting={isSubmittingComment}
        deletingId={deletingCommentId}
        onOpenComposer={onOpenComposer}
        onCloseComposer={onCloseComposer}
        onSubmit={onSubmitComment}
        onDelete={onDeleteComment}
      />
    </div>
  );
};
