import AnalyticsSnapshot from "../models/Analytics";
import User from "../models/User";
import Activity from "../models/Activity";
import Progress from "../models/Progress";
import Threat from "../models/Threat";
import Ticket from "../models/Ticket";

export const generateAnalyticsSnapshot =
  async () => {

    const [
      totalUsers,
      totalActivities,
      threatsDetected,
      aiRequests,
      totalXP,
      openTickets,
      resolvedTickets,
    ] = await Promise.all([
      User.countDocuments(),

      Activity.countDocuments(),

      Threat.countDocuments(),

      Activity.countDocuments({
        type: "ai_used",
      }),

      Progress.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$xp",
            },
          },
        },
      ]),

      Ticket.countDocuments({
        status: "open",
      }),

      Ticket.countDocuments({
        status: "resolved",
      }),
    ]);

    const snapshot =
      await AnalyticsSnapshot.create({
        totalUsers,

        totalActivities,

        threatsDetected,

        aiRequests,

        totalXP:
          totalXP[0]?.total || 0,

        openTickets,

        resolvedTickets,

        createdAt: new Date(),
      });

    return snapshot;
  };