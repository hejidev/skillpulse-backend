import { Request, Response } from "express";
import Blog from "../models/Blog";
import slugify from "slugify";
import { AuthRequest } from "../types/express";

/* =========================================
   CREATE BLOG
========================================= */
export const createBlog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      status,
      seo,
      featured,
      scheduledFor,
    } = req.body;

    // ✅ CHECK AUTH
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ VALIDATION
    if (!title || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ SLUG
    const slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    // ✅ CHECK EXISTING BLOG
    const existing = await Blog.findOne({
      slug,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Blog title already exists",
      });
    }

    // ✅ CREATE BLOG
    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,

      thumbnail: req.file?.path || "",

      category:
        typeof category === "string"
          ? JSON.parse(category)
          : category,

      tags:
        typeof tags === "string"
          ? JSON.parse(tags)
          : tags,

      status,

      seo:
        typeof seo === "string"
          ? JSON.parse(seo)
          : seo,

      featured:
        featured === true ||
        featured === "true",

      scheduledFor:
        scheduledFor ? new Date(scheduledFor) : undefined,

      ...(status === "published" && {
        publishedAt: new Date(),
      }),

      author: {
        id: req.userId,
        name: req.name || "Unknown",
      },
    });

    return res.status(201).json({
      success: true,
      blog,
    });
  } catch (err: any) {
    console.log("CREATE BLOG ERROR:", err);

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to create blog",
    });
  }
};

/* =========================================
   GET PUBLISHED BLOGS
========================================= */
export const getPublishedBlogs =
  async (
    req: any,
    res: any
  ) => {
    try {
      const blogs =
        await Blog.find({
          status: "published",
        })
          .sort({
            publishedAt: -1,
          });

      return res.status(200).json({
        success: true,
        blogs,
      });
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
      });
    }
  };

/* =========================================
   GET SINGLE BLOG
========================================= */
export const getSingleBlog =
  async (
    req: any,
    res: any
  ) => {
    try {
      const blog =
        await Blog.findOne({
          slug: req.params.slug,
        });

      if (!blog) {
        return res.status(404).json({
          success: false,
          message:
            "Blog not found",
        });
      }

      blog.views += 1;

      await blog.save();

      return res.status(200).json({
        success: true,
        blog,
      });
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
      });
    }
  };

/* =========================================
   ADMIN BLOGS
========================================= */
export const getAdminBlogs =
  async (
    req: any,
    res: any
  ) => {
    try {
      const blogs =
        await Blog.find().sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        blogs,
      });
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
      });
    }
  };

/* =========================================
 GET SINGLE ADMIN BLOGS BY ID
========================================= */
export const getAdminBlogById = async (
  req: any,
  res: any
) => {
  try {
    const blog = await Blog.findById(
      req.params.id
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
    });
  }
};

/* =========================================
   ADMIN UPDATE BLOG BY ID
========================================= */
export const updateBlog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const blog = await Blog.findById(
      req.params.id
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      status,
      seo,
      featured,
      scheduledFor,
    } = req.body;

    blog.title = title;
    blog.excerpt = excerpt;
    blog.content = content;

    blog.category =
      typeof category === "string"
        ? JSON.parse(category)
        : category;

    blog.tags =
      typeof tags === "string"
        ? JSON.parse(tags)
        : tags;

    blog.status = status;

    if (
      status === "scheduled"
    ) {
      blog.scheduledFor =
        scheduledFor ? new Date(scheduledFor) : undefined;
    }

    blog.seo =
      typeof seo === "string"
        ? JSON.parse(seo)
        : seo;

    blog.featured =
      featured === true ||
      featured === "true";

    blog.slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    if (req.file) {
      blog.thumbnail = req.file.path;
    }

    if (
      status === "published" &&
      !blog.publishedAt
    ) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================
   ADMIN DELETE BLOG BY ID
========================================= */
export const deleteBlog = async (
  req: any,
  res: any
) => {
  try {
    const blog = await Blog.findByIdAndDelete(
      req.params.id
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Blog deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
    });
  }
};