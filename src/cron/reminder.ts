import cron from "node-cron";
import User from "../models/User";
import Progress from "../models/Progress";
import { sendEmail } from "../services/email-service";
import { io, userSockets } from "../server";

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

// 🕘 DAILY CHECK
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

    if (active && streakRisk && notSpammed && daysSince >= 1) {
      
      // 📧 EMAIL
      await sendEmail(
        user.email,
        "🔥 Your streak is at risk!",
        `<p>Don’t break your momentum — log today’s progress.</p>`
      );

      // 🧠 SAVE NOTIFICATION
      user.notifications.push({
        message: "🔥 Your streak is at risk!",
        read: false,
        createdAt: new Date(),
      });

      user.reminder = {
        lastRemindedAt: new Date(),
        reminderCountToday: (user.reminder?.reminderCountToday || 0) + 1,
        lastMessage: "🔥 Your streak is at risk!",
        unread: true,
      };

      await user.save();

      // ⚡ REAL-TIME SOCKET PUSH
      const socketId = userSockets.get(user._id.toString());

      if (socketId) {
        io.to(socketId).emit("notification", {
          message: "🔥 Your streak is at risk!",
        });
      }
    }
  }
});