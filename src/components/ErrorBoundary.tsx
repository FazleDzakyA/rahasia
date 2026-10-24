'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-screen bg-[#111111] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full p-8 rounded-3xl ios-glass border border-white/10 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Terjadi Kendala Tampilan
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aplikasi mendeteksi anomali pada obrolan. Jangan khawatir, pesan dan data Anda tetap tersimpan aman di fazaaDB Cloud.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-rose-300 break-words text-left">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Percakapan</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
