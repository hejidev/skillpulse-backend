// controllers/userDevice.controller.ts
import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../types/express";

// GET /api/me/devices
export const listMyDevices = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId)
            .select("trustedDevices lastLoginAt lastIP")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Normalize shape for client
        const devices = (user.trustedDevices || []).map((d, index) => ({
            id: `${user._id.toString()}-${d.deviceHash}-${index}`,
            deviceHash: d.deviceHash,
            device: d.device || "Unknown device",
            ip: d.ip || "Unknown IP",
            lastUsed: d.lastUsed,
        }));

        return res.status(200).json({
            success: true,
            devices,
            lastLoginAt: user.lastLoginAt,
            lastIP: user.lastIP,
        });
    } catch (err) {
        console.error("listMyDevices error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to load devices",
        });
    }
};

// POST /api/me/devices/revoke
export const revokeMyDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { deviceHash } = req.body as { deviceHash?: string };

        if (!deviceHash) {
            return res.status(400).json({ success: false, message: "deviceHash is required" });
        }

        const user = await User.findById(req.userId);
        if (!user || !user.trustedDevices) {
            return res.status(404).json({ success: false, message: "User or device not found" });
        }

        const beforeCount = user.trustedDevices.length;
        user.trustedDevices = user.trustedDevices.filter(
            (d: any) => d.deviceHash !== deviceHash
        );

        if (user.trustedDevices.length === beforeCount) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Device revoked",
        });
    } catch (err) {
        console.error("revokeMyDevice error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to revoke device",
        });
    }
};