// controllers/admin-subscriber-controller.ts
import { Request, Response } from "express";
import Subscriber from "../models/Subscriber";

export const listSubscribers = async (req: Request, res: Response) => {
  const { status, q, page = "1", limit = "20" } = req.query;

  const filter: any = {};
  if (status) filter.status = status;
  if (q && typeof q === "string") {
    filter.email = { $regex: q.trim(), $options: "i" };
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const perPage = parseInt(limit as string, 10) || 20;

  const [subs, total] = await Promise.all([
    Subscriber.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .select("-verificationToken"),
    Subscriber.countDocuments(filter),
  ]);

  return res.json({
    subscribers: subs,
    total,
    page: pageNum,
    pages: Math.ceil(total / perPage),
  });
};

export const updateSubscriberStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: "confirmed" | "unsubscribed" };

  if (!["confirmed", "unsubscribed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const sub = await Subscriber.findById(id);
  if (!sub) return res.status(404).json({ message: "Subscriber not found" });

  sub.status = status;
  if (status === "unsubscribed") sub.unsubscribedAt = new Date();
  await sub.save();

  return res.json({ success: true, subscriber: sub });
};

// controllers/admin-subscriber-controller.ts
export const exportSubscribersCsv = async (req: Request, res: Response) => {
  const { status } = req.query;

  const filter: any = {};
  if (status && typeof status === "string") {
    // only allow known statuses
    if (["confirmed", "unsubscribed", "pending"].includes(status)) {
      filter.status = status;
    }
  }

  const subs = await Subscriber.find(filter).sort({ createdAt: -1 });

  const header = "email,name,source,status,createdAt,lastEmailAt\n";
  const rows = subs
    .map((s) => {
      const createdAt =
        s.createdAt instanceof Date ? s.createdAt.toISOString() : "";
      const lastEmailAt =
        s.lastEmailAt instanceof Date ? s.lastEmailAt.toISOString() : "";
      return `${s.email},${s.name || ""},${s.source},${s.status},${createdAt},${lastEmailAt}`;
    })
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="subscribers.csv"'
  );
  res.send(header + rows);
};