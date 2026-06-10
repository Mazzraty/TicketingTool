import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // 🏢 MULTI-TENANT (NEW)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    staffCode: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    dateOfJoining: {
      type: Date,
    },

    division: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    placeOfWork: {
      type: String,
      default: "",
    },

    visaNo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeMaster", employeeSchema);