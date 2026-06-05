import cron from "node-cron";
import Blog from "../models/Blog";

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const blogs = await Blog.find({
      status: "scheduled",
      scheduledFor: {
        $lte: now,
      },
    });

    if (!blogs.length) return;

    console.log(
      `Publishing ${blogs.length} scheduled blogs`
    );

    for (const blog of blogs) {
      blog.status = "published";
      blog.publishedAt = now;

      await blog.save();

      console.log(
        `Published: ${blog.title}`
      );
    }
  } catch (error) {
    console.log(
      "BLOG CRON ERROR:",
      error
    );
  }
});