import cron from "node-cron";
import Message from "../models/Message";
import { io } from "../server";

cron.schedule("* * * * *", async () => {

  console.log("RUNNING SCHEDULED BROADCAST CHECK");

  try {

    const now = new Date();

    const dueMessages = await Message.find({
      status: "scheduled",
      scheduledFor: { $lte: now },
    });

    console.log(
      `FOUND ${dueMessages.length} SCHEDULED MESSAGES`
    );

    for (const message of dueMessages) {

      let delivered = 0;
      let failed = 0;
      let sent = 0;

      console.log(
        `PROCESSING MESSAGE ${message._id}`
      );

      /* =====================================
         SEND TO USERS
      ===================================== */

      for (const userId of message.recipients.userIds) {

        try {

          sent++;

          const sockets =
            await io.in(userId).fetchSockets();

          if (sockets.length > 0) {

            io.to(userId).emit("message", {
              ...message.toObject(),
              status: "sent",
              category: "broadcast",
              deliveredAt: new Date(),
            });

            delivered++;

          } else {

            failed++;
          }

        } catch (error) {

          console.log(
            "USER DELIVERY ERROR:",
            error
          );

          failed++;
        }
      }

      /* =====================================
         UPDATE DATABASE
      ===================================== */

      message.deliveryStats = {
        sent,
        delivered,
        failed,
        opened:
          message.deliveryStats?.opened || 0,
        clicked:
          message.deliveryStats?.clicked || 0,
      };

      if (delivered > 0) {

        message.status = "sent";

        message.category = "broadcast";

        message.deliveredAt = new Date();

      } else {

        message.status = "failed";

        message.failedReason =
          "All scheduled deliveries failed";
      }

      await message.save();

      console.log(
        `MESSAGE UPDATED: ${message._id}`
      );

      /* =====================================
         EMIT UPDATED MESSAGE TO ADMINS
      ===================================== */

      io.to("admin-messages").emit(
        "message",
        message.toObject()
      );

      console.log(
        `ADMIN UPDATE EMITTED`
      );
    }

  } catch (error) {

    console.log(
      "SCHEDULE CRON ERROR:",
      error
    );
  }
});