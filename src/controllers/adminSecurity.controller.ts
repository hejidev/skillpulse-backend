import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types/express";

import User from "../models/User";
import SecurityLog, { ISecurityLog } from "../models/SecurityLog";
import AdminSecurityAction from "../models/AdminSecurityAction";
import BlockedIp from "../models/BlockedIp";
import SystemSettings from "../models/SystemSettings";

import { buildThreatFeed } from "../lib/intelligence/threat-feed-engine";
import { processThreatEvent } from "../services/system-alert.service";

/* ===================== HELPERS ===================== */

function getClientIp(req: Request) {
    const raw =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "unknown";
    return raw.replace("::ffff:", "");
}

function getDeviceInfo(req: Request) {
    const ip = getClientIp(req);
    const device = (req.headers["user-agent"] as string) || "unknown device";

    return { ip, device };
}

function generateDeviceHashSafe(ip: string, device: string) {
    const { generateDeviceHash } = require("../utils/device");
    return generateDeviceHash(ip, device);
}

/* ===================== SESSIONS ===================== */

// GET /admin/security/sessions
export const getMySessions = async (req: AuthRequest, res: Response) => {
    try {
        const me = await User.findById(req.userId).lean();
        if (!me) return res.status(404).json({ message: "Admin not found" });

        const { ip, device } = getDeviceInfo(req);
        const currentDeviceHash = generateDeviceHashSafe(ip, device);

        const sessions = (me.trustedDevices || []).map((d: any) => ({
            deviceHash: d.deviceHash,
            device: d.device,
            ip: d.ip,
            lastUsed: d.lastUsed,
            location: d.location || d.ip || "Unknown",
            current: d.deviceHash === currentDeviceHash,
        }));

        return res.json({ sessions, currentIp: ip });
    } catch (err) {
        console.error("getMySessions error:", err);
        return res.status(500).json({ message: "Failed to load sessions" });
    }
};

// POST /admin/security/sessions/logout
export const logoutMySession = async (req: AuthRequest, res: Response) => {
    try {
        const { deviceHash } = req.body as { deviceHash?: string };
        if (!deviceHash) {
            return res.status(400).json({ message: "deviceHash is required" });
        }

        const admin = await User.findById(req.userId);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        admin.trustedDevices = (admin.trustedDevices || []).filter(
            (d: any) => d.deviceHash !== deviceHash
        );
        await admin.save();

        await SecurityLog.create({
            userId: req.userId!,
            action: "Admin Session Revoked",
            deviceHash,
            severity: "warning",
        });

        await AdminSecurityAction.create({
            adminId: req.userId,
            type: "REVOKE_DEVICE",
            targetDeviceHash: deviceHash,
            reason: "self_logout",
        });

        return res.json({ success: true, message: "Device logged out" });
    } catch (err) {
        console.error("logoutMySession error:", err);
        return res.status(500).json({ message: "Failed to logout device" });
    }
};

// POST /admin/security/sessions/logout-all
export const logoutMySessionsEverywhere = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        admin.tokenVersion = (admin.tokenVersion || 0) + 1;
        admin.trustedDevices = [];
        await admin.save();

        await SecurityLog.create({
            userId: req.userId!,
            action: "Admin Logout All Devices",
            severity: "danger",
        });

        await AdminSecurityAction.create({
            adminId: req.userId,
            type: "REVOKE_DEVICE",
            reason: "logout_all_self",
        });

        return res.json({
            success: true,
            message: "All sessions revoked for current admin",
        });
    } catch (err) {
        console.error("logoutMySessionsEverywhere error:", err);
        return res.status(500).json({ message: "Failed to logout all sessions" });
    }
};

// POST /admin/security/force-logout-all
export const forceLogoutAllUsers = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const result = await User.updateMany({}, { $inc: { tokenVersion: 1 } });
        const affectedUsers = result.modifiedCount ?? result.matchedCount;

        await AdminSecurityAction.create({
            adminId: req.userId,
            type: "REVOKE_DEVICE",
            reason: "global_force_logout",
        });

        await SecurityLog.create({
            userId: req.userId!,
            action: "Admin Force Logout All Users",
            severity: "danger",
        });

        return res.json({ success: true, affectedUsers });
    } catch (err) {
        console.error("forceLogoutAllUsers error:", err);
        return res.status(500).json({ message: "Failed to force logout all users" });
    }
};

/* ===================== MFA ===================== */

// GET /admin/security/mfa-stats
export const getMfaStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({});
        const usersWith2FA = await User.countDocuments({ twoFactorEnabled: true });

        const adminsTotal = await User.countDocuments({
            role: { $in: ["admin", "super_admin"] },
        });

        const adminsWith2FA = await User.countDocuments({
            role: { $in: ["admin", "super_admin"] },
            twoFactorEnabled: true,
        });

        const settings = (req as any).systemSettings;
        const enforced = Boolean(settings?.enforce2FA);

        return res.json({
            totalUsers,
            usersWith2FA,
            usersWithout2FA: totalUsers - usersWith2FA,
            adminsWith2FA,
            adminsWithout2FA: adminsTotal - adminsWith2FA,
            enforced,
        });
    } catch (err) {
        console.error("getMfaStats error:", err);
        return res.status(500).json({ message: "Failed to load MFA stats" });
    }
};

// GET /admin/security/mfa-status
export const getMyMfaStatus = async (req: AuthRequest, res: Response) => {
    try {
        const me = await User.findById(req.userId);
        if (!me) return res.status(404).json({ message: "Admin not found" });

        // in getMyMfaStatus response:
        return res.json({
            twoFactorEnabled: me.twoFactorEnabled ?? false,
            hasBackupCodes: Array.isArray(me.twoFactorBackupCodes)
                ? me.twoFactorBackupCodes.length > 0
                : false,
            backupCodesCount: Array.isArray(me.twoFactorBackupCodes)
                ? me.twoFactorBackupCodes.length
                : 0,
            recoveryEmail: me.email, // or separate field
            recoveryPhone: me.profilePhoneMasked, // if you have one
            lastUpdatedAt: me.updatedAt,
        });
    } catch (err) {
        console.error("getMyMfaStatus error:", err);
        return res.status(500).json({ message: "Failed to load MFA status" });
    }
};

/* ===================== LOGS & THREAT FEED ===================== */

// GET /admin/security/logs
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
            .lean();

        const userMap = new Map<string, { name: string; email: string }>();
        users.forEach((u: any) => {
            userMap.set(u._id.toString(), { name: u.name, email: u.email });
        });

        const formatted = logs.map((log: any) => {
            const uid = log.userId ?? "";
            const info = uid ? userMap.get(uid) : undefined;

            return {
                id: log._id.toString(),
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

        return res.json({
            data: formatted,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
            },
        });
    } catch (err) {
        console.error("getSecurityLogsAdmin error:", err);
        return res.status(500).json({ message: "Failed to load security logs" });
    }
};

// GET /admin/security/threat-feed
export const getThreatFeedAdmin = async (_req: Request, res: Response) => {
    try {
        const feed = await buildThreatFeed();
        return res.json(feed);
    } catch (err) {
        console.error("getThreatFeedAdmin error:", err);
        return res.status(500).json({ message: "Failed to load threat feed" });
    }
};

/* ===================== BLOCKED IPS ===================== */

// POST /admin/security/actions/block-ip
export const blockIp = async (req: AuthRequest, res: Response) => {
    try {
        const { ip, reason } = req.body as { ip?: string; reason?: string };
        if (!ip) return res.status(400).json({ message: "IP is required" });

        const existing = await BlockedIp.findOne({ ip });
        if (!existing) {
            await BlockedIp.create({
                ip,
                reason,
                createdBy: req.userId,
            });
        }

        const action = await AdminSecurityAction.create({
            adminId: new mongoose.Types.ObjectId(req.userId),
            type: "BLOCK_IP",
            targetIp: ip,
            reason,
        });

        await SecurityLog.create({
            userId: req.userId!,
            ip,
            action: "IP Blocked",
            severity: "danger",
        });

        return res.json({ success: true, actionId: action._id, ip });
    } catch (err) {
        console.error("blockIp error:", err);
        return res.status(500).json({ message: "Failed to block IP" });
    }
};

// GET /admin/security/blocked-ips
export const listBlockedIpsAdmin = async (req: Request, res: Response) => {
    try {
        const blocked = await BlockedIp.find().sort({ createdAt: -1 }).lean();
        return res.json({ data: blocked });
    } catch (err) {
        console.error("listBlockedIpsAdmin error:", err);
        return res.status(500).json({ message: "Failed to load blocked IPs" });
    }
};

// POST /admin/security/actions/unblock-ip
export const unblockIp = async (req: AuthRequest, res: Response) => {
    try {
        const { ip, reason } = req.body as { ip?: string; reason?: string };
        if (!ip) return res.status(400).json({ message: "IP is required" });

        await BlockedIp.deleteOne({ ip });

        const action = await AdminSecurityAction.create({
            adminId: new mongoose.Types.ObjectId(req.userId),
            type: "UNBLOCK_IP",
            targetIp: ip,
            reason,
        });

        await SecurityLog.create({
            userId: req.userId!,
            ip,
            action: "IP Unblocked",
            severity: "warning",
        });

        return res.json({ success: true, actionId: action._id, ip });
    } catch (err) {
        console.error("unblockIp error:", err);
        return res.status(500).json({ message: "Failed to unblock IP" });
    }
};

/* ===================== TRUSTED DEVICES ===================== */

// POST /admin/security/actions/trust-device
export const trustDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, deviceHash, device, ip, reason } = req.body as {
            userId?: string;
            deviceHash?: string;
            device?: string;
            ip?: string;
            reason?: string;
        };

        if (!userId || !deviceHash) {
            return res.status(400).json({ message: "userId and deviceHash required" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.trustedDevices = user.trustedDevices || [];
        const exists = user.trustedDevices.some(
            (d: any) => d.deviceHash === deviceHash
        );

        if (!exists) {
            user.trustedDevices.push({
                deviceHash,
                device: device || "Admin trusted device",
                ip: ip || "Unknown",
                lastUsed: new Date(),
            });
        }

        await user.save();

        const action = await AdminSecurityAction.create({
            adminId: req.userId,
            type: "TRUST_DEVICE",
            targetUserId: user._id,
            targetDeviceHash: deviceHash,
            reason,
        });

        await SecurityLog.create({
            userId: user._id.toString(),
            action: "Device Trusted (Admin)",
            deviceHash,
            severity: "info",
        });

        return res.json({
            success: true,
            actionId: action._id,
            userId: user._id,
            deviceHash,
        });
    } catch (err) {
        console.error("trustDevice error:", err);
        return res.status(500).json({ message: "Failed to trust device" });
    }
};

// GET /admin/security/trusted-devices
export const listTrustedDevicesAdmin = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ "trustedDevices.0": { $exists: true } })
            .select("name email trustedDevices")
            .lean();

        const devices = users.flatMap((u: any) =>
            (u.trustedDevices || []).map((d: any, index: number) => ({
                id: `${u._id.toString()}-${d.deviceHash}-${index}`,
                userId: u._id.toString(),
                userName: u.name,
                userEmail: u.email,
                deviceHash: d.deviceHash,
                ip: d.ip,
                device: d.device,
                lastUsed: d.lastUsed,
            }))
        );

        return res.json({ data: devices });
    } catch (err) {
        console.error("listTrustedDevicesAdmin error:", err);
        return res.status(500).json({ message: "Failed to load trusted devices" });
    }
};

// POST /admin/security/actions/revoke-device
export const revokeDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, deviceHash, reason } = req.body as {
            userId?: string;
            deviceHash?: string;
            reason?: string;
        };

        if (!userId || !deviceHash) {
            return res.status(400).json({ message: "userId and deviceHash required" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { trustedDevices: { deviceHash } } },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        const action = await AdminSecurityAction.create({
            adminId: req.userId,
            type: "REVOKE_DEVICE",
            targetUserId: user._id,
            targetDeviceHash: deviceHash,
            reason,
        });

        await SecurityLog.create({
            userId: user._id.toString(),
            action: "Trusted Device Revoked",
            deviceHash,
            severity: "warning",
        });

        return res.json({
            success: true,
            actionId: action._id,
            userId: user._id,
            deviceHash,
        });
    } catch (err) {
        console.error("revokeDevice error:", err);
        return res.status(500).json({ message: "Failed to revoke device" });
    }
};

/* ===================== USER ISOLATION / LOCKDOWN ===================== */

// POST /admin/security/actions/isolate-user
export const isolateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, reason } = req.body as { userId?: string; reason?: string };
        if (!userId) return res.status(400).json({ message: "userId is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.status = "suspended";
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.securityFlags = user.securityFlags || [];
        if (!user.securityFlags.includes("isolated_by_admin")) {
            user.securityFlags.push("isolated_by_admin");
        }

        await user.save();

        const action = await AdminSecurityAction.create({
            adminId: req.userId,
            type: "REVOKE_DEVICE",
            targetUserId: user._id,
            reason: reason || "isolated_by_admin",
        });

        await SecurityLog.create({
            userId: user._id.toString(),
            action: "User Isolated by Admin",
            severity: "danger",
        });

        return res.json({ success: true, actionId: action._id, userId: user._id });
    } catch (err) {
        console.error("isolateUser error:", err);
        return res.status(500).json({ message: "Failed to isolate user" });
    }
};

// POST /admin/security/actions/emergency-lockdown
export const emergencyLockdown = async (req: AuthRequest, res: Response) => {
  try {
    const { scope = "global", reason } = req.body as {
      scope?: string;
      reason?: string;
    };

    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { maintenanceMode: true, lockdownScope: scope },
      { new: true, upsert: true }
    );

    const action = await AdminSecurityAction.create({
      adminId: req.userId,
      type: "EMERGENCY_LOCKDOWN",
      reason: reason || "emergency_lockdown",
    });

    await SecurityLog.create({
      userId: req.userId!,
      action: "Emergency Lockdown Activated",
      severity: "danger",
    });

    try {
      await processThreatEvent({
        type: "system_error",
        severity: "critical",
        metadata: { scope, reason, adminId: req.userId },
      });
    } catch (e) {
      console.error("processThreatEvent error:", e);
    }

    return res.json({
      success: true,
      status: "activated",
      scope,
      settings,
      actionId: action._id,
    });
  } catch (err: any) {
    console.error("emergencyLockdown error:", err?.message, err?.stack);
    return res.status(500).json({ message: "Failed to activate lockdown" });
  }
};

/* ===================== AUDIT TRAIL ===================== */

// GET /admin/security/actions
export const listAdminSecurityActions = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { limit = 50, page = 1, type, targetUserId, targetIp } = req.query as {
            limit?: string | number;
            page?: string | number;
            type?: string;
            targetUserId?: string;
            targetIp?: string;
        };

        const q: any = {};
        if (type) q.type = type;
        if (targetUserId) q.targetUserId = targetUserId;
        if (targetIp) q.targetIp = targetIp;

        const take = Math.min(Number(limit) || 50, 200);
        const skip = (Number(page) - 1 || 0) * take;

        const [items, total] = await Promise.all([
            AdminSecurityAction.find(q)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .lean(),
            AdminSecurityAction.countDocuments(q),
        ]);

        return res.json({ items, total });
    } catch (err) {
        console.error("listAdminSecurityActions error:", err);
        return res.status(500).json({ message: "Failed to load admin actions" });
    }
};

// GET /admin/security/login-history
export const getMyLoginHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { limit = 10 } = req.query;
        const take = Math.min(Number(limit) || 10, 50);

        // Assuming SecurityLog entries exist for login events
        const logs = await SecurityLog.find({
            userId: req.userId,
            action: { $in: ["Login", "Failed Login", "New Device Login"] },
        })
            .sort({ createdAt: -1 })
            .limit(take)
            .lean();

        const formatted = logs.map((l) => ({
            event:
                l.action === "New Device Login"
                    ? "New Device Login"
                    : l.action === "Failed Login"
                        ? "Failed Login Attempt"
                        : "Successful Login",
            ip: l.ip || "Unknown",
            createdAt: l.createdAt,
            status: l.severity === "danger" || l.severity === "warning" ? "warning" : "safe",
        }));

        return res.json({ items: formatted });
    } catch (err) {
        console.error("getMyLoginHistory error:", err);
        return res.status(500).json({ message: "Failed to load login history" });
    }
};

// GET /admin/security/risk-overview
export const getRiskOverview = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({});
        const highRiskUsers = await User.countDocuments({ riskScore: { $gte: 70 } });
        const blockedIpCount = await BlockedIp.countDocuments({});

        // very simple dummy metrics for now
        const accountSecurityRisk = Math.min(
            100,
            Math.round((highRiskUsers / Math.max(totalUsers, 1)) * 100)
        );
        const networkExposure = Math.min(100, blockedIpCount * 2);
        const apiAbuseLevel = 40; // placeholder, plug in from rate-limit metrics
        const deviceTrustScore = 100 - accountSecurityRisk;

        return res.json({
            accountSecurityRisk,
            networkExposure,
            apiAbuseLevel,
            deviceTrustScore,
        });
    } catch (err) {
        console.error("getRiskOverview error:", err);
        return res.status(500).json({ message: "Failed to load risk overview" });
    }
};