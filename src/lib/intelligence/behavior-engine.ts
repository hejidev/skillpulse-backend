import User from "../../models/User";
import Activity from "../../models/Activity";

export const buildBehaviorAnalytics =
  async () => {

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    const yesterday = new Date();
    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const [
      inactiveUsers,
      engagedUsers,
      decliningStreaks,
      highestStreakUser,
      losingStreaks,
      activeStreakUsers,
    ] = await Promise.all([

      User.countDocuments({
        lastSeen: {
          $lt: sevenDaysAgo,
        },
      }),

      Activity.distinct(
        "userId",
        {
          createdAt: {
            $gte: sevenDaysAgo,
          },
        }
      ),

      Activity.countDocuments({
        type: "streak_updated",
        severity: "warning",
      }),

      User.findOne()
        .sort({
          "streak.longest": -1,
        })
        .select("streak.longest"),

      User.countDocuments({
        lastActiveDate: {
          $lt: yesterday,
        },
        "streak.current": {
          $gt: 0,
        },
      }),

      User.countDocuments({
        "streak.current": {
          $gte: 3,
        },
      }),
    ]);

    return {
      churn: inactiveUsers,

      users:
        engagedUsers.length,

      streak:
        decliningStreaks,

      highestStreak:
        highestStreakUser?.streak
          ?.longest || 0,

      losingStreaks,

      activeStreakUsers,
    };
  };