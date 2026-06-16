// routes/public-settings-routes.ts
import { Router } from "express";
import SystemSettings from "../models/SystemSettings";

const router = Router();

// No auth: just expose non-sensitive fields
router.get("/public-settings", async (req, res) => {
  let settings = await SystemSettings.findOne().lean();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return res.json({
    appName: settings.appName,
    defaultTheme: settings.defaultTheme,
  });
});

export default router;