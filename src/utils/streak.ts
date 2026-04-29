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