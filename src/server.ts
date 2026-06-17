import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import "./cron/reminder";
import "./cron/analytics";
import "./cron/message-scheduler";
import "./cron/blog-scheduler";

import http from "http";
import { Server } from "socket.io";

import { collectSystemMetrics } from "./services/system-monitor";
import { analyticsSocket } from "./socket/analytics-socket";
import { syncPaystackPlans } from "./services/paystack-plan-service";
// import { processThreatEvent } from "./services/system-alert.service";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://skillpulse-rho.vercel.app",
    ],
    credentials: true,
  },
});


/* =========================================
   SOCKET CONNECTION
========================================= */
// export a map of userId -> socketId
export const userSockets = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED:", socket.id);

  /* =====================================
     REGISTER USER
  ===================================== */
  socket.on(
    "register-user",
    (userId: string) => {

      if (!userId) return;

      // userSockets.set(
      //   userId,
      //   socket.id
      // );

      socket.data.userId =
        userId;

      socket.join(userId);

      console.log(
        `REGISTERED USER: ${userId}`
      );
    }
  );

  /* =====================================
     ADMIN ROOMS
  ===================================== */
  socket.on("join-admin-dashboard", () => {
    socket.join("admin-dashboard");

    console.log(
      `${socket.id} joined admin-dashboard`
    );
  });

  socket.on("join-admin-analytics", () => {
    socket.join("admin-analytics");

    console.log(
      `${socket.id} joined admin-analytics`
    );
  });

  socket.on("join-messages", () => {
    socket.join("admin-messages");

    console.log(
      `${socket.id} joined admin-messages`
    );
  });

  /* =====================================
     USER ROOM
  ===================================== */
  socket.on(
    "join-user-room",
    (userId: string) => {
      if (!userId) return;

      socket.join(userId);

      console.log(
        `JOINED USER ROOM: ${userId}`
      );
    }
  );

  /* =====================================
     TICKET CHAT
  ===================================== */
  socket.on(
    "joinTicket",
    (ticketId: string) => {
      if (!ticketId) return;

      socket.join(`ticket:${ticketId}`);

      socket
        .to(`ticket:${ticketId}`)
        .emit("presence", {
          status: "online",
        });

      console.log(
        `Socket ${socket.id} joined ticket:${ticketId}`
      );

      socket.emit(
        "joinedTicket",
        ticketId
      );
    }
  );

  socket.on(
    "leaveTicket",
    (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);

      socket
        .to(`ticket:${ticketId}`)
        .emit("presence", {
          status: "offline",
        });

      console.log(
        `Socket ${socket.id} left ticket:${ticketId}`
      );
    }
  );

  /* =====================================
     ABOUT PAGE ADMIN
  ===================================== */
  socket.on(
  "join-about-admin",
  () => {
    socket.join("about-admin");
  }
);

socket.on(
  "leave-about-admin",
  () => {
    socket.leave("about-admin");
  }
);

/* =====================================
     ADMIN NOTIFICATIONS
===================================== */
socket.on(
  "join-admin-dashboard",
  () => {
    socket.join(
      "admin-notifications"
    );
  }
);

  /* =====================================
     TYPING EVENTS
  ===================================== */
  socket.on(
    "typing",
    ({ ticketId, sender }) => {
      socket
        .to(`ticket:${ticketId}`)
        .emit("typing", {
          sender,
        });
    }
  );

  socket.on(
    "stopTyping",
    ({ ticketId }) => {
      socket
        .to(`ticket:${ticketId}`)
        .emit("stopTyping");
    }
  );

  /* =====================================
     READ RECEIPTS
  ===================================== */
  socket.on(
    "messageRead",
    ({ ticketId, messageId }) => {
      socket
        .to(`ticket:${ticketId}`)
        .emit("messageRead", {
          messageId,
        });
    }
  );


  

  /* =====================================
     DISCONNECT
  ===================================== */
  socket.on("disconnect", () => {

    console.log(
      "SOCKET DISCONNECTED:",
      socket.id
    );

    const userId =
      socket.data.userId;
  });
})

/* =========================================
   ANALYTICS SOCKET
========================================= */
analyticsSocket(io);

/* =========================================
   SYSTEM METRICS
========================================= */
let metricsRunning = false;

setInterval(async () => {
  if (metricsRunning) return;

  try {
    metricsRunning = true;

    await collectSystemMetrics();
  } catch (error) {
    console.log(
      "SYSTEM METRICS ERROR:",
      error
    );
  } finally {
    metricsRunning = false;
  }
}, 60000);

/* =========================================
   START SERVER
========================================= */
const startServer = async () => {

  io.engine.on(
    "connection_error",
    (err) => {
      console.log(
        "SOCKET CONNECTION ERROR:",
        err
      );
    }
  );

  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on ${PORT}`
      );
    });
  } catch (error) {
    console.log(error);
  }
};

syncPaystackPlans()
  .then(() => console.log("Paystack plans synced"))
  .catch((err) => console.error("Paystack plan sync error:", err));

startServer();