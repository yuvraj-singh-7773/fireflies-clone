'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { RequireAuth } from '@/components/auth/require-auth';
import { MeetingFilters, DatePreset } from '@/components/meetings/meeting-filters';
import { MeetingList } from '@/components/meetings/meeting-list';
import { CreateMeetingModal } from '@/components/meetings/create-meeting-modal';
import { getMeetings, deleteMeeting } from '@/lib/api/meetings';
import { Meeting, MeetingListResponse, MeetingSortOption } from '@/types';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/toast';
import { ArrowPathIcon, CalendarIcon, ClockIcon, CheckCircleIcon, SparklesIcon } from '@/components/ui/icons';

function getDateRange(preset: DatePreset): { date_from?: string; date_to?: string } {
  if (preset === 'all') return {};
  const end = new Date();
  const start = new Date(end);
  if (preset === 'today') start.setHours(0, 0, 0, 0);
  if (preset === '7days') start.setDate(start.getDate() - 7);
  if (preset === '30days') start.setDate(start.getDate() - 30);
  return { date_from: start.toISOString(), date_to: end.toISOString() };
}

function formatHours(meetings: Meeting[]): string {
  const seconds = meetings.reduce((total, meeting) => total + (meeting.duration_sec ?? 0), 0);
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [result, setResult] = useState<MeetingListResponse>({ items: [], total: 0, page: 1, size: 10, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [sortOption, setSortOption] = useState<MeetingSortOption>('date_desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const range = getDateRange(datePreset);
      const next = await getMeetings({
        page,
        size: 10,
        q: searchQuery,
        participant: participantQuery,
        sort: sortOption,
        ...range,
      });
      setResult(next);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Your session has expired. Please sign in again.' : 'We could not load your meetings. Check the backend and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [datePreset, page, participantQuery, searchQuery, sortOption]);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  const metrics = useMemo(() => {
    const processed = result.items.filter((meeting) => meeting.status === 'done').length;
    return [
      { label: 'Meetings', value: result.total.toString(), icon: CalendarIcon, tone: 'violet' },
      { label: 'Meeting hours', value: formatHours(result.items), icon: ClockIcon, tone: 'cyan' },
      { label: 'Processed', value: processed.toString(), icon: CheckCircleIcon, tone: 'emerald' },
      { label: 'AI workspace', value: 'Ready', icon: SparklesIcon, tone: 'amber' },
    ];
  }, [result.items, result.total]);

  const isFiltered = Boolean(searchQuery || participantQuery || datePreset !== 'all' || sortOption !== 'date_desc');
  const resetFilters = () => {
    setSearchQuery('');
    setParticipantQuery('');
    setDatePreset('all');
    setSortOption('date_desc');
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    await deleteMeeting(id);
    showToast('Meeting deleted', 'success');
    await loadMeetings(true);
  };

  return <RequireAuth>
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} totalMeetings={result.total} apiConnected={!error} />
      <div className="min-w-0 flex-1 flex flex-col">
        <Header onOpenSidebar={() => setSidebarOpen(true)} onNewMeeting={() => setCreateOpen(true)} onRefresh={() => void loadMeetings(true)} isRefreshing={refreshing} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-7">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">Meeting intelligence</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Good morning, {user?.display_name?.split(' ')[0] || 'there'}</h1>
                <p className="mt-2 max-w-xl text-sm text-zinc-400">Here is what is happening across your conversations. Search, review, and turn every discussion into momentum.</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">Capture a meeting</button>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace metrics">
              {metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm"><div className="flex items-start justify-between"><p className="text-xs font-medium text-zinc-400">{label}</p><span className={`rounded-lg p-2 bg-${tone}-500/10 text-${tone}-400`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-[11px] text-zinc-500">Live from your workspace</p></div>)}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-white">Recent meetings</h2><p className="mt-1 text-xs text-zinc-500">Your searchable meeting library</p></div><button type="button" onClick={() => void loadMeetings(true)} className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white" aria-label="Refresh recent meetings"><ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin text-violet-400' : ''}`} /></button></div>
              <MeetingFilters searchQuery={searchQuery} onSearchChange={handleSearchChange} participantQuery={participantQuery} onParticipantChange={(value) => { setParticipantQuery(value); setPage(1); }} datePreset={datePreset} onDatePresetChange={(value) => { setDatePreset(value); setPage(1); }} sortOption={sortOption} onSortChange={(value) => { setSortOption(value); setPage(1); }} onResetFilters={resetFilters} isFiltered={isFiltered} />
              <div className="mt-6">
                {loading ? <div className="space-y-3" aria-label="Loading meetings">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />)}</div> : error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center"><p className="text-sm font-medium text-rose-200">{error}</p><button type="button" onClick={() => void loadMeetings()} className="mt-3 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/30">Try again</button></div> : result.items.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center"><h3 className="text-base font-semibold text-white">{isFiltered ? 'No meetings match these filters' : 'No meetings yet'}</h3><p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">{isFiltered ? 'Clear a filter or try a different search.' : 'Create your first meeting to start building your searchable intelligence workspace.'}</p><button type="button" onClick={isFiltered ? resetFilters : () => setCreateOpen(true)} className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500">{isFiltered ? 'Clear filters' : 'Create first meeting'}</button></div> : <MeetingList meetings={result.items} total={result.total} currentPage={result.page} totalPages={result.pages} pageSize={result.size} onPageChange={setPage} onDeleteMeeting={handleDelete} />}
              </div>
            </section>
          </div>
        </main>
      </div>
      <CreateMeetingModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onMeetingCreated={() => void loadMeetings(true)} />
    </div>
  </RequireAuth>;
}
