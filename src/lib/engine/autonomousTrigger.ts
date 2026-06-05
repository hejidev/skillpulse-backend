import User from "../../models/User";
import { userSockets } from "../../server";

export async function autonomousTrigger({
  sessions,
  userId,
  io,
}: {
  sessions: any[];
  userId: string;
  io?: any;
}) {
  const { notificationBrain } = await import("./notificationBrain.js");

  const events = notificationBrain(sessions);

  for (const event of events) {
    // 🔥 1. SAVE TO DATABASE
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          notifications: {
            message: event.message,
            type: event.type,
            read: false,
            createdAt: new Date(),
          },
        },
      }
    );

    // ⚡ 2. REAL-TIME SOCKET PUSH
   const socketId = userSockets.get(userId);

if (socketId && io) {
  io.to(socketId).emit("notification", event);
}

    // 🧠 3. HIGH PRIORITY LOGIC
    if (event.priority >= 8) {
      console.log("🚨 HIGH PRIORITY:", event.title);
    }
  }

  return events;
}