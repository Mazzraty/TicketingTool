import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// cron
import "./crons/softwareCronesExpiry.js";

// routes
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import softwareRoutes from "./routes/softwareRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiRoutes from "./routes/aiRotes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js"; // ← with other imports
// 🔗 Connect DB
connectDB();

const app = express();

/* =========================
   🌐 CORS CONFIG
// ========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ticketing-tool-nine.vercel.app",
  "https://ticketing-tool-80ru67aw8-mazzratys-projects.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/* =========================
   📦 BODY LIMIT FIX (IMPORTANT)
   FIX FOR "request entity too large"
========================= */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* =========================
   📁 STATIC FILES
========================= */
app.use("/uploads", express.static("uploads"));

/* =========================
   🧪 HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("HelpyFy API is running 🚀");
});

/* =========================
   🔐 ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/software", softwareRoutes);
app.use("/api/dashboard",dashboardRoutes );
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
/* =========================
   ❌ 404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   🔥 GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);

  res.status(500).json({
    message: err.message || "Server Error"
  });
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL ? "SET" : "NOT SET");
});

/* =========================
   ⚠️ SERVER ERROR HANDLING
========================= */
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} already in use`);
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});
