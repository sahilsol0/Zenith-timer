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

const NOTIFICATION_ICON_PATH = '/icon.png';
// IMPORTANT: Ensure NEXT_PUBLIC_BASE_PATH is correctly set in your environment,
// especially for deployments to subpaths (like GitHub Pages).
// It's configured in next.config.ts
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    audioUnlockedRef.current = false;
  }, [configuration]);

  const playSound = useCallback((soundType: 'tick' | 'segmentEnd' | 'sequenceComplete') => {
    if (typeof window !== 'undefined' && audioRef.current) {
      let soundEnabled = true; 
      try {
        const soundEnabledRaw = localStorage.getItem('zenithTimerSoundEnabled');
        if (soundEnabledRaw !== null) {
          soundEnabled = JSON.parse(soundEnabledRaw);
        }
      } catch (error) {
        console.warn('Failed to parse sound settings from localStorage, defaulting to true:', error);
        soundEnabled = true; 
      }

      if (!soundEnabled) {
        return;
      }

      if (soundType === 'tick' && !audioUnlockedRef.current) {
        return;
      }

      const soundFile = soundFiles[soundType];
      if (soundFile) {
        // Construct absolute URL for the sound file
        const fullSoundPath = new URL(publicBasePath + soundFile, window.location.origin).href;
        // console.log(`Attempting to play audio from: ${fullSoundPath}`); // For debugging path issues

        audioRef.current.src = fullSoundPath;
        audioRef.current.load(); 
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (soundType !== 'tick' && !audioUnlockedRef.current) {
                audioUnlockedRef.current = true;
              }
            })
            .catch(e => {
              if (e.name === 'NotAllowedError') {
                if (soundType !== 'tick' && !audioUnlockedRef.current) {
                   console.warn(`Audio play for ${soundType} blocked by browser. User gesture might be needed. Audio remains locked. Error: ${e.message}`);
                }
              } else {
                console.warn(`Audio play failed for ${soundType}:`, e, `Ensure ${soundFile} exists at ${publicBasePath}${soundFile}. Attempted full path: ${fullSoundPath}`);
              }
            });
        }
      } else {
        console.warn(`Sound file for ${soundType} not defined.`);
      }
    }
  }, []); 

  const showSystemNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      let notificationsEnabled = false; 
      try {
        const notificationsEnabledRaw = localStorage.getItem('zenithTimerNotificationsEnabled');
        if (notificationsEnabledRaw !== null) {
             notificationsEnabled = JSON.parse(notificationsEnabledRaw);
        }
      } catch (error) {
        console.warn('Failed to parse notification settings from localStorage, defaulting to false:', error);
        notificationsEnabled = false;
      }

      if (!notificationsEnabled || Notification.permission !== 'granted') {
        return;
      }
      try {
        const iconPath = new URL(publicBasePath + NOTIFICATION_ICON_PATH, window.location.origin).href;
        new Notification(title, { body, icon: iconPath });
      } catch(e) {
        console.warn("Failed to show notification:", e);
      }
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
        showSystemNotification(`${currentSegment.name} Complete`, `Now: ${currentSegment.restString}`);
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

    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
    
    if(!isResting && !isBetweenSectionsRest){ 
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
    
    if (!audioUnlockedRef.current) {
        playSound('segmentEnd'); 
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      let notificationsEnabled = false;
      try {
        const notificationsEnabledRaw = localStorage.getItem('zenithTimerNotificationsEnabled');
        if (notificationsEnabledRaw !== null) {
            notificationsEnabled = JSON.parse(notificationsEnabledRaw);
        }
      } catch (error) {
        console.warn('Failed to access localStorage for notification settings:', error);
      }
      if (notificationsEnabled && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            // console.log('Notification permission granted.');
          } else {
            // console.log('Notification permission denied.');
          }
        }).catch(error => {
          console.warn('Failed to request notification permission:', error);
        });
      }
    }


    if (timerState.isComplete) { 
        const initialSegment = configuration.segments[0];
        if (initialSegment && initialSegment.work.length > 0) {
            const initialWorkItem = initialSegment.work[0];
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
        } else {
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else { 
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        if (!timerState.isPaused && configuration.segments[timerState.currentSegmentIndex]) { 
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
    
    if (!audioUnlockedRef.current) {
        playSound('segmentEnd');
    }
    
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    audioUnlockedRef.current = false; 
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
            setTimerState({...initialTimerState, description: "Timer reset to invalid initial state."});
       }
    } else {
      setTimerState(initialTimerState);
    }
  };

  const skipToNext = () => {
    if ((!timerState.isRunning && !timerState.isPaused) && (!configuration || timerState.isComplete) ) {
      return; 
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    
    moveToNextState(); 

    setTimerState(prev => {
      if (prev.isComplete) { 
        return { ...prev, isRunning: false, isPaused: false };
      }
      return prev; 
    });
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

