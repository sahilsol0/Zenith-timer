'use client';

import { Suspense, useEffect, useState }  from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTimer, type TimerState } from '@/hooks/useTimer';
import type { TimerConfiguration } from '@/lib/types';
import { TIMER_TEMPLATES, LOCAL_STORAGE_CUSTOM_TIMERS_KEY } from '@/lib/constants';
import TimerDisplay from '@/components/TimerDisplay';
import DescriptionArea from '@/components/DescriptionArea';
import TimerControls from '@/components/TimerControls';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeftIcon, SettingsIcon, ListChecksIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // For visual progress

function TimerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  const [selectedConfig, setSelectedConfig] = useState<TimerConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer, skipToNext } = useTimer(selectedConfig);

  useEffect(() => {
    if (!templateId) {
      setError("No timer template specified. Please select one from the templates page.");
      setIsLoading(false);
      // Optionally redirect: router.push('/templates');
      return;
    }

    const findConfig = () => {
      let config = TIMER_TEMPLATES.find(t => t.id === templateId);
      if (config) return config;

      const customTimersRaw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TIMERS_KEY);
      if (customTimersRaw) {
        try {
          const customTimers: TimerConfiguration[] = JSON.parse(customTimersRaw);
          config = customTimers.find(t => t.id === templateId);
        } catch (e) {
          console.error("Failed to parse custom timers:", e);
          setError("Error loading custom timer configuration.");
        }
      }
      return config || null;
    };

    const config = findConfig();

    if (config) {
      setSelectedConfig(config);
      setError(null);
    } else {
      setError(`Timer configuration with ID "${templateId}" not found.`);
    }
    setIsLoading(false);
  }, [templateId]);

  // Update document title with time left
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      const minutes = Math.floor(timerState.timeLeft / 60);
      const seconds = timerState.timeLeft % 60;
      document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ${timerState.currentSegmentName || 'Zenith Timer'}`;
    } else if (timerState.isPaused) {
      document.title = `Paused - ${selectedConfig?.name || 'Zenith Timer'}`;
    } else if (timerState.isComplete) {
      document.title = `Complete! - ${selectedConfig?.name || 'Zenith Timer'}`;
    }
    else {
      document.title = selectedConfig?.name ? `${selectedConfig.name} - Zenith Timer` : 'Zenith Timer';
    }
  }, [timerState.timeLeft, timerState.isRunning, timerState.isPaused, timerState.isComplete, timerState.currentSegmentName, selectedConfig]);


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p className="text-lg sm:text-xl text-foreground/80">Loading timer configuration...</p></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center px-4">
        <p className="text-lg sm:text-xl text-destructive mb-4">{error}</p>
        <Link href="/templates">
          <Button variant="outline">
            <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Templates
          </Button>
        </Link>
      </div>
    );
  }

  if (!selectedConfig) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p className="text-lg sm:text-xl text-foreground/80">Configuration not loaded.</p></div>;
  }
  
  const currentSegmentDetails = selectedConfig.segments[timerState.currentSegmentIndex];
  let progressPercentage = 0;
  if (currentSegmentDetails && currentSegmentDetails.time > 0) {
      const timeElapsed = timerState.isResting ? currentSegmentDetails.rest - timerState.timeLeft : currentSegmentDetails.time - timerState.timeLeft;
      const totalDuration = timerState.isResting ? currentSegmentDetails.rest : currentSegmentDetails.time;
      if (totalDuration > 0) {
        progressPercentage = (timeElapsed / totalDuration) * 100;
      }
  } else if (timerState.isBetweenSectionsRest && selectedConfig.restBetweenSections > 0) {
      const timeElapsed = selectedConfig.restBetweenSections - timerState.timeLeft;
      if (selectedConfig.restBetweenSections > 0) {
        progressPercentage = (timeElapsed / selectedConfig.restBetweenSections) * 100;
      }
  }
  if (timerState.isComplete) progressPercentage = 100;


  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 space-y-6 md:space-y-8 min-h-full">
      <div className="w-full max-w-3xl text-center">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 space-y-1 sm:space-y-0 px-2">
            <Link href="/templates" className="text-xs sm:text-sm text-accent hover:underline flex items-center">
                <ChevronLeftIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Change Template
            </Link>
            {selectedConfig.isCustom && (
                 <Link href={`/create?editId=${selectedConfig.id}`} className="text-xs sm:text-sm text-accent hover:underline flex items-center">
                    <SettingsIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Edit This Timer
                </Link>
            )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-primary mb-1">{selectedConfig.name}</h2>
        <p className="text-base sm:text-lg text-foreground/70 mb-1">
          Segment: <span className="font-medium text-foreground/90">{timerState.currentSegmentName}</span>
          {!timerState.isResting && !timerState.isBetweenSectionsRest && timerState.totalWorkItemsInSegment > 1 && (
            <span className="text-xs sm:text-sm"> ({timerState.currentWorkItemIndex + 1}/{timerState.totalWorkItemsInSegment})</span>
          )}
        </p>
      </div>

      <TimerDisplay seconds={timerState.timeLeft} className={timerState.isComplete ? 'text-green-400' : timerState.isResting || timerState.isBetweenSectionsRest ? 'text-accent' : 'text-foreground'} />
      
      <div className="w-full max-w-md sm:max-w-xl px-2 sm:px-0">
         <Progress value={progressPercentage} className="h-2 sm:h-3 bg-card/50" indicatorClassName={timerState.isComplete ? 'bg-green-500' : timerState.isResting || timerState.isBetweenSectionsRest ? 'bg-accent' : 'bg-primary'} />
      </div>

      <DescriptionArea text={timerState.description} className="w-full max-w-md sm:max-w-xl" />

      <TimerControls
        isRunning={timerState.isRunning}
        isPaused={timerState.isPaused}
        isComplete={timerState.isComplete}
        onStart={startTimer}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onReset={resetTimer}
        onSkip={skipToNext}
      />
      
      {selectedConfig.segments.length > 1 && !timerState.isComplete && (
        <div className="w-full max-w-md sm:max-w-xl mt-2 sm:mt-4 p-3 sm:p-4 bg-card/70 backdrop-blur-sm rounded-lg shadow">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center"><ListChecksIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Up Next:</h3>
            <ul className="space-y-1 text-xs sm:text-sm text-foreground/80 max-h-24 sm:max-h-32 overflow-y-auto">
                {selectedConfig.segments.map((segment, index) => {
                    if (index > timerState.currentSegmentIndex) {
                        return (
                            <li key={`${segment.name}-${index}`} className="opacity-70">
                                {segment.name}
                                {segment.work.length > 0 && `: ${segment.work[0]}`}
                            </li>
                        );
                    }
                    if (index === timerState.currentSegmentIndex) {
                        const nextWorkItem = segment.work[timerState.currentWorkItemIndex + 1];
                        if (!timerState.isResting && !timerState.isBetweenSectionsRest && nextWorkItem) {
                             return <li key={`next-work-${index}`} className="font-medium">{nextWorkItem}</li>;
                        }
                        if (segment.rest > 0 && !timerState.isResting && !timerState.isBetweenSectionsRest) { 
                            return <li key={`next-rest-${index}`} className="font-medium">{segment.restString || "Rest"}</li>;
                        }
                        const nextSegment = selectedConfig.segments[index + 1];
                        if (nextSegment) {
                            return <li key={`next-segment-${index+1}`} className="font-medium">{nextSegment.name}: {nextSegment.work[0]}</li>;
                        }
                        if (selectedConfig.repeat) {
                            const firstSegment = selectedConfig.segments[0];
                            return <li key={`next-repeat-${index}`} className="font-medium">{(selectedConfig.restBetweenSections > 0 && !timerState.isBetweenSectionsRest) ? "Section Break, then: " : ""}{firstSegment.name}: {firstSegment.work[0]}</li>;
                        }
                    }
                    return null;
                }).filter(Boolean).slice(0,3)
                }
                {timerState.isComplete && <li>Timer finished!</li>}
                 {(timerState.isComplete || 
                    selectedConfig.segments.map((segment, index) => {
                         if (index > timerState.currentSegmentIndex) return true;
                         if (index === timerState.currentSegmentIndex) {
                            const nextWorkItem = segment.work[timerState.currentWorkItemIndex + 1];
                             if (!timerState.isResting && !timerState.isBetweenSectionsRest && nextWorkItem) return true;
                             if (segment.rest > 0 && !timerState.isResting && !timerState.isBetweenSectionsRest) return true;
                             if (selectedConfig.segments[index + 1]) return true;
                             if (selectedConfig.repeat) return true;
                         }
                         return false;
                    }).filter(Boolean).length === 0) && !timerState.isComplete && <li>End of sequence.</li>
                 }
            </ul>
        </div>
      )}
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p className="text-xl">Loading...</p></div>}>
      <TimerPageContent />
    </Suspense>
  );
}
