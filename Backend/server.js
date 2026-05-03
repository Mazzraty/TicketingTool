import "./loadEnv.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

// 🔗 Connect DB
connectDB();

const app = express();

// 🌐 Allowed Origins (Frontend URLs)
const allowedOrigins = [
  "http://localhost:5173",
  "https://helpy-fy.vercel.app"
];

// ✅ CORS CONFIG (IMPORTANT)
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// 📦 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Static folder for uploads
app.use("/uploads", express.static("uploads"));

// 🧪 Health Check Route
app.get("/", (req, res) => {
  res.send("HelpyFy API is running 🚀");
});

// 🔐 Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 🔥 Global Error Handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(500).json({
    message: err.message || "Server Error"
  });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ⚠️ Port Error Handling
app.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} already in use`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});