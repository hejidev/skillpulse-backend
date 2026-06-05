import Threat from "../../models/Threat";

export const detectThreat =
  async ({
    userId,
    ip,
    riskScore,
    device,
  }: any) => {

    let severity =
      "low";

    if (riskScore >= 80)
      severity =
        "critical";

    else if (
      riskScore >= 60
    )
      severity =
        "high";

    else if (
      riskScore >= 40
    )
      severity =
        "medium";

    return Threat.create({
      userId,

      type:
        "Suspicious Login",

      severity,

      score: riskScore,

      ip,

      device,

      resolved: false,
    });
  };