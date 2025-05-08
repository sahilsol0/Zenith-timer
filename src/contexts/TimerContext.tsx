
'use client';

import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useState }
  from 'react';
import type { TimerConfiguration } from '@/lib/types';
import { useTimer, type TimerState } from '@/hooks/useTimer';

interface TimerContextType {
  activeConfig: TimerConfiguration | null;
  setActiveConfig: (config: TimerConfiguration | null) => void;
  timerState: TimerState;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipToNext: () => void;
  isTimerActive: boolean; // True if a config is set (running, paused, or ready to start)
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: PropsWithChildren) => {
  const [activeConfig, setActiveConfigState] = useState<TimerConfiguration | null>(null);
  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer, skipToNext } = useTimer(activeConfig);

  const setActiveConfig = useCallback((config: TimerConfiguration | null) => {
    setActiveConfigState(config);
    // The useTimer hook will re-initialize itself when activeConfig changes.
  }, []);

  const isTimerActive = activeConfig !== null;

  return (
    <TimerContext.Provider
      value={{
        activeConfig,
        setActiveConfig,
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipToNext,
        isTimerActive,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useGlobalTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a TimerProvider');
  }
  return context;
};
