'use client';

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  className?: string;
}

const TimerDisplay = ({ seconds, className }: TimerDisplayProps) => {
  const formatTime = (time: number) => {
    const absoluteTime = Math.abs(time); // Ensure time is positive for calculations
    const minutes = Math.floor(absoluteTime / 60);
    const remainingSeconds = absoluteTime % 60;
    const sign = time < 0 ? "-" : "";
    return `${sign}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "text-7xl xs:text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-bold text-foreground tabular-nums tracking-tighter", // Responsive font sizes
      "flex justify-center items-center transition-colors duration-500",
      className
    )}>
      {formatTime(seconds)}
    </div>
  );
};

export default TimerDisplay;
