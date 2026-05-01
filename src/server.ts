import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import "./cron/reminder";

import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

// HTTP server
const server = http.createServer(app);

// SOCKET.IO
export const io = new Server(server, {
  cors: {
    origin: "https://skillpulse-rho.vercel.app",
    methods: ["GET", "POST"],
  },
});

// ✅ GLOBAL USER SOCKET MAP (IMPORTANT)
export const userSockets = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // register user
  socket.on("register", (userId: string) => {
    userSockets.set(userId, socket.id);
    console.log("📌 User registered:", userId);
  });

  socket.on("disconnect", () => {
    for (const [userId, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();