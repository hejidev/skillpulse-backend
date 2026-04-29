import { Request, Response, NextFunction } from "express";

const sanitize = (obj: any) => {
  if (!obj || typeof obj !== "object") return;

  for (const key in obj) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key]; // prevent NoSQL injection
    } else if (typeof obj[key] === "object") {
      sanitize(obj[key]);
    }
  }
};

export const sanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  sanitize(req.body);

  // ⚠️ DO NOT TOUCH req.query DIRECTLY
  // Instead clone it safely if needed

  next();
};