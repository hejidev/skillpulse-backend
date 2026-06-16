import { Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import About from "../models/About";
import { AuthRequest } from "../types/express";
import { io } from "../server";

/* =========================
   GET PUBLIC ABOUT
========================= */
export const getPublicAbout =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      const about =
        await About.findOne({
          status: "published",
        })
          .populate(
            "updatedBy",
            "name email"
          );

      if (!about) {
        return res.status(404).json({
          success: false,
          message:
            "About page unavailable",
        });
      }

      return res.status(200).json({
        success: true,
        about,
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* =========================
 GET ADMIN ABOUT
========================= */
export const getAdminAbout =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      let about =
        await About.findOne();

      if (!about) {

        about =
          await About.create({
            heroTitle:
              "Welcome To Our Platform",
            status: "draft",
          });

      }

      return res.status(200).json({
        success: true,
        about,
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* =========================
   UPDATE ABOUT
========================= */
export const updateAbout = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await About.findOne();

    // If no about doc yet, just create new (no need to delete images)
    if (!existing) {
      const created = await About.create({
        ...req.body,
        updatedBy: (req as AuthRequest & { user?: { _id?: string } }).user?._id,
      });

      return res.status(200).json({
        success: true,
        about: created,
      });
    }

    // 1. Handle top-level images
    const fieldsToCheck = [
      { urlField: "heroImage", publicField: "heroImagePublicId" },
      { urlField: "founderImage", publicField: "founderImagePublicId" },
      { urlField: "storyImage", publicField: "storyImagePublicId" }, // if you add it
    ];

    for (const { urlField, publicField } of fieldsToCheck) {
      const newUrl = (req.body as any)[urlField];
      const oldUrl = (existing as any)[urlField];
      const oldPublicId = (existing as any)[publicField];

      // If URL changed and we have an old public_id, delete old asset
      if (newUrl && oldUrl && newUrl !== oldUrl && oldPublicId) {
        cloudinary.uploader
          .destroy(oldPublicId)
          .catch((err) => console.error("Cloudinary delete error:", err));
      }
    }

    // 2. Handle array fields where images might change (team, testimonials)
    // You can compare by index; if you want safer diffing, add stable _id per subdocument.
    if (Array.isArray(req.body.team) && Array.isArray(existing.team)) {
      req.body.team.forEach((member: any, index: number) => {
        const oldMember: any = (existing.team as any)[index];
        if (!oldMember) return;

        if (
          member.image &&
          oldMember.image &&
          member.image !== oldMember.image &&
          oldMember.imagePublicId
        ) {
          cloudinary.uploader
            .destroy(oldMember.imagePublicId)
            .catch((err) =>
              console.error("Cloudinary delete team image error:", err)
            );
        }
      });
    }

    if (
      Array.isArray(req.body.testimonials) &&
      Array.isArray(existing.testimonials)
    ) {
      req.body.testimonials.forEach((t: any, index: number) => {
        const old: any = (existing.testimonials as any)[index];
        if (!old) return;

        if (
          t.image &&
          old.image &&
          t.image !== old.image &&
          old.imagePublicId
        ) {
          cloudinary.uploader
            .destroy(old.imagePublicId)
            .catch((err) =>
              console.error("Cloudinary delete testimonial image error:", err)
            );
        }
      });
    }

    // 3. Finally, update the About doc with new data (including new publicIds from frontend)
    const about = await About.findOneAndUpdate(
      {},
      {
        ...req.body,
        updatedBy: (req as AuthRequest & { user?: { _id?: string } }).user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About configuration not found",
      });
    }

    io.to("about-admin").emit("about-updated", about);

    return res.status(200).json({
      success: true,
      about,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
 UPDATE ABOUT STATUS
========================= */
export const updateAboutStatus =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      const { status } =
        req.body;

      if (
        !["draft", "published"]
          .includes(status)
      ) {
        return res.status(400)
          .json({
            success: false,
            message:
              "Invalid status"
          });
      }

      const updateData: any = {
        status,
      };

      if (status === "published") {
        updateData.publishedAt =
          new Date();
      } else {
        updateData.publishedAt =
          null;
      }

      const about =
        await About.findOneAndUpdate(
          {},
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!about) {
        return res.status(404)
          .json({
            success: false,
            message:
              "About page not found",
          });
      }

      io.to("about-admin").emit(
        "about-status-updated",
        about
      );

      return res.status(200).json({
        success: true,
        about,
      });

    } catch (error: any) {

      return res.status(500)
        .json({
          success: false,
          message: error.message,
        });

    }
  };

/* =========================
   GET ABOUT ANALYTICS
========================= */
export const getAboutAnalytics =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      const about =
        await About.findOne();

      if (!about) {
        return res.status(404).json({
          success: false,
        });
      }

      return res.status(200).json({
        success: true,

        analytics: {
          stats:
            about.stats?.length || 0,

          values:
            about.values?.length || 0,

          team:
            about.team?.length || 0,

          timeline:
            about.timeline?.length || 0,

          partners:
            about.partners?.length || 0,

          awards:
            about.awards?.length || 0,

          testimonials:
            about.testimonials?.length || 0,

          mediaMentions:
            about.mediaMentions?.length || 0,

          features:
            about.features?.length || 0,
        },
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* =========================
   UPLOAD ABOUT IMAGE
========================= */
export const uploadAboutImage = (req: Request, res: Response) => {
  // @ts-ignore
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "No file provided",
    });
  }

  // For multer-storage-cloudinary:
  // - file.path => Cloudinary URL
  // - file.filename or file.public_id => public ID [web:36]
  const url = file.path;
  const publicId = file.filename || file.public_id;

  return res.status(200).json({
    success: true,
    url,
    publicId,
  });
};

/* =========================
   DELETE ABOUT
========================= */
export const deleteAbout = async (req: AuthRequest, res: Response) => {
  try {
    const about = await About.findByIdAndDelete(req.params.id);

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About page not found",
      });
    }

    const deletions: string[] = [];

    if (about.heroImagePublicId) deletions.push(about.heroImagePublicId);
    if (about.founderImagePublicId) deletions.push(about.founderImagePublicId);

    (about.team || []).forEach((m: any) => {
      if (m.imagePublicId) deletions.push(m.imagePublicId);
    });

    (about.testimonials || []).forEach((t: any) => {
      if (t.imagePublicId) deletions.push(t.imagePublicId);
    });

    if (deletions.length) {
      cloudinary.api
        .delete_resources(deletions)
        .catch((err) =>
          console.error("Cloudinary bulk delete error:", err)
        );
    }

    io.to("about-admin").emit("about-deleted");

    return res.status(200).json({
      success: true,
      message: "About deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};