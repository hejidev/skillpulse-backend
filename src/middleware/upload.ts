// middleware/upload.ts
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../lib/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "skillpulse",
    format: file.mimetype.split("/")[1], // auto format
    public_id: Date.now() + "-" + file.originalname,
  }),
});

export const upload = multer({ storage });