import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'fazaaChat - iOS 16 Realtime Messages',
  description: 'Modern Apple iMessage style Realtime Messaging App powered by fazaaDB Cloud Backend-as-a-Service.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'fazaaChat',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#111111] text-[#F5F5F7] min-h-screen overflow-hidden antialiased">
        <div className="bg-ambient">
          <div className="glow-spot-1" />
          <div className="glow-spot-2" />
        </div>
        <div className="relative z-10 flex min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
