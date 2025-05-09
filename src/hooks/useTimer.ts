
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerConfiguration, TimerSegment } from '@/lib/types';

export type TimerState = {
  timeLeft: number;
  description: string;
  currentSegmentName: string;
  currentWorkItemIndex: number; // Index of the current work item within the segment's `work` array
  currentSegmentIndex: number; // Index of the current segment in the `segments` array
  isResting: boolean; // True if in segment's own rest period
  isBetweenSectionsRest: boolean; // True if in rest period between full sequence repeats
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  totalSegments: number;
  totalWorkItemsInSegment: number;
};

const initialTimerState: TimerState = {
  timeLeft: 0,
  description: 'Loading timer...',
  currentSegmentName: '',
  currentWorkItemIndex: 0,
  currentSegmentIndex: 0,
  isResting: false,
  isBetweenSectionsRest: false,
  isRunning: false,
  isPaused: false,
  isComplete: false,
  totalSegments: 0,
  totalWorkItemsInSegment: 0,
};

export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // For sound notifications

  const playSound = useCallback((soundType: 'tick' | 'complete' | 'transition') => {
    // This is a placeholder. In a real app, you'd have actual sound files.
    console.log(`Playing sound: ${soundType}`);
    if (typeof window !== 'undefined' && !audioRef.current) {
        // Example: audioRef.current = new Audio('/sounds/transition.mp3');
    }
    // audioRef.current?.play().catch(e => console.warn("Audio play failed:", e));
  }, []);

  const updateTimerDisplay = useCallback((
    newTimeLeft: number,
    newDescription: string,
    newSegmentName: string,
    newWorkItemIndex: number,
    newSegmentIndex: number,
    newIsResting: boolean,
    newIsBetweenSectionsRest: boolean,
    newIsComplete: boolean = false,
  ) => {
    setTimerState(prev => ({
      ...prev,
      timeLeft: newTimeLeft,
      description: newDescription,
      currentSegmentName: newSegmentName,
      currentWorkItemIndex: newWorkItemIndex,
      currentSegmentIndex: newSegmentIndex,
      isResting: newIsResting,
      isBetweenSectionsRest: newIsBetweenSectionsRest,
      isComplete: newIsComplete,
      totalSegments: configuration?.segments.length || 0,
      totalWorkItemsInSegment: configuration?.segments[newSegmentIndex]?.work.length || 0,
    }));
  }, [configuration]);


  const moveToNextState = useCallback(() => {
    if (!configuration) return;

    let {
      currentSegmentIndex,
      currentWorkItemIndex,
      isResting,
      isBetweenSectionsRest,
    } = timerState;

    const currentSegment = configuration.segments[currentSegmentIndex];

    if (isBetweenSectionsRest) { // Was resting between sections, start new cycle
      currentSegmentIndex = 0;
      currentWorkItemIndex = 0;
      isResting = false;
      isBetweenSectionsRest = false;
      const nextSegment = configuration.segments[currentSegmentIndex];
      const nextWorkItem = nextSegment.work[currentWorkItemIndex];
      updateTimerDisplay(nextSegment.time, nextWorkItem, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
      playSound('transition');
      return;
    }

    if (isResting) { // Was resting within a segment, move to next work item or segment
      isResting = false;
      // currentWorkItemIndex was already advanced before rest, or segment finished.
      // Let's check if we need to move to next segment after this rest.
      if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; // Reset for new segment
         currentSegmentIndex++;
      }
    } else { // Was in a work item
      currentWorkItemIndex++;
    }
    
    // Check if work items in current segment are done
    if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
      // Work items done. Does this segment have a rest period?
      if (currentSegment.rest > 0 && !isResting) { // Ensure not already resting
        isResting = true;
        updateTimerDisplay(currentSegment.rest, currentSegment.restString, currentSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
        playSound('transition');
        return;
      }
      // No rest or rest just finished, move to next segment
      isResting = false; // Ensure reset
      currentWorkItemIndex = 0; // Reset for new segment
      currentSegmentIndex++;
    }

    // Check if all segments are done
    if (currentSegmentIndex >= configuration.segments.length) {
      if (configuration.repeat) {
        if (configuration.restBetweenSections > 0) {
          isBetweenSectionsRest = true;
          updateTimerDisplay(configuration.restBetweenSections, "Rest before repeating sequence", "Section Break", 0, 0, false, isBetweenSectionsRest);
          playSound('transition');
        } else { // No rest between sections, immediately restart
          currentSegmentIndex = 0;
          currentWorkItemIndex = 0;
          isResting = false; // ensure not resting
          isBetweenSectionsRest = false; // ensure not between sections rest
          const nextSegment = configuration.segments[currentSegmentIndex];
          updateTimerDisplay(nextSegment.time, nextSegment.work[currentWorkItemIndex], nextSegment.name, currentWorkItemIndex, currentSegmentIndex, false, false);
          playSound('transition');
        }
      } else { // Not repeating, timer is complete
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        playSound('complete');
      }
      return;
    }
    
    // Set up for the next work item/segment
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest); // isResting should be false here
    playSound('transition');

  }, [configuration, timerState, updateTimerDisplay, playSound]);


  // Initialize or re-initialize timer when configuration changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (configuration && configuration.segments.length > 0) {
      const initialSegment = configuration.segments[0];
      if (initialSegment && initialSegment.work.length > 0) {
          setTimerState({
            timeLeft: initialSegment.time,
            description: initialSegment.work[0],
            currentSegmentName: initialSegment.name,
            currentWorkItemIndex: 0,
            currentSegmentIndex: 0,
            isResting: false,
            isBetweenSectionsRest: false,
            isRunning: false, // Important: Should not auto-start
            isPaused: false,
            isComplete: false,
            totalSegments: configuration.segments.length,
            totalWorkItemsInSegment: initialSegment.work.length,
          });
      } else {
         setTimerState({...initialTimerState, description: "Invalid timer configuration (no work items or segments)."});
      }
    } else {
      // No configuration or empty segments, reset to initial state
      setTimerState(initialTimerState);
    }
  }, [configuration]); // Key dependency: re-run when configuration changes

  // Timer tick logic
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && timerState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
        if (timerState.timeLeft <= 4 && timerState.timeLeft > 1) playSound('tick'); // Tick for last 3 seconds
      }, 1000);
    } else if (timerState.isRunning && !timerState.isPaused && timerState.timeLeft === 0) {
      moveToNextState();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerState.isRunning, timerState.isPaused, timerState.timeLeft, moveToNextState, playSound]);


  const startTimer = () => {
    if (!configuration || configuration.segments.length === 0) {
        setTimerState(prev => ({...prev, description: "Cannot start: No configuration or segments."}));
        return;
    }
    if (timerState.isComplete) { // If timer was complete, "Restart" it
        const initialSegment = configuration.segments[0];
        if (initialSegment) { // Should always exist if config is valid
            setTimerState({
                timeLeft: initialSegment.time,
                description: initialSegment.work[0],
                currentSegmentName: initialSegment.name,
                currentWorkItemIndex: 0,
                currentSegmentIndex: 0,
                isResting: false,
                isBetweenSectionsRest: false,
                isRunning: true, // Start immediately
                isPaused: false,
                isComplete: false,
                totalSegments: configuration.segments.length,
                totalWorkItemsInSegment: initialSegment.work.length,
            });
        } else {
            // Fallback, though should not happen with valid config
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else {
        // Standard start for a new or paused timer (though resume is separate)
        // This handles starting a timer that was just reset, or a brand new one.
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  };

  const resumeTimer = () => {
    if (!configuration || configuration.segments.length === 0 || timerState.isComplete) return;
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };
  
  const resetTimer = () => { // Removed startAfterReset parameter
    if (timerRef.current) clearTimeout(timerRef.current);
    if (configuration && configuration.segments.length > 0) {
      const initialSegment = configuration.segments[0];
      setTimerState({
        timeLeft: initialSegment.time,
        description: initialSegment.work[0],
        currentSegmentName: initialSegment.name,
        currentWorkItemIndex: 0,
        currentSegmentIndex: 0,
        isResting: false,
        isBetweenSectionsRest: false,
        isRunning: false, // Always set isRunning to false on reset
        isPaused: false,
        isComplete: false,
        totalSegments: configuration.segments.length,
        totalWorkItemsInSegment: initialSegment.work.length,
      });
    } else {
      setTimerState(initialTimerState); // initialTimerState also has isRunning: false
    }
  };
  
  const skipToNext = () => {
    if (!timerState.isRunning && !timerState.isPaused) { // Only skip if timer has been started
        if (!configuration || timerState.isComplete) return; // Or if no config or already complete
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    moveToNextState(); // Force transition

    // If it was running and not paused, it should continue running on the new state.
    // If it was paused, it should remain paused but on the new state.
    // moveToNextState already updates timeLeft. We just need to manage isRunning/isPaused.
    if (timerState.isPaused) {
        // Stay paused. moveToNextState handles updating the display values.
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true}));
    } else if (timerState.isRunning) {
        // Continue running
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false}));
    }
    // If it was neither running nor paused (i.e. ready to start),
    // moveToNextState will set it up, but it won't auto-start.
  };

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipToNext,
  };
};

