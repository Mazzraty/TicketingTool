import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    // 🏢 MULTI-TENANT ISOLATION (NEW)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    assetCode: {
      type: String,
      unique: true,
      required: true,
    },

    type: {
      type: String,
      enum: ["Laptop", "Desktop", "Mobile", "Printer", "HHT"],
      default: "Laptop",
    },

    model: String,
    serialNumber: String,

    status: {
      type: String,
      enum: [
        "available",
        "assigned",
        "damaged",
        "for_service",
        "printer_for_service",
        "under_service",
      ],
      default: "available",
    },

    accessories: {
      charger: { type: Boolean, default: true },
      mouse: { type: Boolean, default: true },
      laptopBag: { type: Boolean, default: true },
      keyboard: { type: Boolean, default: false },
      headset: { type: Boolean, default: false },
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


    repairHistory: [
      {
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
        vendorName: String,
        vendorContact: String,
        issueDescription: String,
        cost: Number,
        sentDate: Date,
        returnedDate: Date,
        notes: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
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