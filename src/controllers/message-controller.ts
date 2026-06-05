import Message from "../models/Message";
import User from "../models/User";
import { io } from "../server";
import { SOCKET_EVENTS } from "../constants/roles";


/* ==================================================
   CREATE BROADCAST
================================================== */
export const createBroadcast = async (
    req: any,
    res: any
) => {
    try {
        const {
            title,
            content,
            priority,
            segment,
            scheduledFor,
        } = req.body;

        let query: any = {};

        /* =====================================
           SEGMENT FILTER
        ===================================== */
        if (segment === "users") {
            query = {
                role: "user",
            };
        }

        if (segment === "admins") {
            query = {
                role: {
                    $in: ["admin", "super_admin"],
                },
            };
        }

        if (segment === "premium") {
            query = {
                role: "user",
                premium: true,
            };
        }

        const isScheduled =
            scheduledFor &&
            new Date(scheduledFor) > new Date();

        const users =
            segment === "all"
                ? await User.find({}, "_id")
                : await User.find(query, "_id");

        /* =====================================
           CREATE MESSAGE
        ===================================== */
        const message = await Message.create({
            title,
            content,
            type: "broadcast",
            priority,

            sender: {
                id: req.userId,
                role: req.role,
            },

            recipients: {
                segment,
                userIds: users.map(
                    (u: any) => u._id.toString()
                ),
            },

            status: isScheduled
                ? "scheduled"
                : "pending",

            category: isScheduled
                ? "scheduled"
                : "broadcast",

            scheduledFor: isScheduled
                ? new Date(scheduledFor)
                : undefined,

            deliveryStats: {
                sent: 0,
                delivered: 0,
                failed: 0,
                opened: 0,
                clicked: 0,
            },
        });

        if (isScheduled) {

            await message.save();

            io.to("admin-messages").emit(
                SOCKET_EVENTS.ADMIN_BROADCAST,
                message
            );

            return res.status(201).json({
                success: true,
                message,
            });
        }

        let sent = 0;
        let delivered = 0;
        let failed = 0;

        /* =====================================
           SOCKET DELIVERY
        ===================================== */
        const deliveryPromises = users.map(
            (user: any) => {
                return new Promise<void>((resolve) => {

                    const userId =
                        user._id.toString();

                    sent++;

                    let resolved = false;

                    const timeout = setTimeout(() => {

                        if (!resolved) {

                            failed++;

                            resolved = true;

                            resolve();
                        }

                    }, 5000);

                    io.timeout(5000)
                        .to(userId).emit(
                            SOCKET_EVENTS.USER_MESSAGE,
                            message,
                            (err: any, responses: any[]) => {

                                if (resolved) return;

                                clearTimeout(timeout);

                                if (
                                    !err &&
                                    responses?.length > 0
                                ) {

                                    delivered++;

                                } else {

                                    failed++;
                                }

                                resolved = true;

                                resolve();
                            }
                        );
                });
            }
        );

        await Promise.all(
            deliveryPromises
        );

        /* =====================================
           FINAL STATUS
        ===================================== */
        message.deliveryStats = {
            sent,
            delivered,
            failed,
            opened: 0,
            clicked: 0,
        };

        if (delivered > 0) {
            message.status = "sent";
            message.deliveredAt =
                new Date();
        } else if (
            failed === sent
        ) {
            message.status = "failed";
            message.failedReason =
                "All deliveries failed";
        } else {
            message.status = "pending";
        }

        await message.save();

        /* =====================================
           ADMIN LIVE FEED
        ===================================== */
        io.to("admin-messages").emit(
            SOCKET_EVENTS.ADMIN_BROADCAST,
            message
        );

        return res.status(201).json({
            success: true,
            message,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            error: "Broadcast failed",
        });
    }
};

/* ==================================================
   GET MESSAGES
================================================== */
export const getMessages =
    async (req: any, res: any) => {

        try {

            const {
                category,
            } = req.query;

            const query: any = {};

            if (category) {
                query.category = category;
            }

            const messages =
                await Message.find(query)
                    .sort({
                        createdAt: -1,
                    })
                    .limit(100);

            return res.json({
                success: true,
                messages,
            });

        } catch (err) {

            return res.status(500).json({
                success: false,
            });
        }
    };

/* ==================================================
   REPLY MESSAGE
================================================== */
export const replyMessage = async (
    req: any,
    res: any
) => {
    try {

        const {
            messageId,
            content,
        } = req.body;

        const parentMessage =
            await Message.findById(messageId);

        if (!parentMessage) {
            return res.status(404).json({
                success: false,
                error: "Parent message not found",
            });
        }

        const reply =
            await Message.create({
                title: "Reply",
                content,

                type: "ticket_reply",

                category: "inbox",

                priority:
                    parentMessage.priority || "medium",

                parentMessageId: messageId,

                sender: {
                    id: req.userId,
                    role: req.role,
                },

                recipients: {
                    segment: "users",
                    userIds:
                        parentMessage.recipients.userIds || [],
                },

                status: "sent",

                deliveryStats: {
                    sent: 0,
                    delivered: 0,
                    failed: 0,
                    opened: 0,
                    clicked: 0,
                },
            });

        let delivered = 0;
        let failed = 0;

        for (const userId of parentMessage.recipients.userIds) {

            const sockets =
                await io.in(userId).fetchSockets();

            if (sockets.length > 0) {

                io.to(userId).emit(
                    SOCKET_EVENTS.TICKET_REPLY,
                    reply
                );

                delivered++;

            } else {

                failed++;
            }
        }

        reply.deliveryStats = {
            sent:
                parentMessage.recipients.userIds.length,
            delivered,
            failed,
            opened: 0,
            clicked: 0,
        };

        await reply.save();

        io.to("admin-messages").emit(
            SOCKET_EVENTS.TICKET_REPLY,
            reply
        );

        return res.status(201).json({
            success: true,
            reply,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            error: "Reply failed",
        });
    }
};