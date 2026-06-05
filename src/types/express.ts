import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  name?: string;
  role?: string;

  file?: Express.Multer.File;
}