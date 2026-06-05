type ProgressEntry = {
  hours: number;
  createdAt: string | Date;
};

export function calculateStreak(progress: ProgressEntry[]) {
  if (!progress?.length) return 0;

  // sort newest → oldest
  const sorted = [...progress].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const entryDate = new Date(sorted[i].createdAt);

    const diffDays = Math.floor(
      (currentDate.getTime() - entryDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // same day or consecutive day with activity
    if (diffDays <= streak + 1 && sorted[i].hours > 0) {
      streak++;
      currentDate = entryDate;
    } else {
      break;
    }
  }

  return streak;
}

export const getMissedDays = (lastDate?: Date) => {
  if (!lastDate) return 999;

  const today = new Date();

  const diff =
    Math.floor(
      (today.setHours(0, 0, 0, 0) -
        new Date(lastDate).setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

  return diff;
};