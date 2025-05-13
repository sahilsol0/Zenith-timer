
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
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const useTimer = (configuration: TimerConfiguration | null) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false); // Ref to track if audio has been unlocked

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    // Reset audio unlocked status when configuration changes
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

      // For tick sounds, only play if audio has been unlocked by a user gesture (non-tick sound play)
      if (soundType === 'tick' && !audioUnlockedRef.current) {
        return;
      }

      const soundFile = soundFiles[soundType];
      if (soundFile) {
        audioRef.current.src = basePath + soundFile;
        audioRef.current.load(); 
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // If a non-tick sound plays successfully, mark audio as unlocked
              if (soundType !== 'tick' && !audioUnlockedRef.current) {
                audioUnlockedRef.current = true;
              }
            })
            .catch(e => {
              if (e.name === 'NotAllowedError') {
                // Log block for non-tick sounds if audio isn't unlocked yet.
                // For tick sounds, this is expected if not unlocked, so no warning needed.
                if (soundType !== 'tick' && !audioUnlockedRef.current) {
                   console.warn(`Audio play for ${soundType} blocked by browser. User gesture might be needed. Audio remains locked. Error: ${e.message}`);
                }
              } else {
                // Log other errors
                console.warn(`Audio play failed for ${soundType}:`, e, `Ensure ${soundFile} exists at ${basePath}${soundFile}. Base path: '${basePath}'`);
              }
            });
        }
      } else {
        console.warn(`Sound file for ${soundType} not defined.`);
      }
    }
  }, [basePath]); 

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
        new Notification(title, { body, icon: basePath + NOTIFICATION_ICON_PATH });
      } catch(e) {
        console.warn("Failed to show notification:", e);
      }
    }
  }, [basePath]);


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
  }, [configuration]); // Corrected: Depends only on configuration for derived values


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
      // currentWorkItemIndex remains, segmentIndex might increment if currentWorkItemIndex was already at end
      if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
         currentWorkItemIndex = 0; // Reset for the new segment
         currentSegmentIndex++;
      }
      // If currentWorkItemIndex was not at end, it means rest was for an item within the segment,
      // but current logic has segment rest only at the end of all work items.
      // This path implies segment rest is over, proceed to next segment or work item.

    } else { // Was in work phase, advance work item
      currentWorkItemIndex++;
    }

    // Check if current segment's work items are done
    if (currentSegment && currentWorkItemIndex >= currentSegment.work.length) {
      if (currentSegment.rest > 0 && !isResting) { // !isResting ensures we don't double-enter rest
        isResting = true;
        updateTimerDisplay(currentSegment.rest, currentSegment.restString, currentSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
        showSystemNotification(`${currentSegment.name} Complete`, `Now: ${currentSegment.restString}`);
        playSound('segmentEnd');
        return;
      }
      // If no rest, or rest just finished, move to next segment
      isResting = false; // Ensure rest is false
      currentWorkItemIndex = 0; // Reset for new segment
      currentSegmentIndex++;
    }

    // Check if all segments are done
    if (currentSegmentIndex >= configuration.segments.length) {
      if (configuration.repeat) {
        if (configuration.restBetweenSections > 0) {
          isBetweenSectionsRest = true;
          updateTimerDisplay(configuration.restBetweenSections, "Rest before repeating sequence", "Section Break", 0, 0, false, isBetweenSectionsRest);
          showSystemNotification("Sequence Complete", "Rest before repeating.");
          playSound('segmentEnd');
        } else { // No rest between sections, immediately repeat
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
      } else { // No repeat, sequence complete
        setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, isComplete: true, description: 'Timer Complete!', timeLeft: 0 }));
        showSystemNotification('Timer Finished!', `${configuration.name} sequence is complete.`);
        playSound('sequenceComplete');
      }
      return;
    }

    // If not all segments/work items done, and not resting, set up next work item
    const nextSegment = configuration.segments[currentSegmentIndex];
    const nextWorkItemInstruction = nextSegment.work[currentWorkItemIndex];
    updateTimerDisplay(nextSegment.time, nextWorkItemInstruction, nextSegment.name, currentWorkItemIndex, currentSegmentIndex, isResting, isBetweenSectionsRest);
    
    // Only notify for new work/segment start, not after a rest if it's the same segment logic (though current logic moves to new segment after rest)
    if(!isResting && !isBetweenSectionsRest){ // This check is crucial
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
    
    // Attempt to unlock audio with a non-tick sound, as this is a user gesture.
    if (!audioUnlockedRef.current) {
        playSound('segmentEnd'); // This call will attempt to set audioUnlockedRef.current
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


    if (timerState.isComplete) { // Restarting a completed timer
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
            // playSound('segmentEnd'); // Already called above for audio unlock
        } else {
             // Fallback if initial segment is somehow invalid
             setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        }
    } else { // Starting a new or paused timer
        setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false, isComplete: false }));
        if (!timerState.isPaused && configuration.segments[timerState.currentSegmentIndex]) { // Fresh start, not resume
           const currentSegment = configuration.segments[timerState.currentSegmentIndex];
           const currentWorkItem = currentSegment.work[timerState.currentWorkItemIndex] || "Continuing segment";
           showSystemNotification(`Starting: ${timerState.currentSegmentName}`, currentWorkItem);
           // playSound('segmentEnd'); // Already called above for audio unlock
        }
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  };

  const resumeTimer = () => {
    if (!configuration || configuration.segments.length === 0 || timerState.isComplete) return;
    
    // Attempt to unlock audio if not already unlocked, as this is a user gesture.
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
      return; // Don't skip if not active or already complete and no config
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    
    moveToNextState(); // This will handle sound and notification

    // If the timer becomes complete after skipping, ensure isRunning is false.
    // moveToNextState updates isComplete, so we check it after the call.
    // The `setTimerState` inside moveToNextState might already handle this,
    // but an explicit check based on its outcome could be safer.
    // However, `moveToNextState` already updates `isRunning` to false if it completes.

    // If it was paused and skipped, it should remain paused but on the new segment/state.
    // If it was running and skipped, it should continue running on the new segment/state.
    // `moveToNextState` sets up the new timeLeft. If it doesn't mark as complete,
    // the main timer useEffect will pick up if isRunning is true.
    // If it was paused, isRunning remains false, isPaused remains true.
    // If it was running, isRunning remains true, isPaused remains false.

    // If after moveToNextState, the timer is NOT complete AND it was running, ensure it stays running.
    // This is mostly handled by `moveToNextState` not changing `isRunning` unless it completes.
    // If it was paused, it should remain paused.
    setTimerState(prev => {
      if (prev.isComplete) { // moveToNextState determined completion
        return { ...prev, isRunning: false, isPaused: false };
      }
      // If it was running before skip, and not completed by skip, keep it running
      // If it was paused before skip, and not completed by skip, keep it paused
      // This means, current isRunning and isPaused are likely correct unless moveToNextState changes them for completion.
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

