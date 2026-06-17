import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const format = file.mimetype.split("/")[1];

    return {
      folder: "helpyfy_tickets",
      resource_type: format === "pdf" ? "raw" : "image",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

/* =========================
   ✅ SAFE UPLOAD MIDDLEWARE
   Always calls next() - even on errors
========================= */
export const uploadSafe = (req, res, next) => {
  upload.array("files", 5)(req, res, (err) => {
    if (err) {
      console.error("❌ Upload Error:", err.message);
      
      // Don't block the request - store error info
      req.uploadError = err.message;
      req.files = [];
      
      // ✅ CRITICAL: Always call next() to continue middleware chain
      return next();
    }
    
    // Success - files are in req.files
    console.log(`✅ Uploaded ${req.files?.length || 0} files to Cloudinary`);
    next();
  });
};

/* =========================
   ✅ STRICT UPLOAD MIDDLEWARE
   Fails request on upload errors
========================= */
export const uploadStrict = (req, res, next) => {
  upload.array("files", 5)(req, res, (err) => {
    if (err) {
      console.error("❌ Upload Error:", err.message);
      
      return res.status(400).json({
        success: false,
        message: "File upload failed: " + err.message,
      });
    }
    
    console.log(`✅ Uploaded ${req.files?.length || 0} files to Cloudinary`);
    next();
  });
};

/* =========================
   ✅ OPTIONAL: Backward compatibility
========================= */
export { upload };