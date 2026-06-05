export type NotificationEvent = {
  id: string;
  type: "info" | "warning" | "success";
  priority: number;
  title: string;
  message: string;
  trigger: "time" | "inactivity" | "consistency" | "performance";
  createdAt: Date;
};

export function notificationBrain(sessions: any[]): NotificationEvent[] {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return [
      {
        id: "init",
        type: "info",
        priority: 1,
        title: "System Ready",
        message: "Start your first session to activate intelligence system",
        trigger: "performance",
        createdAt: new Date(),
      },
    ];
  }

  const events: NotificationEvent[] = [];

  const lastSession = sessions[sessions.length - 1];
  const now = Date.now();
  const lastTime = new Date(lastSession.start).getTime();
  const lastHour = new Date(lastSession.start).getHours();

  // =====================
  // 🌅 TIME WINDOW EVENT
  // =====================
  if (lastHour >= 5 && lastHour <= 10) {
    events.push({
      id: "morning-window",
      type: "success",
      priority: 5,
      title: "Peak Time Detected",
      message: "Morning focus window is active — best time for deep work",
      trigger: "time",
      createdAt: new Date(),
    });
  }

  // =====================
  // ⚠️ INACTIVITY ENGINE
  // =====================
  const daysGap = (now - lastTime) / (1000 * 60 * 60 * 24);

  if (daysGap >= 3) {
    events.push({
      id: "inactive-critical",
      type: "warning",
      priority: 10,
      title: "Critical Inactivity",
      message: "Momentum broken — immediate restart required",
      trigger: "inactivity",
      createdAt: new Date(),
    });
  } else if (daysGap >= 1) {
    events.push({
      id: "inactive-warning",
      type: "warning",
      priority: 7,
      title: "Consistency Drop",
      message: "You missed a day — streak weakening",
      trigger: "inactivity",
      createdAt: new Date(),
    });
  }

  // =====================
  // 🔥 CONSISTENCY ENGINE
  // =====================
  if (sessions.length >= 7) {
    events.push({
      id: "consistency-high",
      type: "success",
      priority: 3,
      title: "Strong Consistency",
      message: "You are building a stable discipline system",
      trigger: "consistency",
      createdAt: new Date(),
    });
  }

  return events.sort((a, b) => b.priority - a.priority);
}