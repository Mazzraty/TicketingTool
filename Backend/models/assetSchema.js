import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      unique: true,
      required: true
    },

    type: {
      type: String,
      default: "Laptop"
    },

    model: String,

    status: {
      type: String,
      enum: ["available", "assigned"],
      default: "available"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Asset", assetSchema);