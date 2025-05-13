'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerConfiguration, TimerSegment } from '@/lib/types';

export type TimerState = {
  timeLeft: number;
  description: string;
  currentSegmentName: string;
  currentWorkItemIndex: number;
  currentSegmentIndex: number;
  isResting: boolean;
  isBetweenSectionsRest: boolean;
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

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const soundFiles = {
  tick: `${publicBasePath}/sounds/tick.mp3`.replace(/\/+/g, '/'),
  segmentEnd: `${publicBasePath}/sounds/segment_end.mp3`.replace(/\/+/g, '/'),
  sequenceComplete: `${publicBasePath}/sounds/sequence_complete.mp3`.replace(/\/+/g, '/'),
};

const NOTIFICATION_ICON_PATH = `${publicBasePath}/icon.png`.replace(/\/+/g, '/');

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
    if (!configuration) {
      // Reset to initial state if configuration is removed or becomes null
      setTimerState(initialTimerState);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }
    // When configuration changes, reset the timer to its initial state for the new config
    const firstSegment = configuration.segments[0];
    if (firstSegment) {
      setTimerState({
        ...initialTimerState,
        timeLeft: firstSegment.time,
        description: firstSegment.work[0] || 'Starting...',
        currentSegmentName: firstSegment.name,
        currentSegmentIndex: 0,
        currentWorkItemIndex: 0,
        totalSegments: configuration.segments.length,
        totalWorkItemsInSegment: firstSegment.work.length,
      });
    } else {
      setTimerState(initialTimerState); // Fallback if no segments
    }
    audioUnlockedRef.current = false;
  }, [configuration]);


  const playSound = useCallback((soundType: keyof typeof soundFiles) => {
    if (typeof window === 'undefined' || !audioRef.current) return;

    let soundEnabled = true;
    try {
      const stored = localStorage.getItem('zenithTimerSoundEnabled');
      soundEnabled = stored ? JSON.parse(stored) : true;
    } catch {
      soundEnabled = true;
    }

    if (!soundEnabled) return;

    // Audio unlock is crucial, especially for 'tick'
    if (!audioUnlockedRef.current && soundType === 'tick') return;


    const relativePath = soundFiles[soundType];
    // Ensure the path is correctly formed, especially if publicBasePath is empty
    const soundURL = (publicBasePath ? `${publicBasePath.replace(/\/$/, '')}${relativePath}` : relativePath).replace(/\/+/g, '/');
    
    audioRef.current.src = soundURL;
    audioRef.current.load(); // Important for changing sources
    audioRef.current.play()
      .then(() => {
        // Unlock audio for all sounds once any non-tick sound plays successfully after a gesture.
        // Or if a tick plays and it was already unlocked (or implicitly becomes unlocked by the gesture that started the timer).
        if (soundType !== 'tick') audioUnlockedRef.current = true;
      })
      .catch((e) => {
        // Don't log NotAllowedError too verbosely, as it's common before user gesture
        if (e.name === 'NotAllowedError') {
           // console.debug(`Audio play for ${soundType} blocked by browser. User gesture might be needed.`);
        } else {
          console.warn(`Audio play failed for ${soundType}:`, e, `Ensure ${soundURL} exists. Base path: '${publicBasePath}'`);
        }
      });
  }, [publicBasePath]);

  const notify = useCallback((message: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    let notificationsEnabled = false;
    try {
        const stored = localStorage.getItem('zenithTimerNotificationsEnabled');
        notificationsEnabled = stored ? JSON.parse(stored) : false;
    } catch {
        notificationsEnabled = false;
    }

    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    
    const iconPath = (publicBasePath ? `${publicBasePath.replace(/\/$/, '')}${NOTIFICATION_ICON_PATH}` : NOTIFICATION_ICON_PATH).replace(/\/+/g, '/');

    try {
        new Notification('Zenith Timer', {
        body: message,
        icon: iconPath,
        });
    } catch (e) {
        console.warn("Failed to show notification:", e, `Ensure icon exists at ${iconPath}`);
    }
  }, [publicBasePath]);


  const moveToNextState = useCallback((config: TimerConfiguration, currentState: TimerState): TimerState => {
    const { segments, restBetweenSections, repeat } = config;
    let {
      currentSegmentIndex,
      currentWorkItemIndex,
      isResting,
      isBetweenSectionsRest,
    } = currentState;

    const currentSegment = segments[currentSegmentIndex];

    if (!currentSegment) { // Should ideally not happen if config is valid
        return { ...initialTimerState, isComplete: true, description: "Configuration error." };
    }
    
    // Currently in a work item
    if (!isResting && !isBetweenSectionsRest) {
        if (currentWorkItemIndex < currentSegment.work.length - 1) {
            // More work items in the current segment
            return {
                ...currentState,
                timeLeft: currentSegment.time,
                description: currentSegment.work[currentWorkItemIndex + 1],
                currentWorkItemIndex: currentWorkItemIndex + 1,
                isResting: false, 
                currentSegmentName: currentSegment.name,
            };
        } else {
            // Last work item of the current segment, now check for segment rest
            if (currentSegment.rest > 0) {
                return {
                    ...currentState,
                    timeLeft: currentSegment.rest,
                    description: currentSegment.restString || "Rest",
                    isResting: true,
                    isBetweenSectionsRest: false, 
                    currentSegmentName: currentSegment.name, 
                };
            }
            // No rest in this segment, move to next segment or repeat/complete
            currentSegmentIndex++;
            currentWorkItemIndex = 0;
            if (currentSegmentIndex < segments.length) {
                // Start next segment
                return {
                    ...currentState,
                    timeLeft: segments[currentSegmentIndex].time,
                    description: segments[currentSegmentIndex].work[0],
                    currentSegmentIndex: currentSegmentIndex,
                    currentWorkItemIndex: 0,
                    isResting: false,
                    isBetweenSectionsRest: false,
                    currentSegmentName: segments[currentSegmentIndex].name,
                    totalWorkItemsInSegment: segments[currentSegmentIndex].work.length,
                };
            } else { // End of all segments
                if (repeat) {
                    if (restBetweenSections > 0) {
                        return {
                            ...currentState,
                            timeLeft: restBetweenSections,
                            description: "Section Break",
                            currentSegmentIndex: 0, // Will start segment 0 after this break
                            currentWorkItemIndex: 0,
                            isResting: false,
                            isBetweenSectionsRest: true,
                            currentSegmentName: "Section Break", // Temp name for break
                        };
                    } else { // Repeat immediately
                        return {
                            ...currentState,
                            timeLeft: segments[0].time,
                            description: segments[0].work[0],
                            currentSegmentIndex: 0,
                            currentWorkItemIndex: 0,
                            isResting: false,
                            isBetweenSectionsRest: false,
                            currentSegmentName: segments[0].name,
                            totalWorkItemsInSegment: segments[0].work.length,
                        };
                    }
                } else { // Not repeating, sequence complete
                    return { ...currentState, isRunning: false, isComplete: true, description: "Complete!", timeLeft: 0 };
                }
            }
        }
    } 
    // Currently in segment rest
    else if (isResting) {
        currentSegmentIndex++;
        currentWorkItemIndex = 0;
        if (currentSegmentIndex < segments.length) {
            // Start next segment
            return {
                ...currentState,
                timeLeft: segments[currentSegmentIndex].time,
                description: segments[currentSegmentIndex].work[0],
                currentSegmentIndex: currentSegmentIndex,
                currentWorkItemIndex: 0,
                isResting: false,
                isBetweenSectionsRest: false,
                currentSegmentName: segments[currentSegmentIndex].name,
                totalWorkItemsInSegment: segments[currentSegmentIndex].work.length,
            };
        } else { // End of all segments after a rest
            if (repeat) {
                if (restBetweenSections > 0) {
                    return {
                        ...currentState,
                        timeLeft: restBetweenSections,
                        description: "Section Break",
                        currentSegmentIndex: 0, // Will start segment 0 after this break
                        currentWorkItemIndex: 0,
                        isResting: false,
                        isBetweenSectionsRest: true,
                        currentSegmentName: "Section Break",
                    };
                } else { // Repeat immediately
                    return {
                        ...currentState,
                        timeLeft: segments[0].time,
                        description: segments[0].work[0],
                        currentSegmentIndex: 0,
                        currentWorkItemIndex: 0,
                        isResting: false,
                        isBetweenSectionsRest: false,
                        currentSegmentName: segments[0].name,
                        totalWorkItemsInSegment: segments[0].work.length,
                    };
                }
            } else { // Not repeating, sequence complete
                return { ...currentState, isRunning: false, isComplete: true, description: "Complete!", timeLeft: 0 };
            }
        }
    }
    // Currently in rest between sections (after a full repeat cycle)
    else if (isBetweenSectionsRest) {
        // Start the first segment of the new cycle
        return {
            ...currentState,
            timeLeft: segments[0].time,
            description: segments[0].work[0],
            currentSegmentIndex: 0,
            currentWorkItemIndex: 0,
            isResting: false,
            isBetweenSectionsRest: false,
            currentSegmentName: segments[0].name,
            totalWorkItemsInSegment: segments[0].work.length,
        };
    }
    
    // Fallback, should not be reached if logic is correct
    console.error("Timer in unhandled state:", currentState);
    return { ...currentState, isRunning: false, isComplete: true, description: "Error" };

  }, []);


  useEffect(() => {
    if (!configuration || !timerState.isRunning || timerState.isPaused || timerState.isComplete) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (timerState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
        if (timerState.timeLeft <= 4 && timerState.timeLeft > 1 && !timerState.isResting && !timerState.isBetweenSectionsRest) { // Play tick for last 3 seconds of work
           playSound('tick');
        }
      }, 1000);
    } else { // Time has reached 0 for the current phase
      if (timerRef.current) clearTimeout(timerRef.current); // Clear any existing timeout

      const updatedState = moveToNextState(configuration, timerState);
      setTimerState(updatedState); // Apply the new state immediately

      // Notifications and sounds based on the NEW state
      if (updatedState.isComplete) {
        playSound('sequenceComplete');
        notify(`${configuration.name} complete!`);
      } else if (updatedState.isResting || updatedState.isBetweenSectionsRest) {
        playSound('segmentEnd');
        notify(`Rest: ${updatedState.description}`);
      } else { // It's a new work item/segment
        playSound('segmentEnd'); // Sound to indicate start of new work/segment
        notify(`${updatedState.currentSegmentName}: ${updatedState.description}`);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerState, configuration, moveToNextState, playSound, notify]);

  const startTimer = useCallback(() => {
    if (!configuration) return;
    
    // Ensure audio context is available for iOS, etc.
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; // User gesture happened

    const firstSegment = configuration.segments[0];
    if (!firstSegment) {
      console.error("Timer started with no segments in configuration.");
      setTimerState({...initialTimerState, isComplete: true, description: "No segments."});
      return;
    }

    setTimerState({
      ...initialTimerState,
      isRunning: true,
      isPaused: false,
      isComplete: false,
      timeLeft: firstSegment.time,
      description: firstSegment.work[0] || "Starting task...",
      currentSegmentName: firstSegment.name,
      currentSegmentIndex: 0,
      currentWorkItemIndex: 0,
      totalSegments: configuration.segments.length,
      totalWorkItemsInSegment: firstSegment.work.length,
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((err) => {
            console.warn("Notification permission request failed:", err);
        });
    }
    // Initial sound for starting the very first segment/work item
    playSound('segmentEnd'); 
    notify(`${firstSegment.name}: ${firstSegment.work[0] || "Starting task..."}`);

  }, [configuration, playSound, notify]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimerState((prev) => ({ ...prev, isPaused: true, isRunning: true })); // isRunning should remain true
  };

  const resumeTimer = () => {
     // Ensure audio context is available for iOS, etc.
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; // User gesture happened

    setTimerState((prev) => ({ ...prev, isPaused: false, isRunning: true }));
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Reset to the beginning of the current configuration, not to a blank state.
    if (configuration) {
        const firstSegment = configuration.segments[0];
         setTimerState({
            ...initialTimerState, // Resets isRunning, isPaused, isComplete etc.
            timeLeft: firstSegment ? firstSegment.time : 0,
            description: firstSegment ? (firstSegment.work[0] || 'Ready') : 'No segments',
            currentSegmentName: firstSegment ? firstSegment.name : '',
            currentSegmentIndex: 0,
            currentWorkItemIndex: 0,
            totalSegments: configuration.segments.length,
            totalWorkItemsInSegment: firstSegment ? firstSegment.work.length : 0,
            isRunning: false, // Timer is reset, not running.
            isPaused: false,
            isComplete: false,
        });
    } else {
        setTimerState(initialTimerState); // Full reset if no config
    }
    audioUnlockedRef.current = false; // Require gesture again after reset
  };

  const skipToNext = useCallback(() => {
    if (!configuration || timerState.isComplete) return;
     // Ensure audio context is available for iOS, etc.
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; // User gesture happened

    if (timerRef.current) clearTimeout(timerRef.current);
    
    const updatedState = moveToNextState(configuration, { 
      ...timerState, 
      // Ensure timeLeft is treated as 0 to force transition,
      // but retain other aspects of current state for context.
      timeLeft: 0 
    });
    setTimerState(updatedState);

    // Notifications and sounds based on the NEW state after skip
    if (updatedState.isComplete) {
      playSound('sequenceComplete');
      notify(`${configuration.name} complete!`);
    } else if (updatedState.isResting || updatedState.isBetweenSectionsRest) {
      playSound('segmentEnd');
      notify(`Skipped to Rest: ${updatedState.description}`);
    } else { // It's a new work item/segment
      playSound('segmentEnd');
      notify(`Skipped to ${updatedState.currentSegmentName}: ${updatedState.description}`);
    }

  }, [configuration, timerState, moveToNextState, playSound, notify]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipToNext,
  };
};
    
