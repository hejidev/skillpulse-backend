import Activity from "../../models/Activity";

export const buildHeatmap =
  async () => {

    const today = new Date();

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setDate(
      today.getDate() - 6
    );

    const data =
      await Activity.aggregate([
        {
          $match: {
            createdAt: {
              $gte: sevenDaysAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              $dayOfWeek: "$createdAt",
            },

            users: {
              $sum: 1,
            },
          },
        },
      ]);

    const days = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];

    return days.map(
      (day, index) => {

        const found =
          data.find(
            (d) =>
              d._id === index + 1
          );

        return {
          day,
          users:
            found?.users || 0,
        };
      }
    );
  };