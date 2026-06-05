import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";

export const requireRole =
  (...roles: string[]) =>
  (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.role) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };