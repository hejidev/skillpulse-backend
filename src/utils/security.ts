// utils/security.ts
import User from "../models/User";

export async function isTrustedDevice(userId: string, deviceHash?: string) {
  if (!userId || !deviceHash) return false;
  const user = await User.findById(userId)
    .select("trustedDevices.deviceHash")
    .lean();
  if (!user || !user.trustedDevices) return false;
  return user.trustedDevices.some((d: any) => d.deviceHash === deviceHash);
}