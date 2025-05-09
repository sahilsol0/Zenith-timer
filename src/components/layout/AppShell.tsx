
'use client';

import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import GlobalTimerBar from '@/components/GlobalTimerBar';
import { Toaster } from '@/components/ui/toaster';
import { useGlobalTimer } from '@/contexts/TimerContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AppShell({ children }: PropsWithChildren) {
  const { isTimerActive } = useGlobalTimer();
  const isMobile = useIsMobile();

  let mainPaddingBottomClass = '';

  if (isMobile === undefined) {
    // Fallback for initial SSR/client render before hooks fully resolve.
    // Default to accommodating both bars on mobile, one on desktop.
    mainPaddingBottomClass = 'pb-[calc(theme(spacing.16)_+_theme(spacing.16))] md:pb-[theme(spacing.14)]';
  } else if (isMobile) {
    if (isTimerActive) {
      // Mobile, Timer Active: Space for BottomNav (h-16 / 64px) + GlobalTimerBar (h-16 / 64px)
      mainPaddingBottomClass = 'pb-[calc(theme(spacing.16)_+_theme(spacing.16))]'; // Equivalent to 128px
    } else {
      // Mobile, Timer Not Active: Space for BottomNav (h-16 / 64px) only
      mainPaddingBottomClass = 'pb-[theme(spacing.16)]'; // Equivalent to 64px
    }
  } else { // Desktop
    if (isTimerActive) {
      // Desktop, Timer Active: Space for GlobalTimerBar (h-14 / 56px)
      mainPaddingBottomClass = 'md:pb-[theme(spacing.14)]'; // Equivalent to 56px
    } else {
      // Desktop, Timer Not Active: No bottom fixed bars needing specific space.
      // Apply a default small padding for aesthetics.
      mainPaddingBottomClass = 'md:pb-8'; // 32px, a common small padding
    }
  }

  return (
    <>
      <Header />
      <main className={cn(
        "flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8",
        mainPaddingBottomClass
      )}>
        {children}
      </main>
      <GlobalTimerBar />
      <BottomNavigation />
      <Toaster />
    </>
  );
}
