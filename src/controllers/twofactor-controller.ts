// controllers/twofactor-controller.ts
import { Response } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";

import speakeasy from "speakeasy";
import QRCode from "qrcode";

// GET current 2FA status (optional, you already fetch via /settings/me)
export const getTwoFactorStatus = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId).select(
        "twoFactorEnabled twoFactorBackupCodes"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
        twoFactorEnabled: user.twoFactorEnabled,
        backupCodesCount: user.twoFactorBackupCodes?.length || 0,
    });
};

// POST /settings/2fa/start
export const startTwoFactorSetup = async (
    req: AuthRequest,
    res: Response
) => {
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    const appName = process.env.APP_NAME || "SkillPulse";

    // -----------------------------------
    // Already started setup?
    // Reuse existing secret.
    // -----------------------------------

    if (user.twoFactorTempSecret) {
        const otpauth = speakeasy.otpauthURL({
            secret: user.twoFactorTempSecret,
            label: user.email,
            issuer: appName,
            encoding: "base32",
        });

        const qrDataUrl = await QRCode.toDataURL(otpauth);

        return res.json({
            qrDataUrl,
            secret: user.twoFactorTempSecret,
        });
    }

    // -----------------------------------
    // First time setup
    // -----------------------------------

    const secret = speakeasy.generateSecret({
        name: `${appName} (${user.email})`,
    });

    user.twoFactorTempSecret = secret.base32;

    await user.save();

    // const qrDataUrl = await QRCode.toDataURL(
    //     secret.otpauth_url || ""
    // );

    const otpauth = speakeasy.otpauthURL({
        secret: secret.base32,
        label: user.email,
        issuer: appName,
        encoding: "base32",
    });

    const qrDataUrl = await QRCode.toDataURL(otpauth);

    console.log(otpauth);

    console.log("NEW SECRET:", secret.base32);

    return res.json({
        qrDataUrl,
        secret: secret.base32,
    });
};

// POST /settings/2fa/confirm
export const confirmTwoFactorSetup = async (req: AuthRequest, res: Response) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Code is required" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.twoFactorTempSecret) {
        return res.status(400).json({ message: "No 2FA setup in progress" });
    }

    console.log({
        dbSecret: user.twoFactorTempSecret,
        tempSecret: user.twoFactorTempSecret,
        enteredCode: code,
        currentToken: speakeasy.totp({
            secret: user.twoFactorTempSecret,
            encoding: "base32",
        }),
    });

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorTempSecret,
        encoding: "base32",
        token: code.trim().replace(/\s/g, ""),
        window: 2,
    });

    console.log("2FA CONFIRM RESULT", { isValid });

    if (!isValid) {
        return res.status(400).json({ message: "Invalid 2FA code" });
    }


    // promote temp secret to active
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;

    // in confirmTwoFactorSetup
    console.log("2FA CONFIRM", {
        userId: user._id.toString(),
        email: user.email,
        tempSecret: user.twoFactorTempSecret,
        code,
    });

    // optional: generate backup codes here
    // user.twoFactorBackupCodes = generateBackupCodes(10);
    await user.save();

    return res.json({ success: true, message: "Two-factor enabled." });
};

// POST /settings/2fa/disable
export const disableTwoFactor = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    user.twoFactorBackupCodes = [];

    await user.save();

    return res.json({ success: true, message: "Two-factor disabled." });
};