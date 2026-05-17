import dotenv from "dotenv";

// ✅ Load env safely (works local + Render)
dotenv.config();


import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import "./crons/softwareCronesExpiry.js";
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import softwareRoutes from "./routes/softwareRoutes.js";
// 🔗 Connect DB
connectDB();

const app = express();

// 🌐 Allowed Origins (UPDATED - removed helpyfy)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ticketing-tool-nine.vercel.app",
  "https://ticketing-tool-80ru67aw8-mazzratys-projects.vercel.app"
];


// ✅ CORS CONFIG
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

// 📦 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Static uploads
app.use("/uploads", express.static("uploads"));

// 🧪 Health check
app.get("/", (req, res) => {
  res.send("HelpyFy API is running 🚀");
});

// 🔐 Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/software",softwareRoutes);

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 🔥 Global error handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(500).json({
    message: err.message || "Server Error"
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("EMAIL USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
  console.log("EMAIL PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
  console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL ? "SET" : "NOT SET");
});

// ⚠️ Port error handling
app.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} already in use`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});