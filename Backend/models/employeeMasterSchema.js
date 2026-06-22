import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // 🏢 Company Reference
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Optional: Store company name for Excel imports/reporting
    company: {
      type: String,
      default: "",
      trim: true,
    },

    // Employee Code
    staffCode: {
      type: String,
      required: true,
      trim: true,
    },

    // Employee Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfJoining: {
      type: Date,
    },

    division: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    placeOfWork: {
      type: String,
      default: "",
      trim: true,
    },

    visaNo: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Staff code must be unique only inside a company
employeeSchema.index(
  { companyId: 1, staffCode: 1 },
  { unique: true }
);

export default mongoose.model("EmployeeMaster", employeeSchema);