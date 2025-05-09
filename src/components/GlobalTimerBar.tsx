
'use client';

import { useGlobalTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { PauseIcon, PlayIcon, SkipForwardIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

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
  const isMobile = useIsMobile(); // Determine if current view is mobile

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
        'fixed left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg transition-transform duration-300 ease-in-out',
        { // Conditional bottom positioning
          'bottom-16': isMobile && isTimerActive, // On mobile & timer active: GTB sits above BottomNavigation
          'bottom-0': !isMobile || !isTimerActive,   // On desktop, or on mobile if timer not active (GTB is hidden anyway by translate)
        },
        'h-16 md:h-14', // Height: 64px on mobile, 56px on desktop
        { // Safe area padding for the bar itself. Only apply if it's at the very bottom of the viewport.
          'pb-[env(safe-area-inset-bottom)]': !isMobile && isTimerActive,
        },
        isTimerActive ? 'translate-y-0' : 'translate-y-full' // Controls visibility by sliding in/out
      )}
    >
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
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent" // Progress bar sits at the bottom of this component
        indicatorClassName={cn(
            'transition-all duration-1000 ease-linear',
            timerState.isComplete ? 'bg-green-500' : 
            timerState.isResting || timerState.isBetweenSectionsRest ? 'bg-accent' : 'bg-primary'
        )}
      />
    </div>
  );
};

export default GlobalTimerBar;
