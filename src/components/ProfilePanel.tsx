'use client';

import React from 'react';
import {
  X,
  Bell,
  Lock,
  Image as ImageIcon,
  Users,
  Shield,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export const ProfilePanel: React.FC<{
  onLogout: () => void;
}> = ({ onLogout }) => {
  const {
    currentUser,
    allUsers,
    activeConversation,
    messages,
    showProfilePanel,
    setShowProfilePanel,
  } = useChatStore();

  if (!showProfilePanel || !activeConversation) return null;

  // Determine chat partner
  const getPartner = () => {
    if (activeConversation.type === 'group') {
      return {
        name: activeConversation.name || 'Group Chat',
        avatar: activeConversation.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
        status: 'fazaaDB Engineering Group',
        isOnline: true,
      };
    }

    const other = allUsers.find(
      (u) => u && u.id !== currentUser?.id && activeConversation?.id && u.username && activeConversation.id.includes(u.username)
    ) || allUsers.find((u) => u && u.id !== currentUser?.id) || allUsers[0];

    return {
      name: other?.full_name || 'Contact',
      avatar: other?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      status: other?.status || 'Active on fazaaChat',
      username: other?.username,
      email: other?.email,
      isOnline: Boolean(other?.is_online),
    };
  };

  const partner = getPartner();
  const mediaMessages = messages.filter((m) => m.type === 'image' && m.file_url);

  return (
    <aside className="w-80 h-screen ios-glass border-l border-white/10 flex flex-col shrink-0 z-10 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[11px]">
          Conversation Info
        </h3>
        <button
          onClick={() => setShowProfilePanel(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview */}
      <div className="p-6 flex flex-col items-center text-center space-y-3 border-b border-white/10">
        <div className="relative">
          <img
            src={partner.avatar}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-2 border-white/15 shadow-xl"
          />
          {partner.isOnline && (
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#111111]" />
          )}
        </div>

        <div>
          <h4 className="text-base font-bold text-white">{partner.name}</h4>
          {partner.username && (
            <p className="text-xs text-blue-400 font-mono">@{partner.username}</p>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed px-2 bg-white/[0.04] p-2.5 rounded-2xl border border-white/5">
          &quot;{partner.status}&quot;
        </p>
      </div>

      {/* Shared Media Gallery */}
      <div className="p-5 space-y-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>Shared Photos ({mediaMessages.length})</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {mediaMessages.map((m) => (
            <div
              key={m.id}
              className="h-20 rounded-xl overflow-hidden bg-black/40 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(m.file_url, '_blank')}
            >
              <img src={m.file_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}

          {mediaMessages.length === 0 && (
            <div className="col-span-3 py-6 text-center text-[11px] text-slate-400">
              Belum ada foto yang dibagikan.
            </div>
          )}
        </div>
      </div>

      {/* Group Members if Group */}
      {activeConversation.type === 'group' && (
        <div className="p-5 space-y-3 border-b border-white/10">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Group Members ({allUsers.length})</span>
          </div>

          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <span className="text-slate-200 truncate">{u.full_name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {u.id === currentUser?.id ? 'You' : 'Member'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings & Privacy Quick Options */}
      <div className="p-5 space-y-3">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Privacy & Engine
        </h5>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl ios-glass-card flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200">Notifications</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400">Enabled</span>
          </div>

          <div className="p-3 rounded-xl ios-glass-card flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">Encryption</span>
            </div>
            <span className="text-[10px] font-mono text-blue-400">SQLite WAL</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full p-3 rounded-xl ios-glass-card text-rose-400 hover:bg-rose-500/10 flex items-center justify-center space-x-2 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Account</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
