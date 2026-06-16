// middleware/auth-middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";
import { verifyAccessToken } from "../utils/tokens";

type JwtPayload = {
  userId: string;
  role: string;
  tokenVersion: number;
};

export const isAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });

    }
    
    const token = header.split(" ")[1];
    
    const decoded = verifyAccessToken(token) as JwtPayload;
    
    console.log("Auth header:", req.headers.authorization);
    
    const user = await User.findById(decoded.userId).select("+tokenVersion");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    req.userId = user._id.toString();
    req.name = user.name;
    req.role = user.role;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.role || req.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};

export const isAuthOptional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (user) {
      req.userId = user._id.toString();
      req.name = user.name;
      req.role = user.role;
    }

    next();
  } catch (error) {
    next();
  }
};