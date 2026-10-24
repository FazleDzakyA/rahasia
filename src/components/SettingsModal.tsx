'use client';

import React from 'react';
import { X, User, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser } = useChatStore();
  const [fullName, setFullName] = React.useState(currentUser?.full_name || '');
  const [status, setStatus] = React.useState(currentUser?.status || '');
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || '');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setStatus(currentUser.status);
      setAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await fazaaChatApi.updateUser(currentUser.id, {
        full_name: fullName.trim(),
        status: status.trim(),
        avatar: avatar.trim(),
      });

      setCurrentUser(updated);
      onClose();
    } catch (err) {
      alert('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="ios-glass rounded-3xl p-6 max-w-md w-full border border-white/10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white">Profile Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
            />
            <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">About / Status</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Avatar Image URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl ios-glass-input text-xs font-mono"
            />
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
