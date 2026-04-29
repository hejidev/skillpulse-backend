import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  role?: "user" | "admin";
}