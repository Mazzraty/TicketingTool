import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      unique: true,
      required: true,
    },

    type: {
      type: String,
      enum: ["Laptop", "Printer", "HHT"],
      default: "Laptop",
    },

    model: String,
    serialNumber: String,

    status: {
      type: String,
      enum: [
        "available",
        "assigned",
        "repair",
        "scrapped",
      ],
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

    /* =========================
       NEW FIELDS
    ========================= */

    replacementFor: {
      type: String,
      default: "",
    },

    assignedDate: Date,

    repairDate: Date,

    retiredDate: Date,

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Asset", assetSchema);