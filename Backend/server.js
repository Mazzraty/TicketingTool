import "./loadEnv.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// ✅ START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server running on", PORT));

app.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using this port or set a different PORT in your .env file.`
    );
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});