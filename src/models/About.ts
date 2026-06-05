import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
  {
    /* =========================
       HERO
    ========================= */
    heroTitle: {
      type: String,
      required: true,
    },

    heroSubtitle: String,

    heroBadge: String,

    heroImage: String,

    /* =========================
       STORY
    ========================= */
    storyTitle: String,

    storyContent: String,

    storyImage: String,

    /* =========================
       MISSION & VISION
    ========================= */
    mission: String,

    vision: String,

    /* =========================
       COMPANY STATS
    ========================= */
    stats: [
      {
        title: String,
        value: String,
        icon: String,
      },
    ],

    /* =========================
       CORE VALUES
    ========================= */
    values: [
      {
        title: String,
        description: String,
        icon: String,
      },
    ],

    /* =========================
       TIMELINE
    ========================= */
    timeline: [
      {
        year: String,
        title: String,
        description: String,
      },
    ],

    /* =========================
       PLATFORM FEATURES
    ========================= */
    features: [
      {
        title: String,
        description: String,
        icon: String,
      },
    ],

    /* =========================
       LEADERSHIP TEAM
    ========================= */
    team: [
      {
        name: String,

        role: String,

        image: String,

        bio: String,

        linkedin: String,

        twitter: String,

        github: String,
      },
    ],

    /* =========================
       ROADMAP
    ========================= */
    roadmap: [
      {
        title: String,

        status: {
          type: String,
          enum: [
            "completed",
            "in-progress",
            "planned",
          ],
          default: "planned",
        },
      },
    ],

    /* =========================
       TRUST SECTION
    ========================= */
    trustedBy: [
      {
        company: String,
        logo: String,
      },
    ],

    /* =========================
       TESTIMONIALS
    ========================= */
    testimonials: [
      {
        name: String,

        role: String,

        image: String,

        quote: String,
      },
    ],

    /* =========================
       CTA
    ========================= */
    ctaTitle: String,

    ctaDescription: String,

    primaryButton: String,

    primaryButtonLink: String,

    secondaryButton: String,

    secondaryButtonLink: String,

    /* =========================
       SEO
    ========================= */
    seo: {
      metaTitle: String,

      metaDescription: String,

      keywords: [String],
    },

    /* =========================
       STATUS
    ========================= */
    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "About",
  aboutSchema
);