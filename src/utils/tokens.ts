// utils/tokens.ts
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/express";
import User from "../models/User";

type AccessPayload = {
  userId: string;
  role: string;
  tokenVersion: number;
};

const getJwtSecrets = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error("❌ JWT ENV ERROR:", { JWT_SECRET, JWT_REFRESH_SECRET });
    throw new Error("JWT secrets missing");
  }
  return { JWT_SECRET, JWT_REFRESH_SECRET };
};

export const signAccessToken = (payload: AccessPayload, req: AuthRequest) => {
  const { JWT_SECRET } = getJwtSecrets();
  const settings = (req as any).systemSettings;
  const sessionMinutes = settings?.sessionMaxAgeMinutes ?? 60 * 24; // default 1 day

  const expiresInSeconds = sessionMinutes * 60;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresInSeconds,
  });
};

export const signRefreshToken = (userId: string) => {
  const { JWT_REFRESH_SECRET } = getJwtSecrets();
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  const { JWT_SECRET } = getJwtSecrets();
  return jwt.verify(token, JWT_SECRET) as AccessPayload;
};

export const verifyRefreshToken = (token: string) => {
  const { JWT_REFRESH_SECRET } = getJwtSecrets();
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
};

/**
 * Rotate JWT tokens using tokenVersion when jwtRotationEnabled is true.
 * Called from a /refresh endpoint.
 */
export const rotateTokens = async (
  req: AuthRequest,
  userId: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const settings = (req as any).systemSettings;
  const user = await User.findById(userId).select("+tokenVersion");
  if (!user) {
    throw new Error("User not found for rotation");
  }

  if (settings?.jwtRotationEnabled) {
    user.tokenVersion += 1;
    await user.save();
  }

  const accessToken = signAccessToken(
    {
      userId: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    req
  );

  const refreshToken = signRefreshToken(user._id.toString());

  return { accessToken, refreshToken };
};