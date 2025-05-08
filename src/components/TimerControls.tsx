import { PlayIcon, PauseIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react';
import CircleButton from './CircleButton';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip?: () => void; // Optional skip function
}

const TimerControls = ({
  isRunning,
  isPaused,
  isComplete,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center items-center space-x-4 sm:space-x-6 md:space-x-8 my-8">
      <CircleButton
        onClick={onReset}
        icon={RotateCcwIcon}
        text="Reset"
        variant="secondary"
        size="md"
        aria-label="Reset Timer"
        disabled={!isRunning && !isPaused && !isComplete} // Enable reset if timer has started or finished
      />

      {!isRunning || isPaused ? (
        <CircleButton
          onClick={isPaused ? onResume : onStart}
          icon={PlayIcon}
          text={isPaused ? "Resume" : isComplete ? "Restart" : "Start"}
          variant="primary"
          size="lg"
          aria-label={isPaused ? "Resume Timer" : "Start Timer"}
        />
      ) : (
        <CircleButton
          onClick={onPause}
          icon={PauseIcon}
          text="Pause"
          variant="primary"
          size="lg"
          aria-label="Pause Timer"
        />
      )}
      
      {onSkip && (
        <CircleButton
          onClick={onSkip}
          icon={SkipForwardIcon}
          text="Skip"
          variant="secondary"
          size="md"
          aria-label="Skip to Next"
          disabled={!isRunning && !isPaused} // Only enable skip if timer is active or paused
        />
      )}
    </div>
  );
};

export default TimerControls;
