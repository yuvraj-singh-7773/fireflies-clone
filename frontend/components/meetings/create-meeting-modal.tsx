'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createMeeting, updateMeeting } from '@/lib/api/meetings';
import { MeetingDetail, MeetingStatus } from '@/types';
import { XMarkIcon, PlusIcon } from '../ui/icons';
import { useToast } from '../ui/toast';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: () => void;
  meeting?: MeetingDetail | null;
  onMeetingUpdated?: (meeting: MeetingDetail) => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingCreated,
  meeting = null,
  onMeetingUpdated,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [durationMin, setDurationMin] = useState(45);
  const [status, setStatus] = useState<MeetingStatus>('done');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isEditing = Boolean(meeting);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTitle(meeting?.title ?? '');
    setDate(meeting ? new Date(meeting.date).toISOString().slice(0, 16) : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setDurationMin(Math.max(5, Math.round((meeting?.duration_sec ?? 2700) / 60)));
    setStatus(meeting?.status ?? 'done');
    setParticipants(meeting?.participants.map((participant) => participant.name).join('\n') ?? '');
    setError(null);
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [isOpen, meeting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert datetime-local to ISO string
      const isoDate = new Date(date).toISOString();

      if (isEditing && meeting) {
        const updated = await updateMeeting(meeting.id, {
          title: title.trim(), date: isoDate, duration_sec: durationMin * 60, status,
          participants: participants.split('\n').map((name) => name.trim()).filter(Boolean).map((name) => ({ name })),
        });
        onMeetingUpdated?.(updated);
        showToast('Meeting updated successfully', 'success');
      } else {
        await createMeeting({ title: title.trim(), date: isoDate, duration_sec: durationMin * 60, status });
        showToast(`Meeting "${title.trim()}" created successfully!`, 'success');
        onMeetingCreated();
      }
      setTitle('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create meeting';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-form-title"
      onKeyDown={handleDialogKeyDown}
    >
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-zinc-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 id="meeting-form-title" className="text-lg font-bold text-white">
              {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add a new meeting record to your workspace library.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="meeting-title" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Meeting Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="meeting-title"
              ref={titleRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Product Roadmap Sync"
              className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="meeting-date" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Date & Time
              </label>
              <input
                id="meeting-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label htmlFor="meeting-duration" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Duration (minutes)
              </label>
              <input
                id="meeting-duration"
                type="number"
                min="5"
                max="480"
                step="5"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="meeting-status" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Initial Status
            </label>
            <select
              id="meeting-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MeetingStatus)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 cursor-pointer"
            >
              <option value="done">Processed / Done</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {isEditing && (
            <div>
              <label htmlFor="meeting-participants" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Participants
              </label>
              <textarea
                id="meeting-participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                rows={3}
                placeholder="One participant per line"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 shadow-md shadow-violet-500/20 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
