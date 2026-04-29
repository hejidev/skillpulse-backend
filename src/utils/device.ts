import crypto from "crypto";

export const generateDeviceHash = (ip: string, userAgent: string) => {
  return crypto
    .createHash("sha256")
    .update(`${ip}-${userAgent}`)
    .digest("hex");
};