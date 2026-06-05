import Ticket, { TicketMessage } from "../models/Ticket";
import { Response } from "express";
import { io } from "../server";
import { AuthRequest } from "../types/express";
import { generateSupportReply } from "../services/ai-service";
import { logActivity } from "../lib/activity";

/* ================= CREATE TICKET ================= */
export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message, priority, category } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const ticket = await Ticket.create({
      user: req.userId || null,
      name,
      email,
      subject,
      message,
      priority,
      category,

      messages: [
        {
          sender: "user",
          message,
          createdAt: new Date(),
          deliveredAt: new Date(),
        } as TicketMessage,
      ],

      sla: {
        firstResponseAt: null,
        resolvedAt: null,
        breach: false,
      },

      tags: [],
    });

    await logActivity({
  userId: ticket.user?.toString(),

  type: "ticket_created",

  title: "Support Ticket Created",

  description: ticket.subject,

  severity: "warning",
});

    const populatedTicket = await Ticket.findById(ticket._id).populate(
      "user",
      "name email"
    );

    io.emit("ticketCreated", populatedTicket);

    return res.status(201).json({
      success: true,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.log("CREATE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Ticket creation failed",
    });
  }
};

/* ================= USER TICKETS ================= */
export const getUserTickets = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const tickets = await Ticket.find({
      user: req.userId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
};

/* ================= USER REPLY ================= */
export const userReplyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, message } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.messages.push({
      sender: "user",
      message,
      createdAt: new Date(),
      deliveredAt: new Date(),
    } as TicketMessage);

    ticket.status = "open";

    await ticket.save();

    /* ================= AI AUTO REPLY ================= */
    const ai = await generateSupportReply(message);

    ticket.messages.push({
      sender: "admin",
      message: ai.reply,
      createdAt: new Date(),
      deliveredAt: new Date(),
    });

    ticket.status = "pending";

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id).populate(
      "user",
      "name email"
    );

    io.to(`ticket:${ticket._id}`).emit("ticketUpdated", populatedTicket);

    return res.json({
      success: true,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
    });
  }
};

/* ================= GET SINGLE ================= */
export const getTicket = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};

/* ================= ADMIN GET ALL ================= */
export const getAllTickets = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};

/* ================= ADMIN REPLY ================= */
export const replyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, message } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.messages.push({
      sender: "admin",
      message,
      createdAt: new Date(),
      deliveredAt: new Date(),
    } as TicketMessage);

    ticket.status = "pending";

    if (!ticket.sla.firstResponseAt) {
      ticket.sla.firstResponseAt = new Date();
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id).populate(
      "user",
      "name email"
    );

    io.to(`ticket:${ticket._id}`).emit("ticketUpdated", populatedTicket);

    return res.json({
      success: true,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
    });
  }
};

/* ================= RESOLVE ================= */
export const resolveTicket = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { ticketId } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    ticket.status = "resolved";
    ticket.sla.resolvedAt = new Date();

    await ticket.save();

    const populatedTicket = await Ticket.findById(
      ticket._id
    ).populate("user", "name email");

    io.to(`ticket:${ticket._id}`).emit(
      "ticketUpdated",
      populatedTicket
    );

    return res.json({
      success: true,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
};