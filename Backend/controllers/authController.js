import mongoose from "mongoose";
import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { otpEmail } from "../utils/otpEmail.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
/* =========================
   REGISTER (MULTI-TENANT)
========================= */
export const register = async (req, res) => {
  try {
    console.log("REGISTER REQUEST BODY:", req.body);

    const {
      name,
      email,
      password,
      staffCode,
      position,
      department,
      companyId: companyIdentifier,
      role: requestedRole,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // 1️⃣ check user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // 2️⃣ FIND EMPLOYEE (🔥 THIS WAS MISSING)
    const employee = await EmployeeMaster.findOne({
      staffCode: new RegExp(`^${String(staffCode).trim()}$`)
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found with this staffCode"
      });
    }

    // 3️⃣ CHECK IF EMPLOYEE ALREADY LINKED
    const alreadyLinked = await User.findOne({
      staffCode: employee.staffCode
    });

    if (alreadyLinked) {
      return res.status(400).json({
        success: false,
        message: "This employee is already linked to a user"
      });
    }

    // 4️⃣ COMPANY VALIDATION
    let company = null;

    if (companyIdentifier) {
      company = await Company.findById(companyIdentifier);

      if (!company) {
        return res.status(400).json({
          msg: "Selected company does not exist",
        });
      }
    }

    // 5️⃣ HASH PASSWORD
    const hash = await bcrypt.hash(password, 10);

    // 6️⃣ CREATE USER (LINKED PROPERLY)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hash,

      staffCode: employee.staffCode,
      employeeRef: employee._id,

      position,
      department,
      role: requestedRole || "user",
      companyId: companyIdentifier,

      // ✅ ADD THIS
      companyAccess: companyIdentifier
        ? [
          {
            companyId: companyIdentifier,
            companyName: company?.name || "",
            role: requestedRole || "user",
            department,
            position,
            permissions: [],
            isActive: true,
          },
        ]
        : [],
    });

    return res.status(201).json({
      success: true,
      msg: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
        role: user.role,
        companyId: user.companyId,
        companyAccess: user.companyAccess,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

/* =========================
   LOGIN (MULTI-TENANT)
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || "").toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Get active company from companyAccess array
    const activeCompany =
      user.companyAccess?.find((c) => c.isActive && c.companyId)?.companyId ||
      user.companyAccess?.[0]?.companyId ||
      user.companyId ||  // Fallback for old single-company format
      null;

    // ✅ Get all company access for multi-company support
    const companyAccess = (user.companyAccess || []).map((c) => ({
      companyId: c.companyId.toString(),
      companyName: c.companyName,
      role: c.role,
      isActive: c.isActive || false,
    }));

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        staffCode: user.staffCode,   // 👈 CHANGE THIS
        companyId: activeCompany ? activeCompany.toString() : null,
        companyAccess: companyAccess,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // clean user object
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      token,
      user: userData,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      msg: err.message || "Server error",
    });
  }
};

/* =========================
   SWITCH COMPANY (TENANT)
========================= */
export const switchCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Check if user has access to this company
    const companyAccess = user.companyAccess?.find(
      (c) => c.companyId.toString() === companyId
    );

    if (!companyAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this company",
      });
    }

    // ✅ Mark all as inactive, then activate the selected one
    user.companyAccess.forEach((c) => {
      c.isActive = c.companyId.toString() === companyId;
    });

    user.companyId = companyId;  // Update default companyId
    await user.save();

    // ✅ Generate new token with new active company
    const newCompanyAccess = user.companyAccess.map((c) => ({
      companyId: c.companyId.toString(),
      companyName: c.companyName,
      role: c.role,
      isActive: c.isActive,
    }));

    const newToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        employeeId: user.employeeId,
        companyId: companyId,
        companyAccess: newCompanyAccess,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Company switched successfully",
      token: newToken,
      companyId: companyId,
    });
  } catch (err) {
    console.error("SWITCH COMPANY ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   ADD COMPANY ACCESS
========================= */
export const addCompanyAccess = async (req, res) => {
  try {
    const { userId, companyId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // ✅ Check if user already has access to this company
    const alreadyHasAccess = user.companyAccess?.some(
      (c) => c.companyId.toString() === companyId
    );

    if (alreadyHasAccess) {
      return res.status(400).json({
        success: false,
        message: "User already has access to this company",
      });
    }

    // ✅ Add new company access
    user.companyAccess = user.companyAccess || [];
    user.companyAccess.push({
      companyId: companyId,
      companyName: company.name,
      role: "user",
      isActive: false,
      joinedAt: new Date(),
    });

    await user.save();

    res.json({
      success: true,
      message: "Company access added successfully",
      companyAccess: user.companyAccess,
    });
  } catch (err) {
    console.error("ADD COMPANY ACCESS ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
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
      .populate("companyId")
      .populate("companyAccess.companyId")
      .populate("employeeRef"); // 🔥 ADD THIS

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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("companyAccess.companyId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};