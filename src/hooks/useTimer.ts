
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

const NOTIFICATION_ICON_PATH = '/icon.png';
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Define soundFiles to include publicBasePath directly
const soundFiles = {
  tick: `${publicBasePath}/sounds/tick.mp3`.replace(/\/\//g, '/'), // Avoid double slashes if publicBasePath is '/' or empty
  segmentEnd: `${publicBasePath}/sounds/segment_end.mp3`.replace(/\/\//g, '/'),
  sequenceComplete: `${publicBasePath}/sounds/sequence_complete.mp3`.replace(/\/\//g, '/'),
};


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
    // Reset audio unlock state when configuration changes,
    // as a new timer session starts.
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

      // Do not play tick sound if audio is not yet unlocked by a user gesture (non-tick sound)
      if (soundType === 'tick' && !audioUnlockedRef.current) {
        return;
      }
      
      const soundPath = soundFiles[soundType]; // This path now includes publicBasePath

      if (soundPath) {
        // Construct absolute URL for the sound file
        // soundPath is now already correctly prefixed with publicBasePath (if any)
        const fullSoundPath = new URL(soundPath, window.location.origin).href;
        
        // console.log(`Attempting to play audio from: ${fullSoundPath}`); // For debugging path issues

        audioRef.current.src = fullSoundPath;
        audioRef.current.load(); // Ensure the new source is loaded
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // If a non-tick sound plays successfully, consider audio unlocked.
              if (soundType !== 'tick' && !audioUnlockedRef.current) {
                audioUnlockedRef.current = true;
                // console.log(`Audio unlocked by playing: ${soundType}`);
              }
            })
            .catch(e => {
              if (e.name === 'NotAllowedError') {
                if (soundType !== 'tick' && !audioUnlockedRef.current) {
                   console.warn(`Audio play for ${soundType} blocked by browser. User gesture might be needed. Audio remains locked. Path: ${fullSoundPath}. Error: ${e.message}`);
                }
              } else {
                console.warn(`Audio play failed for ${soundType}:`, e, `Ensure sound file exists at ${soundPath}. Attempted full path: ${fullSoundPath}`);
              }
            });
        }
      } else {
        console.warn(`Sound file for ${soundType} not defined.`);
      }
    }
  }, []); // Empty dependency array as soundFiles and publicBasePath are from module scope

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
      // After segment's own rest, if we were at the end of work items, move to next segment.
      if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; 
         currentSegmentIndex++;
      }
      // If not at end of work items (e.g. rest was for an intermediate work item, though current model is rest after all work items in segment),
      // then we'd resume with currentWorkItemIndex, which should be handled by the next block.
    } else { 
      // If not resting, advance work item.
      currentWorkItemIndex++;
    }

    // Check if we've completed all work items in the current segment
    if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
      // If current segment has a rest period and we haven't just finished it (isResting was false before this check)
      if (currentSegment.rest > 0 && !isResting) { 
        isResting = true; // Enter segment's rest period
        updateTimerDisplay(currentSegment.rest, currentSegment.restString, currentSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
        showSystemNotification(`${currentSegment.name} Complete`, `Now: ${currentSegment.restString}`);
        playSound('segmentEnd');
        return; // Timer will continue for this rest period
      }
      // If no rest for this segment OR we just finished this segment's rest (isResting would have been true),
      // then move to the next segment.
      isResting = false; // Ensure isResting is false as we are moving to a new segment or completing.
      currentWorkItemIndex = 0; // Reset for the new segment
      currentSegmentIndex++;
    }

    // Check if all segments are completed
    if (currentSegmentIndex >= configuration.segments.length) {
      if (configuration.repeat) {
        if (configuration.restBetweenSections > 0) {
          isBetweenSectionsRest = true; // Enter rest between full sequence repeats
          updateTimerDisplay(configuration.restBetweenSections, "Rest before repeating sequence", "Section Break", 0, 0, false, isBetweenSectionsRest);
          showSystemNotification("Sequence Complete", "Rest before repeating.");
          playSound('segmentEnd');
        } else { 
          // No rest between sections, repeat immediately
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
        // Not repeating, sequence is complete
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        showSystemNotification('Timer Finished!', `${configuration.name} sequence is complete.`);
        playSound('sequenceComplete');
      }
      return; // End of sequence logic
    }

    // If not all segments are completed, set up the next work item/segment
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
    
    if(!isResting && !isBetweenSectionsRest){ 
      // Only notify for new work/segment start, not for transitions into rest
      showSystemNotification(`Starting: ${nextSegment.name}`, nextWorkItemInstruction);
    }
    playSound('segmentEnd'); // Sound for any transition (segment end, work item end leading to rest, etc.)

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
    
    // Attempt to unlock audio context with a non-tick sound if not already unlocked
    // This is important because playSound('tick') will not play if audio is locked.
    if (!audioUnlockedRef.current) {
        playSound('segmentEnd'); // Play a short, non-intrusive sound to unlock
    }

    // Request notification permission if not already granted or denied
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
          // console.log('Notification permission status:', permission);
        }).catch(error => {
          console.warn('Failed to request notification permission:', error);
        });
      }
    }


    if (timerState.isComplete) { 
        // If restarting a completed timer
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
             // Should not happen if config is valid
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else { 
        // Starting from paused or initial state
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        // If it was paused, don't resend notification. Only if truly starting fresh (first time or after reset)
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
    
    // Attempt to unlock audio if it wasn't already
    if (!audioUnlockedRef.current) {
        playSound('segmentEnd');
    }
    
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    audioUnlockedRef.current = false; // Reset audio lock on timer reset
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
                isRunning: false, // Timer should not start automatically on reset
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
    // Allow skip if timer has a config and is not already complete,
    // or if it's running/paused.
    if (!configuration || (!timerState.isRunning && !timerState.isPaused && timerState.isComplete)) {
      return; 
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    
    moveToNextState(); 

    // After moveToNextState, if it resulted in completion, update running/paused flags.
    setTimerState(prev => {
      if (prev.isComplete) { 
        return { ...prev, isRunning: false, isPaused: false };
      }
      // If not complete, and timer was paused, it should remain paused but advanced.
      // If it was running, it should continue running with the new state.
      // moveToNextState updates timeLeft, description etc. which triggers useEffect for timerRef.
      // If it was paused, isPaused flag is still true, so useEffect won't start interval.
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

