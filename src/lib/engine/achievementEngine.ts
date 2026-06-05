type Context = {
  sessions: any[];
  streak: number;
  totalXP: number;
};

export const achievementRules = [
  {
    key: "first-session",
    title: "First Step",
    description: "Complete your first session",
    xpReward: 50,
    check: ({ sessions }: Context) => sessions.length >= 1,
    progress: ({ sessions }: Context) =>
      Math.min(100, sessions.length * 100),
  },

  {
    key: "3-day-streak",
    title: "Getting Warmed Up",
    description: "3 day streak",
    xpReward: 80,
    check: ({ streak }: Context) => streak >= 3,
    progress: ({ streak }: Context) =>
      Math.min(100, (streak / 3) * 100),
  },

  {
    key: "7-day-streak",
    title: "Consistency Master",
    description: "7 day streak",
    xpReward: 150,
    check: ({ streak }: Context) => streak >= 7,
    progress: ({ streak }: Context) =>
      Math.min(100, (streak / 7) * 100),
  },

  {
    key: "14-day-streak",
    title: "Unstoppable",
    description: "14 day streak",
    xpReward: 300,
    check: ({ streak }: Context) => streak >= 14,
    progress: ({ streak }: Context) =>
      Math.min(100, (streak / 14) * 100),
  },

  {
    key: "10-hours",
    title: "Focused Mind",
    description: "10 total hours",
    xpReward: 100,
    check: ({ sessions }: Context) =>
      sessions.reduce((a, s) => a + s.totalHours, 0) >= 10,
    progress: ({ sessions }: Context) => {
      const total = sessions.reduce((a, s) => a + s.totalHours, 0);
      return Math.min(100, (total / 10) * 100);
    },
  },

  {
    key: "50-hours",
    title: "Dedicated Learner",
    description: "50 total hours",
    xpReward: 400,
    check: ({ sessions }: Context) =>
      sessions.reduce((a, s) => a + s.totalHours, 0) >= 50,
    progress: ({ sessions }: Context) => {
      const total = sessions.reduce((a, s) => a + s.totalHours, 0);
      return Math.min(100, (total / 50) * 100);
    },
  },

  {
    key: "deep-work",
    title: "Deep Worker",
    description: "2 hour session",
    xpReward: 120,
    check: ({ sessions }: Context) =>
      sessions.some((s) => s.totalHours >= 2),
    progress: ({ sessions }: Context) => {
      const best = Math.max(...sessions.map((s) => s.totalHours));
      return Math.min(100, (best / 2) * 100);
    },
  },

  {
    key: "focus-master",
    title: "Focus Master",
    description: "High focus session",
    xpReward: 200,
    check: ({ sessions }: Context) =>
      sessions.some((s) => s.focusScore > 100),
    progress: ({ sessions }: Context) => {
      const best = Math.max(...sessions.map((s) => s.focusScore));
      return Math.min(100, best / 100);
    },
  },

  {
    key: "elite-100",
    title: "Elite Performer",
    description: "100 total hours",
    xpReward: 1000,
    check: ({ sessions }: Context) =>
      sessions.reduce((a, s) => a + s.totalHours, 0) >= 100,
    progress: ({ sessions }: Context) => {
      const total = sessions.reduce((a, s) => a + s.totalHours, 0);
      return Math.min(100, (total / 100) * 100);
    },
  },

  {
    key: "unstoppable-mode",
    title: "Unstoppable Mode",
    description: "7 deep work sessions",
    xpReward: 800,
    check: ({ sessions }: Context) =>
      sessions.filter((s) => s.totalHours >= 2).length >= 7,
    progress: ({ sessions }: Context) => {
      const count = sessions.filter((s) => s.totalHours >= 2).length;
      return Math.min(100, (count / 7) * 100);
    },
  },
];