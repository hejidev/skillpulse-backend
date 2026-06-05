import Activity from "../../models/Activity";

const DAYS = [
  "",
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const buildGrowthGraph =
  async () => {

    const data =
      await Activity.aggregate([
        {
          $group: {
            _id: {
              day: {
                $dayOfWeek:
                  "$createdAt",
              },
            },

            users: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.day": 1,
          },
        },
      ]);

    return data.map((item) => ({
      name:
        DAYS[item._id.day],
      users:
        item.users,
    }));
  };