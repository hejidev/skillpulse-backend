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
    heroImagePublicId: String,

    /* =========================
       FOUNDER
    ========================= */
    founderMessage: String,

    founderName: String,

    founderRole: String,

    founderImage: String,
     founderImagePublicId: String,

    /* =========================
       COMPANY INFO
    ========================= */
    companyFounded: String,

    headquarters: String,

    activeUsers: String,

    countriesReached: String,

    employees: String,

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
    stats: {
      type: [
        {
          title: String,
          value: String,
          icon: String,
        },
      ],
      default: [],
    },

    /* =========================
       CORE VALUES
    ========================= */
    values: {
  type: [
    {
      title: String,
      description: String,
      icon: String,
    },
  ],
  default: [],
},

    /* =========================
       TIMELINE
    ========================= */
    timeline: {
      type: [
      {
        year: String,
        title: String,
        description: String,
      },
    ],
    default: [],
  },

    /* =========================
       PLATFORM FEATURES
    ========================= */
    features: {
      type: [
        {
          title: String,
          description: String,
          icon: String,
        },
      ],
      default: [],
    },

    /* =========================
       LEADERSHIP TEAM
    ========================= */
    team: {
      type: [
        {
        name: String,

        role: String,

        image: String,

        imagePublicId: String,

        bio: String,

        linkedin: String,

        twitter: String,

        github: String,
      },
    ],
    default: [],
  },

    /* =========================
       ROADMAP
    ========================= */
    roadmap: {
    type: [
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
    default: [],
  },

    /* =========================
       TRUST SECTION
    ========================= */
    trustedBy: {
    type: [
      {
        company: String,
        logo: String,
      },
    ],
    default: [],
  },

    /* =========================
       TESTIMONIALS
    ========================= */
    testimonials: {
    type: [
      {
        name: String,

        role: String,

        image: String,

        imagePublicId: String,

        quote: String,
      },
    ],
    default: [],
  },
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
       PUBLISHED AT
    ========================= */
    publishedAt: Date,

    /* =========================
       ADMIN FIELDS
    ========================= */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /* =========================
      ACHIEVEMENTS
    ========================= */
    achievements: {
    type: [
      {
        title: String,
        value: String,
        description: String,
      },
    ],
    default: [],
  },

    /* =========================
      AWARDS    
  ========================= */

    awards: {
      type: [
        {
        title: String,
        issuer: String,
        year: String,
        image: String,
        imagePublicId: String,
      },
    ],
    default: [],
  },

    /* =========================
      GLOBAL IMPACT
    ========================= */
    globalImpact: 
    {
      type: [
      {
        country: String,
        users: String,
      },
    ],
    default: [],
  },

    /* =========================
       STATUS
    ========================= */
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    /* =========================
       PARTNERS
    ========================= */
    partners: {
    type: [
      {
        company: String,
        logo: String,
        logoPublicId: String,
        website: String,
      },
    ],
    default: [],
  },

    /* =========================
      MEDIA MENTIONS
    ========================= */
    mediaMentions: 
    {
      type: [
      {
        source: String,
        logo: String,
        logoPublicId: String,
        url: String,
      },
    ],
    default: [],
  },

    /* =========================
      COMPANY CULTURE
    ========================= */
    cultureTitle: String,

    cultureDescription: String,

    cultureImages: 
    {
      type: [String],
      default: [],
    },

    /* =========================
      CAREERS
  ========================= */

    careersTitle: String,

    careersDescription: String,

    careersLink: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "About",
  aboutSchema
);