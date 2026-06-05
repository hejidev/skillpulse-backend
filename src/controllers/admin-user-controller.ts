import { Request, Response } from "express";
import User from "../models/User";
import { ROLE_PERMISSIONS } from "../constants/roles";
import SecurityLog from "../models/SecurityLog";
import { logActivity } from "../lib/activity";

/* =========================================
   GET ALL USERS
========================================= */
export const getAllUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/* =========================================
   UPDATE USER ROLE
========================================= */
export const updateUserRole = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, role } = req.body;

    if (
      ![
        "user",
        "support",
        "admin",
        "super_admin",
      ].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role as any;

    user.permissions =
      ROLE_PERMISSIONS[
      role as keyof typeof ROLE_PERMISSIONS
      ];

    await user.save();

    res.json({
      success: true,
      message: "Role updated",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Role update failed",
    });
  }
};

/* =========================================
   SUSPEND USER
========================================= */
export const suspendUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: "suspended",
      },
      { new: true }
    );

    await logActivity({
      userId: user?._id.toString(),

      type: "security_alert",

      title: "User Suspended",

      description:
        `${user?.name} was suspended`,

      severity: "danger",
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};

/* =========================================
   ACTIVATE USER
========================================= */
export const activateUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: "active",
      },
      { new: true }
    );

    await logActivity({
      userId: user?._id.toString(),

      type: "security_alert",

      title: "User Activated",

      description:
        `${user?.name} account restored`,

      severity: "success",
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
};

export const getAdminAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const totalUsers =
      await User.countDocuments();

    const activeUsers =
      await User.countDocuments({
        status: "active",
      });

    const suspendedUsers =
      await User.countDocuments({
        status: "suspended",
      });

    const onlineUsers =
      await User.countDocuments({
        isOnline: true,
      });

    const admins =
      await User.countDocuments({
        role: "admin",
      });

    const support =
      await User.countDocuments({
        role: "support",
      });

    res.json({
      success: true,

      analytics: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        onlineUsers,
        admins,
        support,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
};

/* =========================================
   GET AUDIT LOGS
========================================= */
export const getAuditLogs = async (
  req: Request,
  res: Response
) => {
  try {

    // ✅ QUERY PARAMS
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const skip =
      (page - 1) * limit;

    // ✅ FETCH LOGS
    const logs = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email");

    // ✅ TOTAL COUNT
    const total =
      await SecurityLog.countDocuments();

    res.json({
      success: true,

      logs,

      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });

  }
};