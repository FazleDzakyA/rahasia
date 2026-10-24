'use client';

import React from 'react';
import {
  Search,
  Plus,
  Users,
  Settings,
  Circle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useChatStore, ConversationItem, ChatUser } from '../store/useChatStore';
import { UserSwitcher } from './UserSwitcher';

export const Sidebar: React.FC<{
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
}> = ({ onOpenNewChat, onOpenSettings }) => {
  const {
    currentUser,
    allUsers,
    conversations,
    activeConversation,
    setActiveConversation,
  } = useChatStore();

  const [search, setSearch] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'all' | 'direct' | 'groups'>('all');

  // Helper to get conversation display title and avatar
  const getConvDetails = (conv: ConversationItem) => {
    if (conv.type === 'group') {
      return {
        title: conv.name || 'Group Chat',
        avatar: conv.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
        isOnline: true,
      };
    }

    // Private chat: find the other participant
    // Format: 'conv-user1-user2' or from members
    const otherUser = allUsers.find(
      (u) => u.id !== currentUser?.id && conv.id.includes(u.username)
    ) || allUsers.find((u) => u.id !== currentUser?.id) || allUsers[0];

    return {
      title: otherUser?.full_name || 'Chat',
      avatar: otherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      isOnline: Boolean(otherUser?.is_online),
    };
  };

  const filteredConvs = conversations.filter((c) => {
    if (filterTab === 'direct' && c.type !== 'private') return false;
    if (filterTab === 'groups' && c.type !== 'group') return false;
    if (search.trim()) {
      const details = getConvDetails(c);
      return details.title.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-screen flex flex-col ios-glass border-r border-white/10 select-none z-10 shrink-0">
      {/* Top Header: Current User & Actions */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-white/15"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#111111]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">{currentUser?.full_name}</h2>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wider">
              ONLINE • fazaaChat
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenNewChat}
            className="w-8 h-8 rounded-full ios-glass-card flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full ios-glass-card flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulator Device Switcher Bar */}
      <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">Multi-Device Test:</span>
        <UserSwitcher />
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages or contacts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl ios-glass-input text-xs"
          />
        </div>
      </div>

      {/* Segmented Filter Control (Apple style) */}
      <div className="px-3 pb-2">
        <div className="p-1 rounded-xl bg-white/[0.04] border border-white/5 flex items-center space-x-1 text-xs">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`flex-1 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                filterTab === tab.id
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredConvs.map((conv) => {
          const isSelected = activeConversation?.id === conv.id;
          const { title, avatar, isOnline } = getConvDetails(conv);

          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 flex items-center space-x-3.5 border ${
                isSelected
                  ? 'bg-[#0A84FF]/20 border-[#0A84FF]/40 shadow-ios-bubble'
                  : 'border-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt={title}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#111111]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {conv.last_message_time
                      ? new Date(conv.last_message_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate leading-relaxed">
                  {conv.last_message || 'Belum ada pesan'}
                </p>
              </div>
            </div>
          );
        })}

        {filteredConvs.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p>Tidak ada percakapan ditemukan.</p>
          </div>
        )}
      </div>

      {/* Bottom Engine Status */}
      <div className="p-3 border-t border-white/10 text-center text-[10px] text-slate-400">
        Backend: <span className="text-blue-400 font-semibold">fazaaDB Cloud</span> • WebSocket Realtime
      </div>
    </aside>
  );
};
