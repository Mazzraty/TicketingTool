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

    /* 🏢 MULTI-COMPANY ACCESS */
    companyAccess: [
      {
        companyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
        },

        role: {
          type: String,
          enum: ["company_admin", "it_support", "user"],
          default: "user",
        },

        isActive: {
          type: Boolean,
          default: true,
        },

        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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