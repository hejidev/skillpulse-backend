// middleware/loadSystemSettings.ts
import { NextFunction, Response } from "express";
import SystemSettings from "../models/SystemSettings";
import { AuthRequest } from "../types/express";

export const loadSystemSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await SystemSettings.findOne().lean();
    // fallback defaults if no document yet
    (req as any).systemSettings = settings || {};
    next();
  } catch (err) {
    console.error("Failed to load system settings", err);
    next(err);
  }
};