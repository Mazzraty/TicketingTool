import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: String,

    employeeId: {
      type: String,
      unique: true,
      required: true,
    },

    position: {
      type: String,
      default: "Employee",
    },

    department: {
      type: String,
      default: "General",
    },

    role: {
      type: String,
      enum: ["super_admin", "company_admin", "it_support", "user"],
      default: "user",
    },

    /* 🏢 MULTI-TENANT SUPPORT (NEW) */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    /* =====================================
       🔐 OTP + PASSWORD RESET
    ===================================== */

    resetOtp: String,
    resetOtpExpire: Date,

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);