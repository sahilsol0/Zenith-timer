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
    if (soundType === 'tick' && !audioUnlockedRef.current) return;

    const relativePath = soundFiles[soundType];
    const soundURL = new URL(relativePath, window.location.origin).href;

    audioRef.current.src = soundURL;
    audioRef.current.load();
    audioRef.current.play()
      .then(() => {
        if (soundType !== 'tick') audioUnlockedRef.current = true;
      })
      .catch((e) => {
        if (e.name !== 'NotAllowedError') {
          console.warn(`Audio play failed for ${soundType}:`, e, `Ensure sound file exists at ${soundURL}`);
        }
      });
  }, []);

  const notify = (message: string) => {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

    new Notification('Zenith Timer', {
      body: message,
      icon: NOTIFICATION_ICON_PATH,
    });
  };

  const moveToNextState = useCallback((config: TimerConfiguration, currentState: TimerState): TimerState => {
    const { segments } = config;
    let {
      currentSegmentIndex,
      currentWorkItemIndex,
      isResting,
      isBetweenSectionsRest,
    } = currentState;

    const currentSegment = segments[currentSegmentIndex];

    if (!isResting) {
      if (currentWorkItemIndex < currentSegment.workItems - 1) {
        return {
          ...currentState,
          timeLeft: currentSegment.workDuration,
          description: 'Work',
          currentWorkItemIndex: currentWorkItemIndex + 1,
          isResting: true,
        };
      } else if (currentSegmentIndex < segments.length - 1) {
        return {
          ...currentState,
          timeLeft: currentSegment.restDurationBetweenSegments,
          description: 'Rest Between Segments',
          isResting: false,
          isBetweenSectionsRest: true,
        };
      } else {
        return {
          ...currentState,
          isRunning: false,
          isComplete: true,
          description: 'Complete',
          timeLeft: 0,
        };
      }
    } else {
      return {
        ...currentState,
        timeLeft: currentSegment.restDuration,
        description: 'Rest',
        isResting: false,
      };
    }
  }, []);

  useEffect(() => {
    if (!configuration || !timerState.isRunning || timerState.isPaused || timerState.isComplete) return;

    if (timerState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimerState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
        playSound('tick');
      }, 1000);
    } else {
      const updatedState = moveToNextState(configuration, timerState);

      if (updatedState.isComplete) {
        playSound('sequenceComplete');
        notify('Timer complete!');
      } else if (updatedState.isBetweenSectionsRest) {
        playSound('segmentEnd');
        notify('Segment complete!');
      } else if (updatedState.description === 'Work') {
        playSound('segmentEnd');
        notify('Work started!');
      }

      setTimerState(updatedState);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerState, configuration, moveToNextState, playSound]);

  const startTimer = () => {
    if (!configuration) return;
    const firstSegment = configuration.segments[0];

    setTimerState({
      ...initialTimerState,
      isRunning: true,
      isPaused: false,
      isComplete: false,
      timeLeft: firstSegment.workDuration,
      description: 'Work',
      currentSegmentName: firstSegment.name,
      currentSegmentIndex: 0,
      currentWorkItemIndex: 0,
      totalSegments: configuration.segments.length,
      totalWorkItemsInSegment: firstSegment.workItems,
    });

    Notification.requestPermission().catch(() => {});
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  };

  const resumeTimer = () => {
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimerState(initialTimerState);
  };

  const skipToNext = () => {
    if (!configuration) return;

    const updatedState = moveToNextState(configuration, timerState);
    setTimerState(updatedState);
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
    
