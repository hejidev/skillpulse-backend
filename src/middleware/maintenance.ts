// middleware/maintenance.ts
import { Request, Response, NextFunction } from "express";
import SystemSettings from "../models/SystemSettings";
import { AuthRequest } from "../types/express";

export const maintenanceGate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const settings = await SystemSettings.findOne().lean();
  const maintenance = settings?.maintenanceMode;

  // Allow if not in maintenance
  if (!maintenance) return next();

  // Allow admins even during maintenance
  if (req.role === "admin") return next();

  // Block everyone else
  return res.status(503).json({
    message: "The service is currently under maintenance. Please try again later.",
  });
};