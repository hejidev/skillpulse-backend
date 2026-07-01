import { Request, Response } from "express";
import AdminNotification from "../models/AdminNotification";
import { AuthRequest } from "../types/express";

/* =========================================
   GET NOTIFICATIONS
========================================= */
export const getAdminNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const docs = await AdminNotification.find({
      targetRoles: { $in: ["admin", "super_admin", "support"] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const notifications = docs.map((n: any) => ({
      ...n,
      read: (n.readBy || []).some(
        (entry: any) =>
          entry.userId?.toString() === req.userId?.toString()
      ),
    }));

    const total = await AdminNotification.countDocuments({
      targetRoles: { $in: ["admin", "super_admin", "support"] },
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

/* =========================================
   GET UNREAD NOTIFICATIONS
========================================= */
export const getUnreadNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await AdminNotification.find({
            // Only notifications targeted at admins/super_admin/support
            targetRoles: { $in: ["admin", "super_admin", "support"] },

            // User has not read this yet
            "readBy.userId": { $ne: req.userId },

            // Optional: not expired
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

/* =========================================
   MARK AS READ
========================================= */
export const markNotificationRead =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            const notification =
                await AdminNotification.findByIdAndUpdate(
                    req.params.id,
                    {
                        $addToSet: {
                            readBy: {
                                userId:
                                    req.userId,

                                readAt:
                                    new Date(),
                            },
                        },
                    },
                    { new: true }
                );

            res.json({
                success: true,
                notification,
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
            });
        }
    };

/* =========================================
MARK ALL NOTIFICATIONS AS READ
========================================= */

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();

        const result = await AdminNotification.updateMany(
            {
                targetRoles: { $in: ["admin", "super_admin", "support"] },
                "readBy.userId": { $ne: req.userId },
            },
            {
                $addToSet: {
                    readBy: {
                        userId: req.userId,
                        readAt: now,
                    },
                },
            }
        );

        res.json({ success: true, modified: result.modifiedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

/* =========================================
   ARCHIVE NOTIFICATION
========================================= */
export const archiveNotification =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            const notification =
                await AdminNotification.findByIdAndUpdate(
                    req.params.id,
                    {
                        $addToSet: {
                            archivedBy: {
                                userId:
                                    req.userId,

                                archivedAt:
                                    new Date(),
                            },
                        },
                    },
                    { new: true }
                );

            res.json({
                success: true,
                notification,
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
            });
        }
    };


/* =========================================
      DELETE NOTIFICATION
========================================== */
export const deleteNotification =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            await AdminNotification.findByIdAndDelete(
                req.params.id
            );

            res.json({
                success: true,
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
            });
        }
    };

    /* =========================================
   DELETE MANY NOTIFICATIONS
========================================== */
    export const deleteMany = async (req: AuthRequest, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  console.log("deleteMany ids:", ids);

  await AdminNotification.deleteMany({ _id: { $in: ids } });

  res.json({ success: true });
};

/* =========================================
    NOTIFICATION STATS
========================================== */
export const getNotificationStats =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            const baseFilter = {
                targetRoles: { $in: ["admin", "super_admin", "support"] },
            };

            const total = await AdminNotification.countDocuments(baseFilter);

            const unread = await AdminNotification.countDocuments({
                ...baseFilter,
                "readBy.userId": { $ne: req.userId },
            });

            const critical = await AdminNotification.countDocuments({
                ...baseFilter,
                severity: "critical",
                "readBy.userId": { $ne: req.userId }, // critical AND unread
            });

            const today =
                await AdminNotification.countDocuments({
                    createdAt: {
                        $gte: new Date(
                            new Date().setHours(
                                0,
                                0,
                                0,
                                0
                            )
                        ),
                    },
                });

            res.json({
                success: true,

                stats: {
                    total,
                    unread,
                    critical,
                    today,
                },
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
            });
        }
    };

export const archiveMany =
    async (req: AuthRequest, res: Response) => {

        const { ids } = req.body;

        await AdminNotification.updateMany(
            {
                _id: { $in: ids }
            },
            {
                $addToSet: {
                    archivedBy: {
                        userId: req.userId,
                        archivedAt: new Date()
                    }
                }
            });

        res.json({
            success: true
        });
    };

    // POST /admin/notifications/delete-by-filter
export const deleteByFilter = async (req: AuthRequest, res: Response) => {
  try {
    const { category, severity, search } = req.body;

    const filter: any = {
      targetRoles: { $in: ["admin", "super_admin", "support"] },
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    await AdminNotification.deleteMany(filter);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};