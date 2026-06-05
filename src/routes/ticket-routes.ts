import express from "express";
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  replyTicket,
  resolveTicket,
  getTicket,
  userReplyTicket,
} from "../controllers/ticket-controller";

import { isAuth, adminOnly, isAuthOptional } from "../middleware/auth-middleware";

const router = express.Router();

router.post("/create", isAuthOptional, createTicket);
router.get("/my-tickets", isAuth, getUserTickets);
router.post(
  "/user-reply",
  isAuth,
  userReplyTicket
);

// admin
router.get("/all", isAuth, adminOnly, getAllTickets);
router.get("/:id", isAuth, adminOnly, getTicket);
router.post("/reply", isAuth, adminOnly, replyTicket);
router.post("/resolve", isAuth, adminOnly, resolveTicket);

export default router;