import { Request, Response } from "express";
import crypto from "crypto";
import { AuthRequest } from "../types/express";
import ApiKey from "../models/ApiKey";
import SecurityLog from "../models/SecurityLog";
import { createAdminNotification } from "../services/admin-notification.service";

// helper to generate secure random key
function generatePlainApiKey(prefix: string = "sk_live"): string {
    const random = crypto.randomBytes(32).toString("base64url"); // long & safe
    return `${prefix}_${random}`;
}

// helper to hash key for storage
function hashApiKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
}

// GET /admin/api-keys
export const listApiKeys = async (req: AuthRequest, res: Response) => {
    try {
        const keys = await ApiKey.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();

        // never send hash or full key
        const items = keys.map((k) => ({
            id: k._id.toString(),
            name: k.name,
            prefix: k.prefix,
            lastFour: k.lastFour,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
            revokedAt: k.revokedAt,
        }));

        return res.json({ items });
    } catch (err) {
        console.error("listApiKeys error:", err);
        return res.status(500).json({ message: "Failed to load API keys" });
    }
};

// POST /admin/api-keys
export const createApiKey = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body as { name?: string };

        const prefix = "sk_test"; // you can change / make env-based
        const plainKey = generatePlainApiKey(prefix);
        const keyHash = hashApiKey(plainKey);
        const lastFour = plainKey.slice(-4);

        const doc = await ApiKey.create({
            userId: req.userId,
            name,
            keyHash,
            prefix,
            lastFour,
        });

        // Optional: log this in SecurityLog
        await SecurityLog.create({
            userId: req.userId!,
            action: "API Key Created",
            severity: "info",
            device: "admin_console",
        });

        // IMPORTANT: return plainKey only once
        return res.json({
            id: doc._id,
            plainKey,
            prefix: doc.prefix,
            lastFour: doc.lastFour,
            createdAt: doc.createdAt,
        });
    } catch (err) {
        console.error("createApiKey error:", err);
        return res.status(500).json({ message: "Failed to create API key" });
    }
};

// POST /admin/api-keys/:id/revoke
export const revokeApiKey = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const key = await ApiKey.findOne({
            _id: id,
            userId: req.userId,
            revokedAt: { $exists: false },
        });

        if (!key) {
            return res.status(404).json({ message: "API key not found or already revoked" });
        }

        key.revokedAt = new Date();
        await key.save();

        await SecurityLog.create({
            userId: req.userId!,
            action: "API Key Revoked",
            severity: "warning",
            device: "admin_console",
        });

        await createAdminNotification({
            title: "Suspicious API activity",
            message: `Multiple failed API key requests detected from IP ${req.ip}.`,
            category: "security",
            severity: "critical",
            roles: ["admin", "super_admin"],  // use roles
            metadata: { ip: req.ip, path: req.path },
        });

        return res.json({ success: true });
    } catch (err) {
        console.error("revokeApiKey error:", err);
        return res.status(500).json({ message: "Failed to revoke API key" });
    }
};

// POST /admin/api-keys/revoke-all
export const revokeAllApiKeys = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const result = await ApiKey.updateMany(
            { userId: req.userId, revokedAt: { $exists: false } },
            { $set: { revokedAt: now } }
        );

        await SecurityLog.create({
            userId: req.userId!,
            action: "All API Keys Revoked",
            severity: "danger",
            device: "admin_console",
        });

        return res.json({
            success: true,
            modified: result.modifiedCount ?? result.matchedCount,
        });
    } catch (err) {
        console.error("revokeAllApiKeys error:", err);
        return res.status(500).json({ message: "Failed to revoke all API keys" });
    }
};