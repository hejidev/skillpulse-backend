import Threat from "../../models/Threat";

export const buildThreatFeed =
  async () => {

    const threats =
      await Threat.find()
        .sort({
          createdAt: -1,
        })
        .limit(20);

    const formattedThreats =
      threats.map((t) => ({
        title: t.type,
        severity:
          t.severity,
      }));

    return {
      threats:
        formattedThreats,

      summary: {
        total:
          threats.length,

        critical:
          threats.filter(
            (t) =>
              t.severity ===
              "critical"
          ).length,

        high:
          threats.filter(
            (t) =>
              t.severity ===
              "high"
          ).length,

        medium:
          threats.filter(
            (t) =>
              t.severity ===
              "medium"
          ).length,

        low:
          threats.filter(
            (t) =>
              t.severity ===
              "low"
          ).length,
      },
    };
  };