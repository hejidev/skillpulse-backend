import { Request, Response } from "express";
import AdminNotification from "../models/AdminNotification";
import { AuthRequest } from "../types/express";

/* =========================================
   GET NOTIFICATIONS
========================================= */
export const getAdminNotifications = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 20;

        const skip =
            (page - 1) * limit;

        const notifications =
            await AdminNotification.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

        const total =
            await AdminNotification.countDocuments();

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

        res.status(500).json({
            success: false,
        });
    }
};

/* =========================================
   GET UNREAD NOTIFICATIONS
========================================= */
export const getUnreadNotifications =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            const notifications =
                await AdminNotification.find({
                    "readBy.userId": {
                        $ne: req.userId,
                    },
                }).sort({
                    createdAt: -1,
                });

            res.json({
                success: true,
                notifications,
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
            });
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
   MARK ALL NOTIFICATIONS AS READ
========================================= */
export const markAllNotificationsRead =
    async (
        req: AuthRequest,
        res: Response
    ) => {
        try {

            const notifications =
                await AdminNotification.find({
                    "readBy.userId": {
                        $ne: req.userId,
                    },
                });

            for (
                const notification of notifications
            ) {
                notification.readBy.push({
                    userId:
                        req.userId as any,

                    readAt:
                        new Date(),
                });

                await notification.save();
            }

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
        NOTIFICATION STATS
    ========================================== */
export const getNotificationStats =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      const total =
        await AdminNotification.countDocuments();

      const unread =
        await AdminNotification.countDocuments({
          "readBy.userId": {
            $ne: req.userId,
          },
        });

      const critical =
        await AdminNotification.countDocuments({
          severity:
            "critical",
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
   $addToSet:{
      archivedBy:{
       userId:req.userId,
       archivedAt:new Date()
      }
   }
 });

 res.json({
  success:true
 });
};