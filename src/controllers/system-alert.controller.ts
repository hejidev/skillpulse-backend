import Message from "../models/Message";
import { io } from "../server";
import { createSystemAlert, updateSystemAlert } from "../services/system-alert.service";

/* ================================
   CREATE ALERT API
================================ */
export const createAlert = async (req: any, res: any) => {
  try {
    const alert = await createSystemAlert({
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority,
      threatLevel: req.body.threatLevel,
      userIds: req.body.userIds,
      senderId: req.userId,
    });

    return res.status(201).json({
      success: true,
      alert,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
};

/* ================================
   UPDATE ALERT API
================================ */
export const updateAlert = async (req: any, res: any) => {
  try {
    const alert = await updateSystemAlert(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      alert,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
};

/* ============== ACKNOWLEDGE ALERT ============ */
export const acknowledgeAlert = async (
  req: any,
  res: any
) => {
  try {

    const alert =
      await Message.findByIdAndUpdate(
        req.params.id,
        {
          status: "acknowledged",
        },
        { new: true }
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
      });
    }

    io.to("admin-dashboard").emit(
      "systemAlertUpdated",
      alert
    );

    return res.json({
      success: true,
      alert,
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
    });
  }
};

/* =============== RESOLVE ALERT ============= */
export const resolveAlert = async (req: any, res: any) => {
  try {

    const alert = await Message.findById(
      req.params.id
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    /* ===============================
       UPDATE ALERT
    =============================== */
    alert.status = "resolved";

    /* ===============================
       MOVE TO ARCHIVE CHANNEL
    =============================== */
    alert.category = "archived";

    /* ===============================
       TRACK WHO ARCHIVED IT
    =============================== */
    if (
      !alert.archivedBy.includes(req.userId)
    ) {
      alert.archivedBy.push(req.userId);
    }

    await alert.save();

    /* ===============================
       REALTIME UPDATE
    =============================== */
    io.to("admin-dashboard").emit(
      "systemAlertUpdated",
      alert
    );

    io.to("admin-messages").emit(
      "messageArchived",
      alert
    );

    return res.json({
      success: true,
      alert,
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
    });
  }
};

/* =============== ESCALATE ALERT ============= */
export const escalateAlert = async (
  req: any,
  res: any
) => {
  try {

    const alert =
      await Message.findByIdAndUpdate(
        req.params.id,
        {
          priority: "critical",
          status: "escalated",
        },
        { new: true }
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
      });
    }

    io.to("admin-analytics").emit(
      "socEscalation",
      {
        message:
          "MANUAL ESCALATION TRIGGERED",
        alert,
      }
    );

    io.to("admin-dashboard").emit(
      "systemAlertUpdated",
      alert
    );

    return res.json({
      success: true,
      alert,
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
    });
  }
};