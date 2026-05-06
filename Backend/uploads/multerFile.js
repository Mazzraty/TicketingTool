import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// 🌥️ CLOUDINARY (for images / files)
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");

    return {
      folder: "helpyfy_tickets",
      resource_type: isImage ? "image" : "raw",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// 📊 MEMORY STORAGE (for Excel ONLY)
const memoryStorage = multer.memoryStorage();

// ✅ EXPORT BOTH
export const upload = multer({ storage: cloudinaryStorage }); // images
export const excelUpload = multer({ storage: memoryStorage }); // excel