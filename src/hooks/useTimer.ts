
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
  const audioRef = useRef<HTMLAudioElement | null>(null); 

  const playSound = useCallback((soundType: 'tick' | 'segmentEnd' | 'sequenceComplete') => {
    if (typeof window !== 'undefined') {
      const soundEnabledRaw = localStorage.getItem('zenithTimerSoundEnabled');
      const soundEnabled = soundEnabledRaw ? JSON.parse(soundEnabledRaw) : true; // Default to true if not set

      if (!soundEnabled) {
        return;
      }

      // In a real app, you would have different audio files for different soundTypes.
      // For now, we'll just log.
      console.log(`Playing sound: ${soundType}`);
      
      // Example of how you might load and play different sounds:
      // let soundFile = '';
      // switch(soundType) {
      //   case 'tick': soundFile = '/sounds/tick.mp3'; break;
      //   case 'segmentEnd': soundFile = '/sounds/alarm.mp3'; break; // "Alarm sound" for segment end
      //   case 'sequenceComplete': soundFile = '/sounds/complete.mp3'; break;
      // }
      // if (soundFile) {
      //   if (!audioRef.current) {
      //     audioRef.current = new Audio();
      //   }
      //   audioRef.current.src = soundFile;
      //   audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      // }
    }
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

    if (isBetweenSectionsRest) { 
      currentSegmentIndex = 0;
      currentWorkItemIndex = 0;
      isResting = false;
      isBetweenSectionsRest = false;
      const nextSegment = configuration.segments[currentSegmentIndex];
      const nextWorkItem = nextSegment.work[currentWorkItemIndex];
      updateTimerDisplay(nextSegment.time, nextWorkItem, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
      playSound('segmentEnd');
      return;
    }

    if (isResting) { 
      isResting = false;
      if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; 
         currentSegmentIndex++;
      }
    } else { 
      currentWorkItemIndex++;
    }
    
    if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
      if (currentSegment.rest > 0 && !isResting) { 
        isResting = true;
        updateTimerDisplay(currentSegment.rest, currentSegment.restString, currentSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
        playSound('segmentEnd');
        return;
      }
      isResting = false; 
      currentWorkItemIndex = 0; 
      currentSegmentIndex++;
    }

    if (currentSegmentIndex >= configuration.segments.length) {
      if (configuration.repeat) {
        if (configuration.restBetweenSections > 0) {
          isBetweenSectionsRest = true;
          updateTimerDisplay(configuration.restBetweenSections, "Rest before repeating sequence", "Section Break", 0, 0, false, isBetweenSectionsRest);
          playSound('segmentEnd');
        } else { 
          currentSegmentIndex = 0;
          currentWorkItemIndex = 0;
          isResting = false; 
          isBetweenSectionsRest = false; 
          const nextSegment = configuration.segments[currentSegmentIndex];
          updateTimerDisplay(nextSegment.time, nextSegment.work[currentWorkItemIndex], nextSegment.name, currentWorkItemIndex, currentSegmentIndex, false, false);
          playSound('segmentEnd');
        }
      } else { 
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        playSound('sequenceComplete');
      }
      return;
    }
    
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest); 
    playSound('segmentEnd');

  }, [configuration, timerState, updateTimerDisplay, playSound]);


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
            isRunning: false, 
            isPaused: false,
            isComplete: false,
            totalSegments: configuration.segments.length,
            totalWorkItemsInSegment: initialSegment.work.length,
          });
      } else {
         setTimerState({...initialTimerState, description: "Invalid timer configuration (no work items or segments)."});
      }
    } else {
      setTimerState(initialTimerState);
    }
  }, [configuration]); 

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && timerState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
        if (timerState.timeLeft <= 4 && timerState.timeLeft > 1) playSound('tick'); 
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
    if (timerState.isComplete) { 
        const initialSegment = configuration.segments[0];
        if (initialSegment) { 
            setTimerState({
                timeLeft: initialSegment.time,
                description: initialSegment.work[0],
                currentSegmentName: initialSegment.name,
                currentWorkItemIndex: 0,
                currentSegmentIndex: 0,
                isResting: false,
                isBetweenSectionsRest: false,
                isRunning: true, 
                isPaused: false,
                isComplete: false,
                totalSegments: configuration.segments.length,
                totalWorkItemsInSegment: initialSegment.work.length,
            });
        } else {
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else {
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
  
  const resetTimer = () => { 
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
        isRunning: false, 
        isPaused: false,
        isComplete: false,
        totalSegments: configuration.segments.length,
        totalWorkItemsInSegment: initialSegment.work.length,
      });
    } else {
      setTimerState(initialTimerState); 
    }
  };
  
  const skipToNext = () => {
    if (!timerState.isRunning && !timerState.isPaused) { 
        if (!configuration || timerState.isComplete) return; 
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    moveToNextState(); 

    if (timerState.isPaused) {
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true}));
    } else if (timerState.isRunning) {
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

