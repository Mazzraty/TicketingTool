import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    // 🏢 MULTI-TENANT (CRITICAL)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeMaster",
      required: true,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    assignedDate: {
      type: Date,
      default: Date.now,
    },

    returnedDate: Date,

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    // HISTORY SNAPSHOT
    assetType: String,
    assetCode: String,
    model: String,
    salesmanCode: String,
    salesmanName: String,
    route: String,
    supervisor: String,
    assignedBy: String,
    returnedBy: String,
    remarks: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AssetAssignment", assignmentSchema);