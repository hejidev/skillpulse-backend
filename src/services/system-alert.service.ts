import { io } from "../server";
import Message from "../models/Message";


/* =========================================
   THREAT TYPES
========================================= */
type ThreatEvent = {
  type:
    | "auth_failure"
    | "brute_force"
    | "api_abuse"
    | "system_error"
    | "suspicious_activity"
    | "db_failure";

  severity?: "low" | "medium" | "high" | "critical";

  userId?: string;

  metadata?: any;
};

/* =========================================
   SCORE ENGINE
========================================= */
const calculateSeverity = (event: ThreatEvent) => {
  let score = 0;

  switch (event.type) {
    case "auth_failure":
      score += 30;
      break;

    case "brute_force":
      score += 90;
      break;

    case "api_abuse":
      score += 60;
      break;

    case "system_error":
      score += 50;
      break;

    case "suspicious_activity":
      score += 40;
      break;

    case "db_failure":
      score += 80;
      break;
  }

  if (event.severity === "critical") score += 20;

  return Math.min(score, 100);
};

/* =========================================
   RISK LEVEL
========================================= */
const getRiskLevel = (score: number) => {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "warning";
  return "safe";
};

/* =========================================
   MAIN ENGINE
========================================= */
export const processThreatEvent = async (event: ThreatEvent) => {
  const score = calculateSeverity(event);
  const risk = getRiskLevel(score);

  const alert = await createSystemAlert({
    title: `SOC ALERT: ${event.type}`,
    content: JSON.stringify(event.metadata || {}, null, 2),

    priority:
      risk === "critical"
        ? "critical"
        : risk === "high"
        ? "high"
        : "medium",

    threatLevel: risk,

    senderId: "SOC_ENGINE",
  });

  /* =========================================
     REAL-TIME STREAM TO ADMIN DASHBOARD
  ========================================= */
  io.to("admin-dashboard").emit("socEvent", {
    ...alert.toObject(),
    score,
    riskLevel: risk,
  });

  /* =========================================
     AUTO ESCALATION
  ========================================= */
  if (risk === "critical") {
    io.to("admin-dashboard").emit("socEscalation", {
      message: "CRITICAL THREAT DETECTED",
      alert,
    });

    // optional: notify system room
    io.to("admin-analytics").emit("socCritical", alert);
  }

  return alert;
};

/* ================================
   CREATE SYSTEM ALERT
================================ */
export const createSystemAlert = async (data: any) => {
  const alert = await Message.create({
    title: data.title,
    content: data.content,
    type: "system",
    category: "system_alert",
    priority: data.priority || "high",

    sender: {
      id: data.senderId || "system",
      role: "system",
    },

    recipients: {
      segment: "admins",
      userIds: data.userIds || [],
    },

    status: "sent",

    deliveryStats: {
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
    },

    aiInsights: {
      openRate: 0,
      threatLevel: data.threatLevel || "warning",
      engagementScore: 0,
    },
  });
  return alert;
};

/* ================================
   UPDATE SYSTEM ALERT
================================ */
export const updateSystemAlert = async (
  alertId: string,
  update: any
) => {
  const alert = await Message.findByIdAndUpdate(
    alertId,
    update,
    { new: true }
  );

  if (!alert) return null;

  return alert;
};