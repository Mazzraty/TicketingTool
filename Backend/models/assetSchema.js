import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      unique: true,
      required: true,
    },

    // Laptop / Printer / HHT
    type: {
      type: String,
      enum: ["Laptop", "Printer", "HHT"],
      default: "Laptop",
    },

    // Common
    model: String,

    serialNumber: String,

    status: {
      type: String,
      enum: ["available", "assigned"],
      default: "available",
    },

    /* =========================
       PRINTER & HHT DETAILS
    ========================= */

    route: String,

    salesmanCode: String,

    salesmanName: String,

    supervisor: String,

    soti: String,

    imei: String,

    simNumber: String,

    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Asset", assetSchema);