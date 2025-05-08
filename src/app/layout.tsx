
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import GlobalTimerBar from '@/components/GlobalTimerBar'; // Import GlobalTimerBar
import { TimerProvider } from '@/contexts/TimerContext'; // Import TimerProvider
import { cn } from '@/lib/utils';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'Zenith Timer',
  description: 'Customizable timer sequences for productivity and well-being.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased flex flex-col min-h-screen bg-background`}>
        <TimerProvider> {/* Wrap with TimerProvider */}
          <Header /> {/* Header will hide itself on mobile */}
          <main className={cn(
            "flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8",
            // Add padding-bottom for mobile to account for BottomNavigation AND GlobalTimerBar
            // GlobalTimerBar is h-16 (64px), BottomNavigation is h-16 (64px)
            // Total pb on mobile: 64px (BottomNav) + 64px (GlobalTimerBar) = 128px -> theme(spacing.32)
            "pb-[calc(theme(spacing.16)_+_theme(spacing.16))] md:pb-[theme(spacing.14)]" 
            // On desktop, BottomNavigation is hidden, GlobalTimerBar is h-14 (56px) -> theme(spacing.14)
          )}>
            {children}
          </main>
          <GlobalTimerBar /> {/* Add GlobalTimerBar */}
          <BottomNavigation /> {/* BottomNavigation will show itself only on mobile, GlobalTimerBar will be above it */}
          <Toaster />
        </TimerProvider>
      </body>
    </html>
  );
}
