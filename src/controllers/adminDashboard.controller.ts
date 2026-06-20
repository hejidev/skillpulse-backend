// controllers/adminDashboard.controller.ts
import { Request, Response } from "express";
import User from "../models/User";
import Ticket from "../models/Ticket";
import Activity from "../models/Activity";
import BillingEvent from "../models/BillingEvent";
import SystemSettings from "../models/SystemSettings";

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        const [
            totalUsers,
            activeUsersToday,
            totalTickets,
            openTickets,
            pendingTickets,
            resolvedTickets,
            highUrgentTickets,
            lastActivities,
            recentBillingEvents,
            settings,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({
                lastActiveDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            Ticket.countDocuments({}),
            Ticket.countDocuments({ status: "open" }),
            Ticket.countDocuments({ status: "pending" }),
            Ticket.countDocuments({ status: "resolved" }),
            Ticket.countDocuments({ priority: { $in: ["high", "urgent"] }, status: { $in: ["open", "pending"] } }),
            Activity.find({})
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            BillingEvent.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            SystemSettings.findOne({}).lean(),
        ]);

        const insights: { title: string; description: string }[] = [];

        // Example 1: ticket spike
        if (highUrgentTickets > 0) {
            insights.push({
                title: "High priority load",
                description: `${highUrgentTickets} high/urgent tickets awaiting action`,
            });
        }

        // Example 2: maintenance & alerts
        if (settings?.maintenanceMode) {
            insights.push({
                title: "Maintenance active",
                description: "New deployments are blocked while maintenance mode is ON",
            });
        }

        // Example 3: billing signal
        if (recentBillingEvents.length > 0) {
            const upgrades = recentBillingEvents.filter(e => e.reason === "user_upgrade").length;
            if (upgrades > 0) {
                insights.push({
                    title: "Plan upgrades",
                    description: `${upgrades} users upgraded their plan recently`,
                });
            }
        }

        // simple ticket SLA / health approximation
        const ticketHealth = {
            totalTickets,
            openTickets,
            pendingTickets,
            resolvedTickets,
            highUrgentTickets,
        };

        // quick system alerts count from Activity severity
        const systemAlertsCount = await Activity.countDocuments({
            severity: { $in: ["warning", "danger"] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        // after ticketHealth
        const apiPerformance = totalTickets === 0
            ? 100
            : Math.max(30, 100 - (openTickets + pendingTickets) * 2);

        const dbLoad = Math.min(100, Math.round(totalUsers / 10 + totalTickets / 5));

        const health = {
            apiPerformance,
            dbLoad,
            uptime: 99, // until you have a real metric
        };

        const priorityQueue = await Ticket.find({
            status: { $in: ["open", "pending"] },
            priority: { $in: ["high", "urgent"] },
        })
            .sort({ priority: -1, createdAt: 1 }) // urgent first, oldest first
            .limit(5)
            .select("subject priority")
            .lean();

        return res.json({
            kpis: {
                totalUsers,
                activeUsersToday,
                activeTickets: openTickets + pendingTickets,
                resolvedCases: resolvedTickets,
                systemAlerts: systemAlertsCount,
            },
            tickets: ticketHealth,
            activities: lastActivities,
            billingEvents: recentBillingEvents,
            systemSettings: settings,
            insights,
            health,
            priorityQueue,
        });
    } catch (err) {
        console.error("getAdminDashboardStats error:", err);
        return res.status(500).json({ message: "Failed to load admin dashboard stats" });
    }
};