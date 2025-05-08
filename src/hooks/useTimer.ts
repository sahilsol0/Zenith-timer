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

export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>({
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
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // For sound notifications

  const playSound = useCallback((soundType: 'tick' | 'complete' | 'transition') => {
    // This is a placeholder. In a real app, you'd have actual sound files.
    // For now, console log. You might use Tone.js or similar for web audio.
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
      // This logic is simplified: assumes rest is AFTER all work items in a segment.
      // If work items are exhausted, move to next segment
      if (currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; // Reset for new segment
         currentSegmentIndex++;
      }
    } else { // Was in a work item
      currentWorkItemIndex++;
    }
    
    // Check if work items in current segment are done
    if (currentWorkItemIndex >= currentSegment.work.length) {
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
          const nextSegment = configuration.segments[currentSegmentIndex];
          updateTimerDisplay(nextSegment.time, nextSegment.work[currentWorkItemIndex], nextSegment.name, currentWorkItemIndex, currentSegmentIndex, false, false);
          playSound('transition');
        }
      } else { // Not repeating, timer is complete
        setTimerState(prev => ({ ...prev, isRunning: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        playSound('complete');
      }
      return;
    }
    
    // Set up for the next work item/segment
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
    playSound('transition');

  }, [configuration, timerState, updateTimerDisplay, playSound]);


  // Initialize timer
  useEffect(() => {
    if (configuration) {
      const initialSegment = configuration.segments[0];
      if (initialSegment) {
          updateTimerDisplay(
            initialSegment.time,
            initialSegment.work[0],
            initialSegment.name,
            0, 0, false, false
          );
          setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: false }));
      } else {
         setTimerState(prev => ({ ...prev, description: "Invalid timer configuration."}));
      }
    }
  }, [configuration, updateTimerDisplay]);

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
    if (timerState.isComplete) { // If timer was complete, reset before starting
        resetTimer(); // Reset sets up initial state, then we start
        // Small delay to allow reset to propagate state before setting isRunning true
        setTimeout(() => {
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
        }, 50);
    } else {
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  };

  const resumeTimer = () => {
    if (!configuration || configuration.segments.length === 0) return;
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };
  
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (configuration) {
      const initialSegment = configuration.segments[0];
      updateTimerDisplay(
        initialSegment.time,
        initialSegment.work[0],
        initialSegment.name,
        0, 0, false, false
      );
      setTimerState(prev => ({
        ...prev, // keep existing values for indexes, names etc.
        timeLeft: initialSegment.time,
        description: initialSegment.work[0],
        currentSegmentName: initialSegment.name,
        currentWorkItemIndex: 0,
        currentSegmentIndex: 0,
        isResting: false,
        isBetweenSectionsRest: false,
        isRunning: false,
        isPaused: false,
        isComplete: false,
      }));
    }
  };
  
  // Function to skip to the next segment/work item
  const skipToNext = () => {
    if (!timerState.isRunning && !timerState.isPaused) return; // Only skip if timer is active or paused
    if (timerRef.current) clearTimeout(timerRef.current);
    moveToNextState(); // Force transition
     // If paused, remain paused but on the new state
    if (timerState.isPaused) {
      setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true}));
    } else {
      // If it was running, ensure timeLeft is set for the new state and it continues
       setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false}));
    }
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
