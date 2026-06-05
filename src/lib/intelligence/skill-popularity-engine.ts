// import Progress from "../../models/Progress";

// export const buildSkillPopularity =
//   async () => {

//     const data =
//       await Progress.aggregate([
//         {
//           $group: {
//             _id: "$skillId",

//             value: {
//               $sum: "$xp",
//             },
//           },
//         },

//         {
//           $lookup: {
//             from: "skills",
//             localField: "_id",
//             foreignField: "_id",
//             as: "skill",
//           },
//         },

//         {
//           $unwind: "$skill",
//         },

//         {
//           $project: {
//             name:
//               "$skill.name",

//             value: 1,
//           },
//         },

//         {
//           $sort: {
//             value: -1,
//           },
//         },

//         {
//           $limit: 6,
//         },
//       ]);

//     return data;
//   };

import Skill from "../../models/Skill";

export const buildSkillPopularity = async () => {
  const data = await Skill.aggregate([
    {
      $group: {
        _id: "$name",
        value: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        name: "$_id",
        value: 1,
      },
    },

    {
      $sort: {
        value: -1,
      },
    },

    {
      $limit: 6,
    },
  ]);

  return data;
};