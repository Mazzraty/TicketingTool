import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
    },
    position: {
      type: String,
    },
    department: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "company_admin", "super_admin", "it_support"],
      default: "user",
    },

    // ✅ MULTI-TENANT SUPPORT
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,  // For super_admin users
    },

    // ✅ COMPANY ACCESS ARRAY (Multi-tenant)
    companyAccess: [
      {
        companyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
          required: true,
        },
        companyName: String,
        role: {
          type: String,
          enum: ["user", "company_admin", "it_support"],
          default: "user",
        },
        isActive: {
          type: Boolean,
          default: false,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        permissions: [String],  // Optional: fine-grained permissions
      },
    ],

    // Password reset
    resetOtp: String,
    resetOtpExpire: Date,

    // Profile
    profileImage: String,
    phone: String,
    address: String,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

// ✅ Additional indexes for faster queries
// Note: email index is created automatically by unique: true
userSchema.index({ companyId: 1 });
userSchema.index({ "companyAccess.companyId": 1 });

// ✅ MIDDLEWARE: Before saving, ensure at least one active company
userSchema.pre("save", function () {
  if (this.companyAccess?.length > 0) {
    const hasActive = this.companyAccess.some((c) => c.isActive);

    if (!hasActive) {
      this.companyAccess[0].isActive = true;
    }
  }
});;

export default mongoose.model("User", userSchema);