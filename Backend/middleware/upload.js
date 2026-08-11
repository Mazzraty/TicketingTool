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
   ✅ ADDED: SINGLE-FILE "SAFE" UPLOAD MIDDLEWARE
   Used on PUT /tickets/:id (updateStatus) for the optional external-vendor
   receipt/invoice. Follows the same "never block the request" pattern as
   uploadSafe above — the ticket status still updates even if the receipt
   upload itself fails, so IT support isn't blocked from resolving a ticket
   just because an attachment hiccuped.

   The route always sends multipart/form-data for the Resolve/Close flow
   now (even when resolutionType is "Internal" and no file is chosen), so
   this middleware just runs upload.single("receipt") — multer/Cloudinary
   handles the case where no "receipt" field is present and simply leaves
   req.file undefined.
========================= */
export const uploadReceiptSafe = (req, res, next) => {
  upload.single("receipt")(req, res, (err) => {
    if (err) {
      console.error("❌ Receipt Upload Error:", err.message);

      req.uploadError = err.message;
      req.file = undefined;

      return next();
    }

    if (req.file) {
      console.log(`✅ Uploaded receipt to Cloudinary: ${req.file.path}`);
    }
    next();
  });
};

/* =========================
   ✅ OPTIONAL: Backward compatibility
========================= */
export { upload };