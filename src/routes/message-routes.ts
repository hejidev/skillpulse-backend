import express from "express";
import {
  createBroadcast,
  getMessages,
  replyMessage,
} from "../controllers/message-controller";

import Message from "../models/Message";

import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";
import { sendEmail } from "../services/email-service";
import { io } from "../server";

const router = express.Router();

router.post(
  "/broadcast",
  isAuth,
  requireRole("admin", "super_admin"),
  createBroadcast
);

router.get(
  "/",
  isAuth,
  requireRole("admin", "super_admin"),
  getMessages
);

router.post(
  "/reply",
  isAuth,
  requireRole("admin", "super_admin"),
  replyMessage
);

router.put(
  "/read/:id",
  isAuth,
  async (req: any, res) => {

    const message =
      await Message.findById(
        req.params.id
      );

    if (!message) {
      return res.status(404).json({
        success: false,
      });
    }

    if (
      !message.readBy.includes(
        req.userId
      )
    ) {
      message.readBy.push(
        req.userId
      );
    }

    if (
      !message.openedBy.includes(
        req.userId
      )
    ) {
      message.openedBy.push(
        req.userId
      );
    }

    message.deliveryStats.opened =
      message.openedBy.length;

    await message.save();

    return res.json({
      success: true,
    });
  }
);

router.put(
  "/archive/:id",
  isAuth,
  async (req: any, res) => {

    try {

      const message =
        await Message.findById(
          req.params.id
        );

      if (!message) {
        return res.status(404).json({
          success: false,
        });
      }

      /* =========================
         MOVE TO ARCHIVE
      ========================= */
      message.category = "archived";

      /* =========================
         KEEP MESSAGE SENT
      ========================= */
      if (
        message.status !== "resolved"
      ) {
        message.status = "sent";
      }

      /* =========================
         TRACK USER
      ========================= */
      if (
        !message.archivedBy.includes(
          req.userId
        )
      ) {
        message.archivedBy.push(
          req.userId
        );
      }

      await message.save();

      io.to("admin-messages").emit(
        "messageArchived",
        message
      );

      return res.json({
        success: true,
        message,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
      });
    }
  }
);

router.get(
  "/insights",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),

  async (req, res) => {

    const messages =
      await Message.find();

    const total =
      messages.length;

    const delivered =
      messages.reduce(
        (acc, msg) =>
          acc +
          (
            msg.deliveryStats
              ?.delivered || 0
          ),
        0
      );

    const opened =
      messages.reduce(
        (acc, msg) =>
          acc +
          (
            msg.deliveryStats
              ?.opened || 0
          ),
        0
      );

    const openRate =
      delivered > 0
        ? Math.round(
            (opened / delivered) *
              100
          )
        : 0;

    const threatAlerts =
      messages.filter(
        (m) =>
          m.aiInsights
            ?.threatLevel !==
          "safe"
      ).length;

    return res.json({
      success: true,

      analytics: {
        total,
        delivered,
        opened,
        openRate,
        threatAlerts,

        deliverySpeed:
          delivered > 100
            ? "Fast"
            : "Moderate",
      },
    });
  }
);

/* ================= TEST EMAIL ================= */

router.get(
  "/test-email",
  async (req, res) => {

    try {

      await sendEmail(
        "testermyhope@gmail.com",
        "SkillPulse Test",
        "<h1>Email Works 🚀</h1>"
      );

      return res.json({
        success: true,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
      });
    }
  }
);

export default router;