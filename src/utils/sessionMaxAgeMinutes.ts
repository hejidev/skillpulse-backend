import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/express";

export function signAccessToken(payload: any, req: AuthRequest) {
  const settings = (req as any).systemSettings;
  const sessionMinutes = settings?.sessionMaxAgeMinutes ?? 60 * 24; // fallback 1 day

  const expiresIn = sessionMinutes * 60; // seconds

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn,
  });
}