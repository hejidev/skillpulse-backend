import User from "../../models/User";
import Skill from "../../models/Skill";
import Progress from "../../models/Progress";
import Activity from "../../models/Activity";
import Ticket from "../../models/Ticket";
import Threat from "../../models/Threat";
import AnalyticsSnapshot from "../../models/Analytics";

export const buildRealtimeAnalytics =
  async () => {
    const now = new Date();

    const last24h = new Date(
      now.getTime() - 1000 * 60 * 60 * 24
    );

    const [
      totalUsers,
      onlineUsers,
      totalSkills,
      totalActivities,
      aiRequests,
      threatsDetected,
      openTickets,
      resolvedTickets,
      totalXP,
      activeUsers24h,
      newUsersToday,
      churnRiskUsers,
      engagedUsers,
      inactiveUsers,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isOnline: true,
      }),

      Skill.countDocuments(),

      Activity.countDocuments(),

      Activity.countDocuments({
        type: "ai_used",
      }),

      Threat.countDocuments(),

      Ticket.countDocuments({
        status: "open",
      }),

      Ticket.countDocuments({
        status: "resolved",
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

      User.countDocuments({
        lastSeen: {
          $gte: last24h,
        },
      }),

      User.countDocuments({
        createdAt: {
          $gte: last24h,
        },
      }),

      User.countDocuments({
        riskScore: {
          $gte: 70,
        },
      }),

      User.countDocuments({
        streak: {
          $exists: true,
        },
        "streak.current": {
          $gte: 14,
        },
      }),

      User.countDocuments({
        lastSeen: {
          $lte: new Date(
            now.getTime() -
              1000 * 60 * 60 * 24 * 7
          ),
        },
      }),
    ]);

    const snapshot =
      await AnalyticsSnapshot.create({
        totalUsers,

        onlineUsers,

        activeUsers24h,

        newUsersToday,

        totalXP:
          totalXP[0]?.total || 0,

        totalSkills,

        totalActivities,

        aiRequests,

        threatsDetected,

        openTickets,

        resolvedTickets,

        averageSessionDuration: 32,

        churnRiskUsers,

        engagedUsers,

        inactiveUsers,
      });

    return snapshot;
  };