import cron from "node-cron";
import { io } from "../server";
import User from "../models/User";
import Progress from "../models/Progress";
import { sendEmail } from "../services/email-service";


const isActiveLearner = (logs: any[]) => {
  const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return logs.filter(
    (log) => new Date(log.createdAt).getTime() >= last7Days
  ).length >= 3;
};

const isStreakAtRisk = (streak: number, lastActiveDate: Date) => {
  const daysSince =
    (Date.now() - new Date(lastActiveDate).getTime()) /
    (1000 * 60 * 60 * 24);

  return streak <= 3 || daysSince >= 1;
};

const canSendReminderToday = (user: any) => {
  const today = new Date().toDateString();

  if (!user.reminder?.lastRemindedAt) return true;

  const last = new Date(user.reminder.lastRemindedAt).toDateString();

  return last !== today;
};

cron.schedule("0 9 * * *", async () => {
  console.log("🔥 Smart Reminder System Running...");

  const users = await User.find({
    emailNotifications: true,
  });

  for (const user of users) {
    if (!user.email) continue;

    const lastProgress = await Progress.findOne({
      userId: user._id,
    }).sort({ createdAt: -1 });

    if (!lastProgress) continue;

    const daysSince =
      (Date.now() - new Date(lastProgress.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const logs = await Progress.find({ userId: user._id });

    const active = isActiveLearner(logs);
    const streakRisk = isStreakAtRisk(
      user.streak?.current || 0,
      user.streak?.lastActiveDate || new Date()
    );

    const notSpammed = canSendReminderToday(user);

    // 🚨 FINAL DECISION ENGINE
    if (active && streakRisk && notSpammed && daysSince >= 1) {
      await sendEmail(
        user.email,
        "🔥 Your streak is at risk!",
        `<p>Don’t break your momentum — log today’s progress.</p>`
      );

      // update spam protection
      user.reminder = {
        lastRemindedAt: new Date(),
        reminderCountToday: (user.reminder?.reminderCountToday || 0) + 1,
        lastMessage: "🔥 Your streak is at risk!",
        unread: true,
      };

      user.notifications.push({
        message: "🔥 Your streak is at risk!",
        read: false,
        createdAt: new Date(),
      });

      await user.save();

      // ⚡ REAL-TIME PUSH
      const userSockets = new Map();

      io.on("connection", (socket) => {
        socket.on("register", (userId) => {
          userSockets.set(userId, socket.id);
        });

        socket.on("disconnect", () => {
          for (const [userId, id] of userSockets.entries()) {
            if (id === socket.id) {
              userSockets.delete(userId);
            }
          }
        });
      });
    }
  }
});