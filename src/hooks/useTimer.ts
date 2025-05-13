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

// Define sound file names relative to the 'public' folder structure
const rawSoundFiles = {
  tick: 'sounds/tick.mp3',
  segmentEnd: 'sounds/segment_end.mp3',
  sequenceComplete: 'sounds/sequence_complete.mp3',
};

// Define notification icon path relative to the 'public' folder
const RAW_NOTIFICATION_ICON_PATH = 'icon.png';


export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  const [resolvedBasePath, setResolvedBasePath] = useState<string>('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setResolvedBasePath(process.env.NEXT_PUBLIC_BASE_PATH || '');
    
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    if (!configuration) {
      setTimerState(initialTimerState);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      audioUnlockedRef.current = false;
      return;
    }
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
      setTimerState(initialTimerState);
    }
    audioUnlockedRef.current = false;
  }, [configuration]);


  const playSound = useCallback((soundType: keyof typeof rawSoundFiles) => {
    if (typeof window === 'undefined' || !audioRef.current) return;

    let soundEnabled = true;
    try {
      const stored = localStorage.getItem('zenithTimerSoundEnabled');
      soundEnabled = stored ? JSON.parse(stored) : true;
    } catch {
      soundEnabled = true;
    }

    if (!soundEnabled) return;
    if (soundType === 'tick' && !audioUnlockedRef.current) return;

    const soundFilePath = rawSoundFiles[soundType];
    // Construct the full URL by prepending the resolvedBasePath
    const soundURL = `${resolvedBasePath}/${soundFilePath}`.replace(/\/+/g, '/');
    
    audioRef.current.src = soundURL;
    audioRef.current.load(); 
    audioRef.current.play()
      .then(() => {
        if (soundType !== 'tick') audioUnlockedRef.current = true;
      })
      .catch((e) => {
        if (e.name === 'NotAllowedError') {
           // console.debug(`Audio play for ${soundType} blocked by browser. User gesture might be needed.`);
        } else {
          console.warn(`Audio play failed for ${soundType}:`, e, `Ensure ${soundURL} exists.`);
        }
      });
  }, [resolvedBasePath]);

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
    
    const iconURL = `${resolvedBasePath}/${RAW_NOTIFICATION_ICON_PATH}`.replace(/\/+/g, '/');

    try {
        new Notification('Zenith Timer', {
        body: message,
        icon: iconURL,
        });
    } catch (e) {
        console.warn("Failed to show notification:", e, `Ensure icon exists at ${iconURL}`);
    }
  }, [resolvedBasePath]);


  const moveToNextState = useCallback((config: TimerConfiguration, currentState: TimerState): TimerState => {
    const { segments, restBetweenSections, repeat } = config;
    let {
      currentSegmentIndex,
      currentWorkItemIndex,
      isResting,
      isBetweenSectionsRest,
    } = currentState;

    const currentSegment = segments[currentSegmentIndex];

    if (!currentSegment) { 
        return { ...initialTimerState, isComplete: true, description: "Configuration error." };
    }
    
    if (!isResting && !isBetweenSectionsRest) {
        if (currentWorkItemIndex < currentSegment.work.length - 1) {
            return {
                ...currentState,
                timeLeft: currentSegment.time,
                description: currentSegment.work[currentWorkItemIndex + 1],
                currentWorkItemIndex: currentWorkItemIndex + 1,
                isResting: false, 
                currentSegmentName: currentSegment.name,
            };
        } else {
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
            currentSegmentIndex++;
            currentWorkItemIndex = 0;
            if (currentSegmentIndex < segments.length) {
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
            } else { 
                if (repeat) {
                    if (restBetweenSections > 0) {
                        return {
                            ...currentState,
                            timeLeft: restBetweenSections,
                            description: "Section Break",
                            currentSegmentIndex: 0, 
                            currentWorkItemIndex: 0,
                            isResting: false,
                            isBetweenSectionsRest: true,
                            currentSegmentName: "Section Break", 
                        };
                    } else { 
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
                } else { 
                    return { ...currentState, isRunning: false, isComplete: true, description: "Complete!", timeLeft: 0 };
                }
            }
        }
    } 
    else if (isResting) {
        currentSegmentIndex++;
        currentWorkItemIndex = 0;
        if (currentSegmentIndex < segments.length) {
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
        } else { 
            if (repeat) {
                if (restBetweenSections > 0) {
                    return {
                        ...currentState,
                        timeLeft: restBetweenSections,
                        description: "Section Break",
                        currentSegmentIndex: 0, 
                        currentWorkItemIndex: 0,
                        isResting: false,
                        isBetweenSectionsRest: true,
                        currentSegmentName: "Section Break",
                    };
                } else { 
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
            } else { 
                return { ...currentState, isRunning: false, isComplete: true, description: "Complete!", timeLeft: 0 };
            }
        }
    }
    else if (isBetweenSectionsRest) {
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
        if (timerState.timeLeft <= 4 && timerState.timeLeft > 1 && !timerState.isResting && !timerState.isBetweenSectionsRest) { 
           playSound('tick');
        }
      }, 1000);
    } else { 
      if (timerRef.current) clearTimeout(timerRef.current); 

      const updatedState = moveToNextState(configuration, timerState);
      setTimerState(updatedState); 

      if (updatedState.isComplete) {
        playSound('sequenceComplete');
        notify(`${configuration.name} complete!`);
      } else if (updatedState.isResting || updatedState.isBetweenSectionsRest) {
        playSound('segmentEnd');
        notify(`Rest: ${updatedState.description}`);
      } else { 
        playSound('segmentEnd'); 
        notify(`${updatedState.currentSegmentName}: ${updatedState.description}`);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerState, configuration, moveToNextState, playSound, notify]);

  const startTimer = useCallback(() => {
    if (!configuration) return;
    
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; 

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
    playSound('segmentEnd'); 
    notify(`${firstSegment.name}: ${firstSegment.work[0] || "Starting task..."}`);

  }, [configuration, playSound, notify]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimerState((prev) => ({ ...prev, isPaused: true, isRunning: true })); 
  };

  const resumeTimer = () => {
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; 

    setTimerState((prev) => ({ ...prev, isPaused: false, isRunning: true }));
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (configuration) {
        const firstSegment = configuration.segments[0];
         setTimerState({
            ...initialTimerState, 
            timeLeft: firstSegment ? firstSegment.time : 0,
            description: firstSegment ? (firstSegment.work[0] || 'Ready') : 'No segments',
            currentSegmentName: firstSegment ? firstSegment.name : '',
            currentSegmentIndex: 0,
            currentWorkItemIndex: 0,
            totalSegments: configuration.segments.length,
            totalWorkItemsInSegment: firstSegment ? firstSegment.work.length : 0,
            isRunning: false, 
            isPaused: false,
            isComplete: false,
        });
    } else {
        setTimerState(initialTimerState); 
    }
    audioUnlockedRef.current = false; 
  };

  const skipToNext = useCallback(() => {
    if (!configuration || timerState.isComplete) return;
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    }
    audioUnlockedRef.current = true; 

    if (timerRef.current) clearTimeout(timerRef.current);
    
    const updatedState = moveToNextState(configuration, { 
      ...timerState, 
      timeLeft: 0 
    });
    setTimerState(updatedState);

    if (updatedState.isComplete) {
      playSound('sequenceComplete');
      notify(`${configuration.name} complete!`);
    } else if (updatedState.isResting || updatedState.isBetweenSectionsRest) {
      playSound('segmentEnd');
      notify(`Skipped to Rest: ${updatedState.description}`);
    } else { 
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
    
