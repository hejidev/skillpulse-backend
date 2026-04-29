import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import "./cron/reminder";

import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

// ✅ CREATE HTTP SERVER
const server = http.createServer(app);

// ✅ SOCKET.IO SETUP
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);
});

// ❗ IMPORTANT: use server.listen NOT app.listen
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();