'use client';

import React from 'react';
import { X, User, Sparkles, LogOut, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}> = ({ isOpen, onClose, onLogout }) => {
  const { currentUser, setCurrentUser } = useChatStore();
  const [fullName, setFullName] = React.useState(currentUser?.full_name || '');
  const [status, setStatus] = React.useState(currentUser?.status || '');
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || '');
  const [loading, setLoading] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setStatus(currentUser.status || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const uploadRes = await fazaaChatApi.uploadMedia(file);
      if (uploadRes?.absoluteUrl) {
        setAvatar(uploadRes.absoluteUrl);
      }
    } catch (err: any) {
      alert('Gagal mengunggah foto profil: ' + (err.message || ''));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await fazaaChatApi.updateUser(currentUser.id, {
        full_name: fullName.trim(),
        status: status.trim(),
        avatar: avatar.trim(),
      });

      const updatedUser = {
        ...currentUser,
        full_name: fullName.trim(),
        status: status.trim(),
        avatar: avatar.trim(),
      };
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fazaachat_user', JSON.stringify(updatedUser));
      }
      onClose();
    } catch (err: any) {
      alert('Gagal memperbarui profil: ' + (err.message || ''));
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
          <div className="flex flex-col items-center space-y-2.5">
            <div className="relative group">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
            </div>

            {/* Hidden file input for album / gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-white/10 active:scale-95"
            >
              {uploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pilih dari Album / Galeri</span>
                </>
              )}
            </button>

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

          <div className="pt-2 flex items-center justify-between">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl ios-glass-card text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingAvatar}
                className="px-5 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
