import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    // 🏢 BASIC COMPANY INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // 🌍 OPTIONAL: LOCATION INFO (useful for Qatar companies)
    location: {
      country: { type: String, default: "Qatar" },
      city: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    // 🔐 STATUS CONTROL
    isActive: {
      type: Boolean,
      default: true,
    },

    // 👑 OWNER / ADMIN OF COMPANY
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 📊 OPTIONAL SETTINGS (future-ready)
    settings: {
      allowMultiBranch: { type: Boolean, default: false },
      ticketAutoAssign: { type: Boolean, default: true },
      assetTrackingEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Company", companySchema);