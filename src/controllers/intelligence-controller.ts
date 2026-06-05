import { Request, Response } from "express";

import { buildGrowthGraph } from "../lib/intelligence/growth-engine";
import { buildLeaderboard } from "../lib/intelligence/leaderboard-engine";
import { buildSkillPopularity } from "../lib/intelligence/skill-popularity-engine";
import { buildThreatFeed } from "../lib/intelligence/threat-feed-engine";
import { buildBehaviorAnalytics } from "../lib/intelligence/behavior-engine";
import Analytics from "../models/Analytics";
import { buildHeatmap } from "../lib/intelligence/heatmap-engine";

export const getIntelligenceOverview =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const [
  growthGraph,
  skillPopularity,
  leaderboard,
  threatData,
  behavior,
  analytics,
  heatmap,
] = await Promise.all([
  buildGrowthGraph(),
  buildSkillPopularity(),
  buildLeaderboard(),
  buildThreatFeed(),
  buildBehaviorAnalytics(),
  Analytics.findOne()
    .sort({ createdAt: -1 })
    .lean(),
  buildHeatmap(),
]);

      return res.json({
        success: true,

        growthGraph,

        skillPopularity,

        leaderboard,

        threats: threatData.threats,

        threatSummary:
          threatData.summary,

        behavior,

        analytics,

        heatmap,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to load intelligence overview",
      });
    }
  };

export const getAnalyticsHistory =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const range =
        req.query.range || "7d";

      let limit = 7;

      if (range === "30d") {
        limit = 30;
      }

      if (range === "90d") {
        limit = 90;
      }

      const snapshots =
        await Analytics.find()
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return res.json({
        success: true,
        snapshots:
          snapshots.reverse(),
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
      });
    }
  };