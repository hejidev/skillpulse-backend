import { Request, Response } from "express";

import User from "../models/User";
import Ticket from "../models/Ticket";
import SecurityLog from "../models/SecurityLog";

/* =========================================
   GET FULL ANALYTICS
========================================= */
export const getAnalyticsDashboard = async (
  req: Request,
  res: Response
) => {
  try {

    /* ================= USERS ================= */
    const totalUsers =
      await User.countDocuments();

    const onlineUsers =
      await User.countDocuments({
        isOnline: true,
      });

    const activeUsers =
      await User.countDocuments({
        status: "active",
      });

    const suspendedUsers =
      await User.countDocuments({
        status: "suspended",
      });

    /* ================= TICKETS ================= */
    const totalTickets =
      await Ticket.countDocuments();

    const resolvedTickets =
      await Ticket.countDocuments({
        status: "resolved",
      });

    const openTickets =
      await Ticket.countDocuments({
        status: "open",
      });

    const pendingTickets =
      await Ticket.countDocuments({
        status: "pending",
      });

    /* ================= SECURITY ================= */
    const riskyUsers =
      await User.countDocuments({
        riskScore: { $gte: 70 },
      });

    const warningLogs =
      await SecurityLog.countDocuments({
        severity: "warning",
      });

    /* ================= CATEGORY BREAKDOWN ================= */
    const rawCategories =
      await Ticket.aggregate([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
          },
        },
      ]);

    const categoryStats =
      rawCategories.map((cat) => ({
        _id: cat._id,
        total:
          totalTickets > 0
            ? Math.round(
                (cat.total / totalTickets) * 100
              )
            : 0,
      }));

    /* ================= DAILY TRENDS ================= */
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);

    const ticketsToday =
      await Ticket.countDocuments({
        createdAt: { $gte: startOfDay },
      });

    const ticketsThisWeek =
      await Ticket.countDocuments({
        createdAt: { $gte: weekAgo },
      });

    const ticketsThisMonth =
      await Ticket.countDocuments({
        createdAt: { $gte: monthAgo },
      });

    /* ================= SLA ================= */
    const slaResolved =
      totalTickets > 0
        ? Math.round(
            (resolvedTickets / totalTickets) * 100
          )
        : 0;

    /* ================= SYSTEM HEALTH ================= */
    const apiPerformance = Math.max(
      100 - warningLogs,
      65
    );

    const databaseLoad = Math.min(
      Math.round((openTickets / 50) * 100),
      100
    );

    const serverUptime = 99;

    /* ================= AI INSIGHTS ================= */
    const aiInsights = [
      `${openTickets} open tickets currently require attention`,
      `${resolvedTickets} tickets resolved successfully`,
      `${onlineUsers} users currently online`,
      `${warningLogs} security warnings detected`,
    ];

    /* ================= PERFORMANCE SUMMARY ================= */
    const performance = {
      responseImprovement: 14,
      aiAccuracy: 87,
      backlogReduction: 22,
      securityStatus:
        warningLogs > 10
          ? "Warnings Detected"
          : "Stable",
    };

    res.json({
      success: true,

      analytics: {

        users: {
          totalUsers,
          onlineUsers,
          activeUsers,
          suspendedUsers,
        },

        tickets: {
          totalTickets,
          resolvedTickets,
          openTickets,
          pendingTickets,
        },

        security: {
          riskyUsers,
          warningLogs,
        },

        trends: {
          today: ticketsToday,
          week: ticketsThisWeek,
          month: ticketsThisMonth,
        },

        sla: {
          compliance: slaResolved,
        },

        categories: categoryStats,

        systemHealth: {
          apiPerformance,
          databaseLoad,
          serverUptime,
        },

        aiInsights,

        performance,
      },
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Analytics failed",
    });

  }
};