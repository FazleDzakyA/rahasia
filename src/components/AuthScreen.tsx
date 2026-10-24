'use client';

import React from 'react';
import {
  MessageSquare,
  Lock,
  User,
  Mail,
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { fazaaChatApi } from '../lib/fazaadb';
import { useChatStore, ChatUser } from '../store/useChatStore';

const AVATAR_SEEDS = [
  'Felix',
  'Aneka',
  'Milo',
  'Zack',
  'Luna',
  'Oliver',
  'Nala',
  'Coco',
];

export const AuthScreen: React.FC = () => {
  const { setCurrentUser, setAllUsers } = useChatStore();
  const [tab, setTab] = React.useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Register form state
  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [bioStatus, setBioStatus] = React.useState('Hey there! I am using fazaaChat.');
  const [avatarSeed, setAvatarSeed] = React.useState('Felix');

  // UI state
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const selectedAvatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
    avatarSeed
  )}`;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Harap isi username/email dan password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await fazaaChatApi.login(loginIdentifier.trim(), loginPassword);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fazaachat_user', JSON.stringify(user));
      }
      setCurrentUser(user);

      // Refresh user list
      const users = await fazaaChatApi.getUsers();
      setAllUsers(users);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali username dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !regPassword.trim()) {
      setErrorMsg('Harap lengkapi semua data pendaftaran.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username minimal 3 karakter.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const newUser = await fazaaChatApi.register({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: regPassword,
        avatar: selectedAvatarUrl,
        status: bioStatus.trim() || 'Active on fazaaChat',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('fazaachat_user', JSON.stringify(newUser));
      }
      setCurrentUser(newUser);

      // Refresh user list
      const users = await fazaaChatApi.getUsers();
      setAllUsers(users);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillUser = (u: string, p: string = 'password123') => {
    setLoginIdentifier(u);
    setLoginPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#111111] overflow-hidden select-none">
      {/* Ambient iOS 16 Glass Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md ios-glass rounded-[28px] p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#0A84FF] to-[#5AC8FA] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 border border-white/20">
            <MessageSquare className="w-8 h-8 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            fazaaChat
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Aplikasi pesan realtime modern iOS 16 Glassmorphism ditenagai oleh backend{' '}
            <span className="text-blue-400 font-medium">fazaaDB Cloud</span>.
          </p>
        </div>

        {/* Tab Switcher (iOS Segmented Style) */}
        <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              tab === 'login'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              tab === 'register'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in duration-150">
            <span className="font-bold">•</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="faza / sarah / nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl ios-glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl ios-glass-input text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white text-xs font-semibold shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Accounts for Multi-Device LAN Testing */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  Tes Cepat Akun Contoh:
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-Klik Isi</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickFillUser('faza')}
                  className="p-2 rounded-xl ios-glass-card hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Faza</p>
                  <p className="text-[10px] text-blue-400 font-mono truncate">@faza</p>
                </button>
                <button
                  type="button"
                  onClick={() => quickFillUser('sarah')}
                  className="p-2 rounded-xl ios-glass-card hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Sarah</p>
                  <p className="text-[10px] text-purple-400 font-mono truncate">@sarah</p>
                </button>
                <button
                  type="button"
                  onClick={() => quickFillUser('budi')}
                  className="p-2 rounded-xl ios-glass-card hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Budi</p>
                  <p className="text-[10px] text-emerald-400 font-mono truncate">@budi</p>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Atau daftar akun baru di tab sebelah untuk akun khusus perangkat Anda.
              </p>
            </div>
          </form>
        ) : (
          /* Tab 2: REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Avatar Selector */}
            <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <img
                src={selectedAvatarUrl}
                alt="Selected Avatar"
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 object-cover"
              />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-slate-300">Pilih Avatar Apple / DiceBear</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {AVATAR_SEEDS.slice(0, 5).map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setAvatarSeed(seed)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                        avatarSeed === seed
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {seed}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAvatarSeed(`Seed-${Math.floor(Math.random() * 9999)}`)}
                    className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                    title="Avatar Random"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Fazle Dzaky"
                className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="dzaky"
                  className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dzaky@example.com"
                className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 ml-1">
                Status / Bio
              </label>
              <input
                type="text"
                value={bioStatus}
                onChange={(e) => setBioStatus(e.target.value)}
                placeholder="Hey there! I am using fazaaChat."
                className="w-full px-3.5 py-2.5 rounded-2xl ios-glass-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-[#0071E3] text-white text-xs font-semibold shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Daftar Akun Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            Keamanan fazaaDB WAL
          </span>
          <span>Apple Liquid Glass UI</span>
        </div>
      </div>
    </div>
  );
};
