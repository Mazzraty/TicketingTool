import mongoose from "mongoose";
import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { otpEmail } from "../utils/otpEmail.js";

/* =========================
   REGISTER (COMPANY-BASED)
========================= */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      position,
      department,
      companyId: companyIdentifier,
      role: requestedRole,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    let requestUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        requestUser = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        requestUser = null;
      }
    }

    const isAdminRequest = requestUser && ["company_admin", "super_admin", "it_support"].includes(requestUser.role);
    const role = isAdminRequest ? requestedRole || "user" : "user";

    let company = null;
    if (companyIdentifier) {
      const searchCriteria = [
        { code: companyIdentifier },
      ];

      if (mongoose.isValidObjectId(companyIdentifier)) {
        searchCriteria.unshift({ _id: companyIdentifier });
      }

      company = await Company.findOne({
        $or: searchCriteria,
      });

      if (!company) {
        return res.status(400).json({ msg: "Selected company does not exist" });
      }
    }

    if (!company && role !== "super_admin") {
      return res.status(400).json({ msg: "Company is required for this account" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hash,
      employeeId,
      position,
      department,
      role,
      companyId: company ? company._id : null,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
};
/* =========================
   LOGIN (MULTI-TENANT)
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || "").toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail })
      .populate("companyAccess.companyId"); // ✅ FIXED

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // get active company
    const activeCompany =
      user.companyAccess?.find((c) => c.isActive)?.companyId || null;

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        employeeId: user.employeeId,
        companyId: activeCompany?._id || activeCompany || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userData = user.toObject();

    res.json({
      success: true,
      token,
      user: {
        ...userData,
        password: undefined,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      msg: err.message || "Server error",
    });
  }
};
/* =========================
   FORGOT PASSWORD (OTP)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        success: true,
        message: "If email exists, OTP sent",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "🔐 Password Reset OTP",
      html: otpEmail({ otp }),
    });

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid or expired OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({
      msg: err.message,
    });
  }
};

/* =========================
   GET MY PROFILE (TENANT SAFE)
========================= */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("companyId");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = async (req, res) => {
  try {
    const { name, department, position } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, department, position },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};