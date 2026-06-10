import mongoose from "mongoose";

const softwareSchema = new mongoose.Schema(
  {
    // 🏢 MULTI-TENANT ISOLATION (NEW)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    vendor: {
      type: String,
      required: true,
      trim: true,
    },

    durationMonths: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    purchaseDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Expired", "Renewed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Software", softwareSchema);