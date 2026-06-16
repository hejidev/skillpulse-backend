// middleware/role.middleware.ts
import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "../types/express";

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.role) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!roles.includes(authReq.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };