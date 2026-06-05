import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;

  thumbnail: string;

  category: string[];

  tags: string[];

  status:
    | "draft"
    | "published"
    | "scheduled";

  featured: boolean;

  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };

  views: number;

  author: {
    id: string;
    name: string;
  };

  scheduledFor?: Date;

  publishedAt?: Date;

  createdAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: String,

    slug: {
      type: String,
      unique: true,
    },

    excerpt: String,

    content: String,

    thumbnail: String,

    category: [String],

    tags: [String],

    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "scheduled",
      ],
      default: "draft",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    views: {
      type: Number,
      default: 0,
    },

    author: {
      id: String,
      name: String,
    },

    scheduledFor: Date,

    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBlog>(
  "Blog",
  blogSchema
);