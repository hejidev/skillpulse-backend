import OpenAI from "openai";
import AICache from "../models/AICache";
import { generateHash } from "../utils/hash";
import { generateCoachMessage } from "../utils/fallback";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAICoach(
  data: any,
  userId: string,
  skillId: string,
) {
  const hash = generateHash(data);

  // ✅ 1. CHECK CACHE FIRST
  const cached = await AICache.findOne({ hash, userId, skillId });

  if (cached) {
    console.log("⚡ Using cached AI response");
    return cached.message;
  }

  try {
    const prompt = `
You are an elite productivity coach.

Analyze the user's learning behavior and give a SHORT but SMART insight.

Skill: ${data.skillName}

Metrics:
- Streak: ${data.streak}
- Weekly Hours: ${data.weeklyHours}
- Last Active: ${data.lastActiveDaysAgo} days ago
- Goal Progress: ${data.goalPercent}%

Patterns:
- Best Day: ${data.bestDay}
- Weakest Day: ${data.worstDay}
- Consistency Score: ${data.consistencyScore}%

Rules:
- Be specific (mention days/patterns)
- Give 1 actionable suggestion
- Keep it under 20 words
- Sound like a real coach (not generic)

Example:
"You focus most on Mondays but drop midweek—add a Wednesday session to stay consistent."
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const message = response.choices[0].message.content || "";

    // ✅ 2. SAVE TO CACHE
    await AICache.create({
      userId,
      skillId,
      hash,
      message,
    });

    return message;
  } catch (err) {
    console.error("❌ AI FAILED → using fallback");

    // ✅ 3. FALLBACK SYSTEM
    return generateCoachMessage(data);
  }
}
