import OpenAI from "openai";
import AICache from "../models/AICache";
import { generateHash } from "../utils/hash";
import { generateCoachMessage } from "../utils/fallback";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAICoach(
  data: any,
  userId: string,
  skillId: string
) {
  const hash = generateHash(data);

  const cached = await AICache.findOne({
    hash,
    userId,
    skillId,
  });

  // ✅ CACHE HIT
  if (cached) {
    return {
      text: cached.text,
      mood: cached.mood || "neutral",
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API Key");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are Jarvis-level elite AI performance coach.

Skill: ${data.skillName}
Streak: ${data.streak}
Weekly Hours: ${data.weeklyHours}
Last Active: ${data.lastActiveDaysAgo}
Goal Progress: ${data.goalPercent}%
Consistency: ${data.consistencyScore}%
Best Day: ${data.bestDay}
Worst Day: ${data.worstDay}

Rules:
- Sound futuristic
- Be motivational
- Be emotionally intelligent
- Max 18 words
- Give one direct action
`,
        },
      ],
    });

    const text =
      response.choices[0].message.content ||
      "Push harder today.";

    const mood =
      data.consistencyScore > 70
        ? "motivational"
        : data.consistencyScore > 40
          ? "focused"
          : "strict";

    await AICache.create({
      userId,
      skillId,
      hash,
      text,
      mood,
    });

    return {
      text,
      mood,
    };
  } catch (err: any) {
    console.error("AI ERROR:", err.message);

    return generateCoachMessage(data);
  }
}



/* ======================================================
   SUPPORT AI AUTO REPLY
====================================================== */

function hashMessage(message: string) {
  return crypto
    .createHash("sha256")
    .update(message.toLowerCase().trim())
    .digest("hex");
}

export async function generateSupportReply(
  userMessage: string
) {
  const hash = hashMessage(userMessage);

  // ✅ CHECK CACHE
  const cached = await AICache.findOne({
    hash,
  });

  if (cached?.reply) {
    return {
      reply: cached.reply,
      cached: true,
    };
  }

  try {
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content: `
You are an elite SaaS support agent.

Rules:
- Professional
- Friendly
- Short and clear
- Human-like
- Never sound robotic
- Max 40 words
- If issue sounds dangerous or billing-related,
  tell user support team will review manually.
`,
          },

          {
            role: "user",
            content: userMessage,
          },
        ],

        temperature: 0.7,
      });

    const reply =
      completion.choices[0].message.content ||
      "We're reviewing your request.";

    // ✅ SAVE CACHE
    await AICache.create({
      hash,
      reply,
    });

    return {
      reply,
      cached: false,
    };
  } catch (error) {
    console.log(error);

    return {
      reply:
        "We've received your request and our support team is reviewing it.",
      cached: false,
    };
  }
}