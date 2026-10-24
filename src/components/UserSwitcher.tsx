'use client';

import React from 'react';
import { useChatStore, ChatUser } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';
import { Radio, Users, Check, Sparkles } from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, allUsers, isWsConnected } = useChatStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const switchUser = async (user: ChatUser) => {
    setCurrentUser(user);
    setIsOpen(false);
    // Update online status in fazaaDB
    try {
      await fazaaChatApi.updateUser(user.id, {
        is_online: 1,
        last_seen: new Date().toISOString(),
      });
    } catch {}
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-full ios-glass text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 border border-white/10 transition-all hover:border-white/20"
        title="Simulasikan Device A / Device B untuk Realtime Test"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="truncate max-w-[120px]">{currentUser.full_name.split(' ')[0]} (Test Device)</span>
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl ios-glass p-2 shadow-2xl z-50 border border-white/15 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
            Switch Active User (Realtime Test)
          </div>
          <div className="space-y-1 py-1">
            {allUsers.map((u) => {
              const isActive = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u)}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-600/30 text-white font-semibold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={u.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="truncate">
                      <p className="truncate text-xs">{u.full_name}</p>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
