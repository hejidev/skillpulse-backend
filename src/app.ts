import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";
import { sanitizeMiddleware } from "./middleware/sanitize";

import authRoutes from "./routes/auth-routes";
import adminRoutes from "./routes/admin-routes";
import skillRoutes from "./routes/skill-routes";
import progressRoutes from "./routes/progress-routes";
import dashboardRoutes from "./routes/dashboard";
import leaderboardRoutes from "./routes/leaderboard-routes";
import settingsRoutes from "./routes/settings-routes";
import searchRoutes from "./routes/search-routes";
import achievementRoutes from "./routes/achievement-routes";
import aiRoutes from "./routes/ai-routes";
import ticketRoutes from "./routes/ticket-routes";
import messageRoutes from "./routes/message-routes";
import coachRoutes from "./routes/coach-routes";
import webhookRoutes from "./routes/webhook-routes";
import systemAlertRoutes from "./routes/system-alert.routes";
import { requestMonitor } from "./middleware/request-monitor";
import { socMonitor } from "./middleware/soc-monitor.middleware";
import blogRoutes from "./routes/blog-routes";
import aboutRoutes from "./routes/about-routes";

const app = express();

app.set("trust proxy", 1);

// 🔐 HELMET (STRONG MODE)
app.use(helmet());

// ✅ CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "https://skillpulse-rho.vercel.app"],
    credentials: true,
  })
);

// WEBHOOK FIRST
app.use("/api/webhooks/resend", express.raw({ type: "application/json" }));

// BODY
app.use(express.json());

// 🧼 SANITIZE + XSS
app.use(sanitizeMiddleware);
app.use(hpp());

// ⚡ PERFORMANCE
app.use(compression());

// 🚫 GLOBAL RATE LIMIT
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use(requestMonitor);

app.use(socMonitor);

// 🚫 STRICT LOGIN LIMIT (ANTI-BRUTE FORCE)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "Too many login attempts. Try again later.",
});



// 🚀 ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/ai", aiRoutes)
app.use("/api/tickets", ticketRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/coach", coachRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/system-alerts", systemAlertRoutes);
app.use("/api/blog", blogRoutes);
app.use( "/api/about", aboutRoutes);
app.use("/api/webhooks", webhookRoutes);

export default app;