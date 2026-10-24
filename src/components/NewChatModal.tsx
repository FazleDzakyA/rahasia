'use client';

import React from 'react';
import { X, Users, MessageSquare, Plus, Check } from 'lucide-react';
import { useChatStore, ChatUser } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

export const NewChatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const {
    currentUser,
    allUsers,
    conversations,
    setConversations,
    setActiveConversation,
  } = useChatStore();

  const [tab, setTab] = React.useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = React.useState('');
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const contacts = allUsers.filter((u) => u.id !== currentUser?.id);

  const startDirectChat = async (targetUser: ChatUser) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // Check if conversation already exists
      const existing = conversations.find(
        (c) => c.type === 'private' && (c.id.includes(targetUser.username) || c.id.includes(targetUser.id))
      );

      if (existing) {
        setActiveConversation(existing);
        onCreated?.();
        onClose();
        return;
      }

      const conv = await fazaaChatApi.createConversation(
        'private',
        null,
        [currentUser.id, targetUser.id]
      );

      setConversations([conv, ...conversations]);
      setActiveConversation(conv);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0 || !currentUser) return;

    setLoading(true);
    try {
      const conv = await fazaaChatApi.createConversation(
        'group',
        groupName.trim(),
        [currentUser.id, ...selectedMembers],
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop'
      );

      setConversations([conv, ...conversations]);
      setActiveConversation(conv);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="ios-glass rounded-3xl p-6 max-w-md w-full border border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white">New Message</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 rounded-xl bg-white/[0.05] border border-white/10 flex items-center space-x-1 text-xs">
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              tab === 'direct' ? 'bg-[#0A84FF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              tab === 'group' ? 'bg-[#0A84FF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            New Group
          </button>
        </div>

        {/* Direct Chat Contact Picker */}
        {tab === 'direct' && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <p className="text-[11px] text-slate-400 uppercase font-bold px-1">
              Select Contact ({contacts.length})
            </p>
            {contacts.map((user) => (
              <div
                key={user.id}
                onClick={() => startDirectChat(user)}
                className="p-3 rounded-2xl ios-glass-card cursor-pointer flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{user.full_name}</h4>
                    <p className="text-[10px] text-slate-400">@{user.username}</p>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 font-medium">Chat →</span>
              </div>
            ))}
          </div>
        )}

        {/* Group Chat Creator */}
        {tab === 'group' && (
          <form onSubmit={createGroupChat} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Group Name *</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Launch, Keluarga, Gaming Hub"
                className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Members:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {contacts.map((user) => {
                  const isChecked = selectedMembers.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${
                        isChecked
                          ? 'bg-[#0A84FF]/20 border-[#0A84FF]/40 text-white'
                          : 'ios-glass-card border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span className="text-xs font-medium">{user.full_name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isChecked ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/20'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl ios-glass-card text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !groupName.trim() || selectedMembers.length === 0}
                className="px-5 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold disabled:opacity-40"
              >
                Create Group
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
