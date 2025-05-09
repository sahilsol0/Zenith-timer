
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

const soundFiles = {
  tick: '/sounds/tick.mp3',
  segmentEnd: '/sounds/segment_end.mp3',
  sequenceComplete: '/sounds/sequence_complete.mp3',
};

const NOTIFICATION_ICON_PATH = '/icon.png'; // User should place an icon.png in /public/

export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio object once on mount
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  const playSound = useCallback((soundType: 'tick' | 'segmentEnd' | 'sequenceComplete') => {
    if (typeof window !== 'undefined' && audioRef.current) {
      const soundEnabledRaw = localStorage.getItem('zenithTimerSoundEnabled');
      const soundEnabled = soundEnabledRaw ? JSON.parse(soundEnabledRaw) : true;

      if (!soundEnabled) {
        return;
      }
      
      const soundFile = soundFiles[soundType];
      if (soundFile) {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        audioRef.current.src = basePath + soundFile;
        audioRef.current.play().catch(e => console.warn(`Audio play failed for ${soundType}:`, e, `Ensure ${soundFile} exists at ${basePath}${soundFile}. Base path: '${basePath}'`));
      } else {
        console.warn(`Sound file for ${soundType} not defined.`);
      }
    }
  }, []);

  const showSystemNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const notificationsEnabledRaw = localStorage.getItem('zenithTimerNotificationsEnabled');
      const notificationsEnabled = notificationsEnabledRaw ? JSON.parse(notificationsEnabledRaw) : false;

      if (!notificationsEnabled || Notification.permission !== 'granted') {
        return;
      }
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      new Notification(title, { body, icon: basePath + NOTIFICATION_ICON_PATH });
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
      showSystemNotification(`Starting: ${nextSegment.name}`, nextWorkItem);
      playSound('segmentEnd');
      return;
    }

    if (isResting) { 
      isResting = false;
      // Move to the next segment if current one had rest and work items are done,
      // or if no work items (pure rest segment, although our model implies work then rest)
      if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; 
         currentSegmentIndex++;
      }
      // If it was resting, it implies the work items for the current segment were completed.
      // So, we should now set up for the next segment or next work item if the segment itself is multi-work.
      // The logic below handles advancing segment/work item index.
    } else { 
      currentWorkItemIndex++;
    }
    
    // Check if work items in the current segment are completed
    if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
      if (currentSegment.rest > 0 && !isResting) { // !isResting ensures we don't enter rest if we just exited it
        isResting = true;
        updateTimerDisplay(currentSegment.rest, currentSegment.restString, currentSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
        showSystemNotification(`${currentSegment.name} Complete`, `Now: ${currentSegment.restString}`);
        playSound('segmentEnd');
        return;
      }
      // If no rest or already handled rest, reset work item index and move to next segment
      isResting = false; 
      currentWorkItemIndex = 0; 
      currentSegmentIndex++;
    }

    // Check if all segments are completed
    if (currentSegmentIndex >= configuration.segments.length) {
      if (configuration.repeat) {
        if (configuration.restBetweenSections > 0) {
          isBetweenSectionsRest = true;
          updateTimerDisplay(configuration.restBetweenSections, "Rest before repeating sequence", "Section Break", 0, 0, false, isBetweenSectionsRest);
          showSystemNotification("Sequence Complete", "Rest before repeating.");
          playSound('segmentEnd');
        } else { 
          currentSegmentIndex = 0;
          currentWorkItemIndex = 0;
          isResting = false; 
          isBetweenSectionsRest = false; 
          const nextSegment = configuration.segments[currentSegmentIndex];
          const nextWorkItem = nextSegment.work[currentWorkItemIndex];
          updateTimerDisplay(nextSegment.time, nextWorkItem, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, false, false);
          showSystemNotification(`Repeating: ${nextSegment.name}`, nextWorkItem);
          playSound('segmentEnd');
        }
      } else { 
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        showSystemNotification('Timer Finished!', `${configuration.name} sequence is complete.`);
        playSound('sequenceComplete');
      }
      return;
    }
    
    // Set up for the next work item or segment
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex]; // This should be valid now
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest); 
    if(!isResting && !isBetweenSectionsRest){ // Avoid double notification if we just came from rest
      showSystemNotification(`Starting: ${nextSegment.name}`, nextWorkItemInstruction);
    }
    playSound('segmentEnd');

  }, [configuration, timerState, updateTimerDisplay, playSound, showSystemNotification]);


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
        // Play tick sound for last 3 seconds of a work/activity segment (not rest)
        if (timerState.timeLeft <= 4 && timerState.timeLeft > 1 && !timerState.isResting && !timerState.isBetweenSectionsRest) {
          playSound('tick');
        }
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

    // Request notification permission if not already determined, and notifications are enabled in settings
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const notificationsEnabledRaw = localStorage.getItem('zenithTimerNotificationsEnabled');
      const notificationsEnabled = notificationsEnabledRaw ? JSON.parse(notificationsEnabledRaw) : false;
      if (notificationsEnabled && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          } else {
            console.log('Notification permission denied.');
          }
        });
      }
    }


    if (timerState.isComplete) { 
        const initialSegment = configuration.segments[0];
        if (initialSegment) { 
            const initialWorkItem = initialSegment.work[0] || "Starting segment";
            setTimerState({
                timeLeft: initialSegment.time,
                description: initialWorkItem,
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
            showSystemNotification(`Starting: ${initialSegment.name}`, initialWorkItem);
        } else { // Should not happen if config is valid
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else {
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        if (!timerState.isPaused) { // Only show notification if it's a fresh start, not resume
           const currentSegment = configuration.segments[timerState.currentSegmentIndex];
           const currentWorkItem = currentSegment.work[timerState.currentWorkItemIndex] || "Continuing segment";
           showSystemNotification(`Starting: ${timerState.currentSegmentName}`, currentWorkItem);
        }
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
        description: initialSegment.work[0] || "Timer reset",
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

    // Maintain paused state if skipping while paused
    if (timerState.isPaused && !timerState.isComplete) { // Ensure timer is not complete before setting paused
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true}));
    } else if (timerState.isRunning && !timerState.isComplete) { // Ensure timer is not complete before setting running
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

