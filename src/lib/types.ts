export type TimerSegment = {
  name: string; // e.g., "Work", "Eye Break", "Warmup"
  work: string[]; // Array of instructions for the work/activity phase. Each string is one instruction.
  time: number; // Duration in seconds for EACH item in the 'work' array.
  rest: number; // Duration of the rest period after this segment's work items are completed, in seconds.
  restString: string; // Instruction for the rest period.
};

export type TimerConfiguration = {
  id: string; // Unique ID for the configuration
  name: string; // Name of the timer configuration (e.g., "20-20-20 Eye Relief")
  description: string; // Description of the timer configuration
  segments: TimerSegment[]; // Array of timer segments
  restBetweenSections: number; // Rest time in seconds after a full cycle (if repeat is true)
  repeat: boolean; // Whether the sequence repeats
  isCustom?: boolean; // Flag to indicate if it's a user-defined timer
};
