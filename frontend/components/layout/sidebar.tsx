'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderIcon,
  XMarkIcon,
  SparklesIcon,
} from '../ui/icons';
import { useAuth } from '@/components/auth/auth-provider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  totalMeetings?: number;
  apiConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  totalMeetings = 0,
  apiConnected = true,
}) => {
  const { user, logout } = useAuth();
  const navItems = [
    {
          name: 'Meetings Library',
          href: '/dashboard',
      icon: FolderIcon,
      active: true,
      badge: totalMeetings > 0 ? totalMeetings.toString() : undefined,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-850">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <span className="brand-mark group-hover:scale-105 transition-transform" aria-hidden="true"><i /><i /><i /><i /></span>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white">firefiles.ai</span>
                <span className="text-[11px] text-zinc-400 font-medium -mt-0.5">AI Meeting Assistant</span>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick AI status pill */}
          <div className="px-4 py-3">
            <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate">Smart Transcription</p>
                <p className="text-[11px] text-zinc-400 truncate">Ready for fast capture</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 py-2 space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    item.active
                      ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        item.active ? 'text-violet-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-violet-500/20 text-violet-300 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-zinc-850 space-y-2">
          {/* Backend Connection Indicator */}
          <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'
                }`}
              />
              <span className="text-zinc-400 text-[11px]">Backend API</span>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                apiConnected ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {apiConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* User Profile Card */}
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {(user?.display_name || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.display_name}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={logout} className="sm:hidden w-full px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 text-left">Sign out</button>
        </div>
      </aside>
    </>
  );
};
