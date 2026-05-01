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
import aiRoutes from "./routes/ai-routes";
import webhookRoutes from "./routes/webhook-routes";

const app = express();

app.set("trust proxy", 1);

// 🔐 HELMET (STRONG MODE)
app.use(helmet());

// ✅ CORS
app.use(
  cors({
    origin: ["http://localhost:3000", 
      "https://skillpulse-rho.vercel.app"],
    credentials: true,
  })
);

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

// 🚫 STRICT LOGIN LIMIT (ANTI-BRUTE FORCE)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "Too many login attempts. Try again later.",
});


app.use("/api/webhooks/resend", express.raw({ type: "application/json" }));

// 🚀 ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/ai", aiRoutes)
app.use("/uploads", express.static("uploads"));
app.use("/api/webhooks", webhookRoutes);

export default app;