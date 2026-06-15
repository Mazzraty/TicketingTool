import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

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

    /* =========================
       MULTI COMPANY ACCESS
    ========================= */
    companyAccess: [
      {
        companyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
          required: true,
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

    /* =========================
       RESET PASSWORD / OTP
    ========================= */
    resetOtp: String,
    resetOtpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);