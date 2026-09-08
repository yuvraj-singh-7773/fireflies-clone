'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import {
  PlayIcon,
  PauseIcon,
  Backward5Icon,
  Forward5Icon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '../ui/icons';

interface MediaPlayerProps {
  currentTime: number; // in seconds
  duration: number; // in seconds
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (timeInSeconds: number) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  audioUrl?: string | null;
  onCurrentTimeChange: (time: number) => void;
  onDurationChange: (duration: number | null) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  playbackRate,
  onPlaybackRateChange,
  audioUrl,
  onCurrentTimeChange,
  onDurationChange,
  onPlayingChange,
}) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(currentTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speedId = useId();
  const volumeId = useId();

  const safeDuration = duration > 0 ? duration : 600; // default 10 minutes if duration is 0
  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayTime / safeDuration) * 100));

  // Sync actual HTML audio if available
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => onPlayingChange(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onPlayingChange]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
    setIsScrubbing(true);
  };

  const handleSeekCommit = () => {
    setIsScrubbing(false);
    onSeek(scrubValue);
  };

  const handleSkip = (deltaSeconds: number) => {
    const nextTime = Math.min(safeDuration, Math.max(0, currentTime + deltaSeconds));
    onSeek(nextTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-xl p-4 sm:p-5 space-y-3.5 backdrop-blur-md">
      {/* Hidden audio element if real media URL is available */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={(event) => onCurrentTimeChange(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => onDurationChange(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : null)}
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onEnded={() => onPlayingChange(false)}
        />
      )}

      {/* Progress Bar & Timestamps */}
      <div className="space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={safeDuration}
            step={0.1}
            value={displayTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:h-2 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{
              background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(129, 140, 248) ${progressPercent}%, rgb(39, 39, 42) ${progressPercent}%, rgb(39, 39, 42) 100%)`,
            }}
            aria-label="Media progress bar"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono font-medium text-zinc-400 px-0.5">
          <span className="text-zinc-200">{formatTime(displayTime)}</span>
          <div className="flex items-center gap-1 text-zinc-500">
            <span>/</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Waveform animation / status */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-end gap-1 h-5 w-8">
            <span
              className={`w-1 bg-violet-500 rounded-full transition-all duration-150 ${
                isPlaying ? 'h-5 animate-pulse' : 'h-1.5 opacity-40'
              }`}
            />
            <span
              className={`w-1 bg-indigo-400 rounded-full transition-all duration-200 ${
                isPlaying ? 'h-3 animate-bounce' : 'h-2 opacity-40'
              }`}
            />
            <span
              className={`w-1 bg-violet-400 rounded-full transition-all duration-150 ${
                isPlaying ? 'h-4 animate-pulse' : 'h-1 opacity-40'
              }`}
            />
            <span
              className={`w-1 bg-purple-500 rounded-full transition-all duration-200 ${
                isPlaying ? 'h-2 animate-bounce' : 'h-1.5 opacity-40'
              }`}
            />
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            {isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>

        {/* Center: Play/Pause and Skip buttons */}
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Rewind 5 seconds"
            aria-label="Rewind 5 seconds"
          >
            <Backward5Icon className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-white" />
            ) : (
              <PlayIcon className="w-5 h-5 text-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Fast forward 5 seconds"
            aria-label="Fast forward 5 seconds"
          >
            <Forward5Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Speed & Volume */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
            <label htmlFor={speedId} className="sr-only">
              Playback Speed
            </label>
            <select
              id={speedId}
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-semibold text-zinc-300 focus:outline-none cursor-pointer"
            >
              {speeds.map((s) => (
                <option key={s} value={s} className="bg-zinc-900 text-zinc-200">
                  {s}x
                </option>
              ))}
            </select>
          </div>

          {/* Volume / Mute */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="w-4 h-4 text-rose-400" />
              ) : (
                <SpeakerWaveIcon className="w-4 h-4 text-zinc-400" />
              )}
            </button>
            <label htmlFor={volumeId} className="sr-only">
              Audio volume
            </label>
            <input
              id={volumeId}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1 bg-zinc-800 rounded appearance-none accent-violet-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
