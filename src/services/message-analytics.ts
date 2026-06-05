import Message from "../models/Message";

export const calculateMessageInsights =
  async (messageId: string) => {

    const message =
      await Message.findById(messageId);

    if (!message) return;

    const delivered =
      message.deliveryStats.delivered || 0;

    const opened =
      message.openedBy.length || 0;

    const clicked =
      message.clickedBy.length || 0;

    const openRate =
      delivered > 0
        ? Math.round(
            (opened / delivered) * 100
          )
        : 0;

    const engagement =
      delivered > 0
        ? Math.round(
            ((opened + clicked) /
              delivered) *
              100
          )
        : 0;

    let threatLevel:
      | "safe"
      | "warning"
      | "critical" = "safe";

    if (
      message.priority === "critical"
    ) {
      threatLevel = "critical";
    }

    if (
      message.deliveryStats.failed > 50
    ) {
      threatLevel = "warning";
    }

    message.aiInsights = {
      openRate,
      engagementScore: engagement,
      threatLevel,
    };

    await message.save();
  };