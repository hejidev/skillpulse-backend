// routes/integration-routes.ts
import express from "express";
import { ApiKeyRequest } from "../middleware/api-key-auth";
import User from "../models/User";
import Progress from "../models/Progress"; // example, adjust to your models

const router = express.Router();

// Example: get summary of a user's skill progress
router.get("/me/summary", async (req: ApiKeyRequest, res) => {
  try {
    if (!req.apiKeyUserId) {
      return res.status(401).json({ message: "API key not associated with a user" });
    }

    const user = await User.findById(req.apiKeyUserId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // You can calculate some basic summary here
    // This is just a placeholder, adapt to your actual data
    const progressStats = await Progress.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, totalSkills: { $sum: 1 }, lastUpdated: { $max: "$updatedAt" } } },
    ]);

    const summary = progressStats[0] || { totalSkills: 0, lastUpdated: null };

    return res.json({
      userId: user._id,
      name: user.name,
      plan: user.plan,
      totalSkills: summary.totalSkills,
      lastUpdated: summary.lastUpdated,
    });
  } catch (err) {
    console.error("integration /me/summary error:", err);
    return res.status(500).json({ message: "Failed to load summary" });
  }
});

// Add more endpoints like:
// - /me/skills
// - /me/progress
// - /me/analytics

export default router;