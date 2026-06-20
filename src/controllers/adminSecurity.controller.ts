// controllers/adminSecurity.controller.ts
import { Request, Response } from "express";
import SecurityLog, { ISecurityLog } from "../models/SecurityLog";
import User, { IUser } from "../models/User";
import { buildThreatFeed } from "../lib/intelligence/threat-feed-engine";
import BlockedIp from "../models/BlockedIp";
import { AuthRequest } from "../types/express";
import mongoose from "mongoose";
import AdminSecurityAction from "../models/AdminSecurityAction";

export const getSecurityLogsAdmin = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      userId,
      severity,
      search,
      from,
      to,
      actionType,
    } = req.query as {
      page?: string;
      limit?: string;
      userId?: string;
      severity?: "info" | "warning" | "danger";
      search?: string;
      from?: string;
      to?: string;
      actionType?: string;
    };

    // ✅ add these back
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter: any = {};

    if (userId) filter.userId = userId;
    if (severity) filter.severity = severity;
    if (actionType) filter.action = actionType;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ ip: regex }, { device: regex }, { action: regex }];
    }

    const [logs, total] = await Promise.all([
      SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean<ISecurityLog[]>(),
      SecurityLog.countDocuments(filter),
    ]);

    const userIds: string[] = [
      ...new Set(logs.map((l) => l.userId).filter(Boolean) as string[]),
    ];

    const users = await User.find({ _id: { $in: userIds } })
      .select("name email")
      .lean<IUser[]>();

    const userMap = new Map<string, { name: string; email: string }>();
    users.forEach((u) => {
      userMap.set(u._id.toString(), { name: u.name, email: u.email });
    });

    const formatted = logs.map((log) => {
      const uid = log.userId ?? "";
      const info = uid ? userMap.get(uid) : undefined;

      return {
        id: (log as any)._id.toString(),
        userId: log.userId,
        userName: info?.name || "Unknown user",
        userEmail: info?.email || undefined,
        action: log.action,
        ip: log.ip,
        device: log.device,
        deviceHash: log.deviceHash,
        severity: log.severity,
        createdAt: log.createdAt,
      };
    });

    res.json({
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    });
  } catch (err) {
    console.error("getSecurityLogsAdmin error:", err);
    res.status(500).json({ message: "Failed to load security logs" });
  }
};


export const getThreatFeedAdmin = async (req: Request, res: Response) => {
    try {
        const feed = await buildThreatFeed();
        res.json(feed);
    } catch (err) {
        console.error("getThreatFeedAdmin error:", err);
        res.status(500).json({ message: "Failed to load threat feed" });
    }
};

export const blockIpAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { ip, reason } = req.body as { ip?: string; reason?: string };

        if (!ip) {
            return res.status(400).json({ message: "IP is required" });
        }

        const existing = await BlockedIp.findOne({ ip });
        if (!existing) {
            await AdminSecurityAction.create({
                adminId: new mongoose.Types.ObjectId((req as AuthRequest).userId),
                type: "BLOCK_IP",
                targetIp: ip,
                reason,
            });
        }

        return res.json({ success: true, message: `IP ${ip} blocked` });
    } catch (err) {
        console.error("blockIpAdmin error:", err);
        res.status(500).json({ message: "Failed to block IP" });
    }
};

export const listBlockedIpsAdmin = async (req: Request, res: Response) => {
    try {
        const blocked = await BlockedIp.find().sort({ createdAt: -1 }).lean();
        res.json({ data: blocked });
    } catch (err) {
        console.error("listBlockedIpsAdmin error:", err);
        res.status(500).json({ message: "Failed to load blocked IPs" });
    }
};

export const unblockIpAdmin = async (req: Request, res: Response) => {
    try {
        const { ip } = req.body as { ip?: string };
        if (!ip) return res.status(400).json({ message: "IP is required" });

        await BlockedIp.deleteOne({ ip });

        await AdminSecurityAction.create({
            adminId: new mongoose.Types.ObjectId((req as AuthRequest).userId),
            type: "UNBLOCK_IP",
            targetIp: ip,
        });
        return res.json({ success: true, message: `IP ${ip} unblocked` });
    } catch (err) {
        console.error("unblockIpAdmin error:", err);
        res.status(500).json({ message: "Failed to unblock IP" });
    }
};

export const trustDeviceAdmin = async (req: Request, res: Response) => {
    try {
        const { userId, deviceHash, device, ip } = req.body as {
            userId?: string;
            deviceHash?: string;
            device?: string;
            ip?: string;
        };

        if (!userId || !deviceHash) {
            return res.status(400).json({ message: "userId and deviceHash are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.trustedDevices = user.trustedDevices || [];

        const exists = user.trustedDevices.some((d: any) => d.deviceHash === deviceHash);
        if (!exists) {
            user.trustedDevices.push({
                deviceHash,
                device: device || "unknown device",
                ip: ip || "unknown",
                lastUsed: new Date(),
            });
        }

        await user.save();

        return res.json({
            success: true,
            message: "Device marked as trusted",
        });
    } catch (err) {
        console.error("trustDeviceAdmin error:", err);
        res.status(500).json({ message: "Failed to trust device" });
    }
};

export const listTrustedDevicesAdmin = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ "trustedDevices.0": { $exists: true } })
            .select("name email trustedDevices")
            .lean();

        const devices = users.flatMap((u: any) =>
            (u.trustedDevices || []).map((d: any, index: number) => ({
                id: `${u._id.toString()}-${d.deviceHash}-${index}`, // guaranteed unique
                userId: u._id.toString(),
                userName: u.name,
                userEmail: u.email,
                deviceHash: d.deviceHash,
                ip: d.ip,
                device: d.device,
                lastUsed: d.lastUsed,
            }))
        );

        res.json({ data: devices });
    } catch (err) {
        console.error("listTrustedDevicesAdmin error:", err);
        res.status(500).json({ message: "Failed to load trusted devices" });
    }
};

export const revokeTrustedDeviceAdmin = async (req: Request, res: Response) => {
    try {
        const { userId, deviceHash } = req.body as { userId?: string; deviceHash?: string };
        if (!userId || !deviceHash) {
            return res.status(400).json({ message: "userId and deviceHash are required" });
        }

        const user = await User.findById(userId);
        if (!user || !user.trustedDevices) {
            return res.status(404).json({ message: "User or device not found" });
        }

        user.trustedDevices = user.trustedDevices.filter(
            (d: any) => d.deviceHash !== deviceHash
        );
        
        await user.save();

        return res.json({ success: true, message: "Trusted device revoked" });
    } catch (err) {
        console.error("revokeTrustedDeviceAdmin error:", err);
        res.status(500).json({ message: "Failed to revoke device" });
    }
};