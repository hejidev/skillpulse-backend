import Progress from "../../models/Progress";

export const buildLeaderboard =
  async () => {

    const data =
      await Progress.aggregate([
        {
          $group: {
            _id: "$userId",

            xp: {
              $sum: "$xp",
            },

            streak: {
              $max: "$xp",
            },
          },
        },

        {
          $sort: {
            xp: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },

        {
          $unwind: "$user",
        },

        {
          $project: {
            name: "$user.name",
            xp: 1,
            streak: 1,
          },
        },
      ]);

    return data;
  };