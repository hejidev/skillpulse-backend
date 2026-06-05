export const buildSessions = (logs: any[]) => {
  if (!logs.length) return [];

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );

  const sessions: any[] = [];
  let current: any[] = [];

  const GAP = 1000 * 60 * 90; // 1.5 hours

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const prev = sorted[i - 1];

    if (!prev) {
      current.push(log);
      continue;
    }

    const diff =
      new Date(log.createdAt).getTime() -
      new Date(prev.createdAt).getTime();

    if (diff <= GAP) {
      current.push(log);
    } else {
      sessions.push(current);
      current = [log];
    }
  }

  if (current.length) sessions.push(current);

  return sessions;
};