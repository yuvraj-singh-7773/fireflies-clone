'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getMeetingById,
  getTranscript,
  getChapters,
  getSummary,
  getActionItems,
  getComments,
  getHighlights,
  createHighlight,
  deleteHighlight,
} from '@/lib/api/meetings';
import { ApiError } from '@/lib/api/client';
import { MeetingDetail, TranscriptSegment, Chapter, Summary, ActionItem, TranscriptComment, TranscriptHighlight } from '@/types';
import { MeetingHeader } from '@/components/meetings/meeting-header';
import { MediaPlayer } from '@/components/meetings/media-player';
import { TranscriptViewer } from '@/components/meetings/transcript-viewer';
import { ChapterNavigation } from '@/components/meetings/chapter-navigation';
import { MeetingSummary } from '@/components/meetings/meeting-summary';
import { ActionItems } from '@/components/meetings/action-items';
import {
  ArrowPathIcon,
  UsersIcon,
  ChevronLeftIcon,
} from '@/components/ui/icons';
import { RequireAuth } from '@/components/auth/require-auth';
import { CreateMeetingModal } from '@/components/meetings/create-meeting-modal';
import { useToast } from '@/components/ui/toast';

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Data state
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [comments, setComments] = useState<TranscriptComment[]>([]);
  const [highlights, setHighlights] = useState<TranscriptHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [highlightBusySegmentId, setHighlightBusySegmentId] = useState<string | null>(null);

  // Player state
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const { showToast } = useToast();

  // Animation frame / interval reference for smooth media timer
  const lastTickRef = useRef<number | null>(null);

  // Load meeting data
  const loadMeetingData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      // Load meeting detail
      const m = await getMeetingById(id);
      setMeeting(m);

      // Populate segments from meeting.transcript or explicit endpoint
      if (m.transcript && m.transcript.length > 0) {
        setSegments(m.transcript);
      } else {
        try {
          const segs = await getTranscript(id);
          setSegments(segs || []);
        } catch {
          setSegments([]);
        }
      }

      // Populate chapters from meeting.chapters or explicit endpoint
      if (m.chapters && m.chapters.length > 0) {
        setChapters(m.chapters);
      } else {
        try {
          const chs = await getChapters(id);
          setChapters(chs || []);
        } catch {
          setChapters([]);
        }
      }

      // Load meeting intelligence (summary + action items) in parallel
      // These are separate GET calls now that the endpoints exist
      setIntelligenceLoading(true);
      const [fetchedSummary, fetchedActionItems] = await Promise.allSettled([
        getSummary(id),
        getActionItems(id),
      ]);

      // If MeetingDetail already has summary/action_items, prefer those as they're already loaded
      const resolvedSummary =
        fetchedSummary.status === 'fulfilled' ? fetchedSummary.value : m.summary ?? null;
      const resolvedActionItems =
        fetchedActionItems.status === 'fulfilled'
          ? fetchedActionItems.value
          : m.action_items ?? [];

      setSummary(resolvedSummary);
      setActionItems(resolvedActionItems || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      setError(err instanceof Error ? err.message : 'Failed to load meeting details');
    } finally {
      setLoading(false);
      setIntelligenceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMeetingData();
  }, [loadMeetingData]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      setComments(await getComments(id));
    } catch (err) {
      setComments([]);
      setCommentsError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  const loadHighlights = useCallback(async () => {
    if (!id) return;
    setHighlightsLoading(true);
    setHighlightsError(null);
    try {
      setHighlights(await getHighlights(id));
    } catch (err) {
      setHighlights([]);
      setHighlightsError(err instanceof Error ? err.message : 'Failed to load highlights');
    } finally {
      setHighlightsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    void loadHighlights();
  }, [loadHighlights]);

  // Compute total duration in seconds
  const fallbackDuration = React.useMemo(() => {
    if (meeting?.duration_sec && meeting.duration_sec > 0) {
      return meeting.duration_sec;
    }
    // Fallback from segments
    if (segments.length > 0) {
      const maxMs = Math.max(...segments.map((s) => s.end_ms));
      return Math.ceil(maxMs / 1000);
    }
    // Fallback from chapters
    if (chapters.length > 0) {
      const maxMs = Math.max(...chapters.map((c) => c.end_ms || c.start_ms));
      return Math.ceil(maxMs / 1000);
    }
    return 600; // 10 minutes default
  }, [meeting, segments, chapters]);
  const totalDuration = mediaDuration && mediaDuration > 0 ? mediaDuration : fallbackDuration;
  const hasRealMedia = Boolean(meeting?.audio_url);

  // Media Clock / Playback loop
  useEffect(() => {
    if (!isPlaying || hasRealMedia) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      if (lastTickRef.current) {
        const deltaSeconds = ((now - lastTickRef.current) / 1000) * playbackRate;
        setCurrentTime((prev) => {
          const next = prev + deltaSeconds;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }
      lastTickRef.current = now;
    }, 100);

    return () => clearInterval(interval);
  }, [hasRealMedia, isPlaying, playbackRate, totalDuration]);

  // Player controls
  const handlePlayPause = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (timeInSeconds: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, timeInSeconds));
    setCurrentTime(clamped);
    setIsPlaying(true);
  };

  const handleToggleHighlight = async (segmentId: string) => {
    if (!id) return;
    setHighlightBusySegmentId(segmentId);
    try {
      const existing = highlights.find((highlight) => highlight.segment_id === segmentId);
      if (existing) {
        await deleteHighlight(id, existing.id);
        setHighlights((current) => current.filter((highlight) => highlight.id !== existing.id));
        showToast('Highlight removed', 'info');
      } else {
        const created = await createHighlight(id, segmentId);
        setHighlights((current) => [...current, created]);
        showToast('Transcript highlighted', 'success');
      }
    } catch {
      showToast('Failed to update highlight', 'error');
    } finally {
      setHighlightBusySegmentId(null);
    }
  };

  return <RequireAuth>
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200">
      {/* Loading state */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-sm font-medium text-zinc-400">Loading meeting workspace...</p>
        </div>
      ) : notFound ? (
        <div className="flex-1 grid place-items-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-lg font-bold text-white">Meeting not found</h2>
            <p className="text-sm text-zinc-400">This meeting does not exist or is not available in your workspace.</p>
            <Link href="/dashboard" className="inline-flex px-3.5 py-2 rounded-lg bg-zinc-900 text-xs font-semibold text-zinc-200 border border-zinc-800">Back to Meetings</Link>
          </div>
        </div>
      ) : error ? (
        /* Error state */
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 sm:p-10 text-center max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-rose-300">Unable to Load Meeting</h2>
            <p className="text-xs sm:text-sm text-zinc-400">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-lg bg-zinc-900 text-xs font-semibold text-zinc-300 border border-zinc-800 hover:bg-zinc-800"
              >
                Back to Library
              </Link>
              <button
                onClick={loadMeetingData}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : meeting ? (
        <>
          {/* Top Sticky Header */}
          <MeetingHeader meeting={meeting} />

          {/* Main Meeting Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Back link (mobile-friendly) */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              Back to Library
            </Link>

            {/* Media Player Section */}
            <section aria-label="Media player controls">
              <MediaPlayer
                currentTime={currentTime}
                duration={totalDuration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                audioUrl={meeting.audio_url}
                onCurrentTimeChange={setCurrentTime}
                onDurationChange={setMediaDuration}
                onPlayingChange={setIsPlaying}
              />
            </section>

            {/* Main Content Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Transcript Viewer */}
              <section
                aria-label="Interactive transcript"
                className="lg:col-span-7 xl:col-span-8 space-y-4"
              >
                <TranscriptViewer
                  meetingId={id}
                  segments={segments}
                  participants={meeting.participants || []}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  isLoading={loading}
                  comments={comments}
                  commentsLoading={commentsLoading}
                  commentsError={commentsError}
                  onCommentsChange={setComments}
                  onRetryComments={loadComments}
                  highlights={highlights}
                  highlightBusySegmentId={highlightBusySegmentId}
                  onToggleHighlight={handleToggleHighlight}
                  highlightsLoading={highlightsLoading}
                  highlightsError={highlightsError}
                  onRetryHighlights={loadHighlights}
                />
              </section>

              {/* Right Column: Intelligence Panel */}
              <aside
                aria-label="Meeting intelligence"
                className="lg:col-span-5 xl:col-span-4 space-y-5"
              >
                {/* Chapter Navigation */}
                <ChapterNavigation chapters={chapters} currentTime={currentTime} onSeek={handleSeek} />

                {/* AI Summary */}
                <MeetingSummary summary={summary} isLoading={intelligenceLoading} />

                {/* Action Items CRUD */}
                <ActionItems
                  meetingId={id}
                  initialItems={actionItems}
                  isLoading={intelligenceLoading}
                />

                {/* Participants Card */}
                {meeting.participants && meeting.participants.length > 0 && (
                  <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                      <UsersIcon className="w-4 h-4 text-violet-400" />
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        Participants ({meeting.participants.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {meeting.participants.map((p) => (
                        <div
                          key={p.id || p.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-200 truncate">{p.name}</p>
                              {p.email && (
                                <p className="text-[11px] text-zinc-500 truncate">{p.email}</p>
                              )}
                            </div>
                          </div>

                          {p.speaker_id && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                              {p.speaker_id}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </main>
          <button onClick={() => setIsEditOpen(true)} className="fixed bottom-5 right-5 px-4 py-2 rounded-lg bg-violet-600 text-xs font-semibold text-white shadow-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400">Edit meeting</button>
          <CreateMeetingModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onMeetingCreated={() => undefined}
            meeting={meeting}
            onMeetingUpdated={(updated) => setMeeting(updated)}
          />
        </>
      ) : null}
    </div>
  </RequireAuth>;
}
