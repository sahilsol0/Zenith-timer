import type { TimerConfiguration } from './types';

export const TIMER_TEMPLATES: TimerConfiguration[] = [
  {
    id: 'twenty-twenty-twenty',
    name: '20-20-20 Eye Relief',
    description:
      'For every 20 minutes of screen time, take a 20-second break to look at something 20 feet away. Helps reduce eye strain.',
    segments: [
      {
        name: 'Focus Work',
        work: ['Deep work session. Focus on your current task.'],
        time: 20 * 60, // 20 minutes
        rest: 0,
        restString: 'Prepare for eye break',
      },
      {
        name: 'Eye Break',
        work: ['Look at an object at least 20 feet (6 meters) away.'],
        time: 20, // 20 seconds
        rest: 0,
        restString: 'Prepare to resume work',
      },
    ],
    restBetweenSections: 0,
    repeat: true,
  },
  {
    id: 'basic-workout',
    name: 'Quick Full Body Workout',
    description: 'A short, effective workout routine hitting all major muscle groups. Adjust reps and intensity as needed.',
    segments: [
      {
        name: 'Warm-up',
        work: [
          'Jumping Jacks (30s)',
          'Arm Circles (30s forward, 30s backward)',
          'High Knees (30s)',
        ],
        time: 30, // Each warm-up item is 30 seconds
        rest: 0,
        restString: 'Prepare for workout',
      },
      {
        name: 'Lower Body',
        work: ['Squats (45s)', 'Lunges - Right Leg (45s)', 'Lunges - Left Leg (45s)', 'Glute Bridges (45s)'],
        time: 45, // Each exercise 45 seconds
        rest: 15, // 15 seconds rest after this segment of exercises
        restString: 'Short rest. Next: Upper Body.',
      },
      {
        name: 'Upper Body & Core',
        work: ['Push-ups (or Knee Push-ups) (45s)', 'Plank (45s)', 'Bird-dog (45s)', 'Superman (45s)'],
        time: 45, // Each exercise 45 seconds
        rest: 15, // 15 seconds rest after this segment
        restString: 'Short rest. Next: Cool-down.',
      },
      {
        name: 'Cool-down',
        work: ['Overhead Triceps Stretch (30s per arm)', 'Hamstring Stretch (30s per leg)', 'Child\'s Pose (60s)'],
        time: 60, // Cool down items get varying times based on description, this is a simplification assuming 60s per listed work item.
        // For more precise timing, each work item should be its own segment or time should be adjusted.
        // Given current structure, this means 3 x 60s. Let's adjust 'work' items and 'time' for clarity.
        // Corrected approach:
        // work: ["Overhead Triceps Stretch (30s R, 30s L)", "Hamstring Stretch (30s R, 30s L)", "Child's Pose (60s)"],
        // time: 60, // This would mean each line item takes 60s.
        // Let's simplify to:
        // work: ["Full body stretch"], time: 180
        // Or stick to current logic:
        rest: 0,
        restString: 'Workout complete!',
      },
    ],
    // Adjusted 'Cool-down' based on structure. If total 3 mins for cool-down and 3 items, each item is 60s.
    // Warm-up: 3 items * 30s = 1.5 minutes.
    // Lower Body: 4 items * 45s = 3 minutes work + 15s rest = 3.25 minutes.
    // Upper Body & Core: 4 items * 45s = 3 minutes work + 15s rest = 3.25 minutes.
    // Total time would be sum of these.
    restBetweenSections: 60, // 1 minute rest if repeating the whole workout
    repeat: false,
  },
];

export const LOCAL_STORAGE_CUSTOM_TIMERS_KEY = 'zenithTimerCustomConfigs';
