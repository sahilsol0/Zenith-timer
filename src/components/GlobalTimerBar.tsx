'use client';

import { useGlobalTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { PauseIcon, PlayIcon, SkipForwardIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const GlobalTimerBar = () => {
  const {
    activeConfig,
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    skipToNext,
    isTimerActive,
  } = useGlobalTimer();

  if (!isTimerActive || !activeConfig) {
    return null;
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (timerState.isRunning && !timerState.isPaused) {
      pauseTimer();
    } else if (timerState.isPaused) {
      resumeTimer();
    } else {
      startTimer();
    }
  };

  let progressPercentage = 0;
  if (activeConfig && activeConfig.segments[timerState.currentSegmentIndex]) {
    const currentSegmentDetails = activeConfig.segments[timerState.currentSegmentIndex];
     if (currentSegmentDetails.time > 0) {
        const timeElapsed = timerState.isResting ? currentSegmentDetails.rest - timerState.timeLeft : currentSegmentDetails.time - timerState.timeLeft;
        const totalDuration = timerState.isResting ? currentSegmentDetails.rest : currentSegmentDetails.time;
        if (totalDuration > 0) {
          progressPercentage = (timeElapsed / totalDuration) * 100;
        }
    } else if (timerState.isBetweenSectionsRest && activeConfig.restBetweenSections > 0) {
        const timeElapsed = activeConfig.restBetweenSections - timerState.timeLeft;
        if (activeConfig.restBetweenSections > 0) {
          progressPercentage = (timeElapsed / activeConfig.restBetweenSections) * 100;
        }
    }
  }
  if (timerState.isComplete) progressPercentage = 100;


  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg transition-transform duration-300 ease-in-out',
        'md:bottom-0', // On desktop, it's just at the bottom
        'h-16 md:h-14', // Height: 64px on mobile, 56px on desktop
        'pb-[env(safe-area-inset-bottom)] md:pb-0', // iOS notch padding for content within the bar
        isTimerActive ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      {/* Removed spacer div: <div className="md:hidden h-16" /> */}

      <Link href="/timer" className="block h-full w-full cursor-pointer">
        <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-primary">{activeConfig.name}</p>
            <p className="text-xs truncate text-foreground/80">
              {timerState.currentSegmentName}
              {!timerState.isResting && !timerState.isBetweenSectionsRest && timerState.totalWorkItemsInSegment > 1 && (
                <span className="text-xs"> ({timerState.currentWorkItemIndex + 1}/{timerState.totalWorkItemsInSegment})</span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 mx-2 sm:mx-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePlayPause(); }}
              className="h-8 w-8 sm:h-9 sm:w-9 text-primary hover:bg-primary/10"
              aria-label={timerState.isRunning && !timerState.isPaused ? 'Pause' : 'Play'}
            >
              {timerState.isRunning && !timerState.isPaused ? (
                <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
            {(timerState.isRunning || timerState.isPaused) && !timerState.isComplete && (
               <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); skipToNext(); }}
                className="h-8 w-8 sm:h-9 sm:w-9 text-foreground/70 hover:text-primary hover:bg-primary/10"
                aria-label="Skip to next"
              >
                <SkipForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>

          <div className="text-lg sm:text-xl font-semibold tabular-nums text-foreground w-20 sm:w-24 text-right">
            {formatTime(timerState.timeLeft)}
          </div>
        </div>
      </Link>
      <Progress
        value={progressPercentage}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent"
        indicatorClassName={cn(
            'transition-all duration-1000 ease-linear', // Ensure smooth progress animation
            timerState.isComplete ? 'bg-green-500' : 
            timerState.isResting || timerState.isBetweenSectionsRest ? 'bg-accent' : 'bg-primary'
        )}
      />
    </div>
  );
};

export default GlobalTimerBar;
