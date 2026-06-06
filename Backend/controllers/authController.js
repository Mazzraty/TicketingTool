import User from "../models/userShema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { otpEmail } from "../utils/otpEmail.js";

/* =========================
   REGISTER
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
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim(); // ← normalize

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        msg: "Email already exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail, // ← use normalized
      password: hash,
      employeeId,
      position,
      department,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      msg: err.message || "Server error",
    });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim(); // ← normalize

    const user = await User.findOne({ email: normalizedEmail }); // ← use normalized

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      msg: err.message || "Server error",
    });
  }
};

/* =========================
   FORGOT PASSWORD (SEND OTP)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.toLowerCase().trim(); // ← normalize

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        success: true,
        message: "If email exists, OTP sent",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

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
   RESET PASSWORD (VERIFY OTP)
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim(); // ← normalize

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
   GET MY PROFILE
========================= */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

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
// import User from "../models/userShema.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import sendEmail from "../utils/sendEmail.js";
// import { otpEmail } from "../utils/otpEmail.js";

// /* =========================
//    REGISTER
// ========================= */
// export const register = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       employeeId,
//       position,
//       department,
//     } = req.body;

//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res.status(400).json({
//         msg: "Email already exists",
//       });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hash,
//       employeeId,
//       position,
//       department,
//     });

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       user,
//     });

//   } catch (err) {
//     console.error("REGISTER ERROR:", err);
//     res.status(500).json({
//       msg: err.message || "Server error",
//     });
//   }
// };

// /* =========================
//    LOGIN
// ========================= */
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ msg: "Invalid credentials" });
//     }

//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//       return res.status(400).json({ msg: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id,
//         role: user.role,
//         email: user.email,
//         employeeId: user.employeeId,   // ✅ ADD THIS
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       success: true,
//       token,
//       user,
//     });

//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     res.status(500).json({
//       msg: err.message || "Server error",
//     });
//   }
// };

// /* =========================
//    FORGOT PASSWORD (SEND OTP)
// ========================= */
// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });

//     // always same response (security)
//     if (!user) {
//       return res.json({
//         success: true,
//         message: "If email exists, OTP sent",
//       });
//     }

//     // generate OTP
//     const otp = Math.floor(
//       100000 + Math.random() * 900000
//     ).toString();

//     user.resetOtp = otp;
//     user.resetOtpExpire = Date.now() + 15 * 60 * 1000; // 15 min

//     await user.save();

//     await sendEmail({
//       to: user.email,
//       subject: "🔐 Password Reset OTP",
//       html: otpEmail({ otp }),
//     });

//     res.json({
//       success: true,
//       message: "OTP sent to email",
//     });

//   } catch (err) {
//     console.error("FORGOT PASSWORD ERROR:", err);
//     res.status(500).json({
//       msg: err.message,
//     });
//   }
// };

// /* =========================
//    RESET PASSWORD (VERIFY OTP)
// ========================= */
// export const resetPassword = async (req, res) => {
//   try {
//     const { email, otp, password } = req.body;

//     const user = await User.findOne({
//       email,
//       resetOtp: otp,
//       resetOtpExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         msg: "Invalid or expired OTP",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     user.password = hashedPassword;

//     // clear OTP
//     user.resetOtp = undefined;
//     user.resetOtpExpire = undefined;

//     await user.save();

//     res.json({
//       success: true,
//       message: "Password reset successful",
//     });

//   } catch (err) {
//     console.error("RESET PASSWORD ERROR:", err);
//     res.status(500).json({
//       msg: err.message,
//     });
//   }
// };
// //get user profile
// export const getMyProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// export const updateProfile = async (req, res) => {
//   try {
//     const { name, department, position } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       {
//         name,
//         department,
//         position,
//       },
//       { new: true }
//     ).select("-password");

//     res.json({
//       success: true,
//       user,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// export const changePassword = async (req, res) => {
//   try {
//     const { oldPassword, newPassword } = req.body;

//     const user = await User.findById(req.user.id);

//     const isMatch = await bcrypt.compare(oldPassword, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         message: "Old password is incorrect",
//       });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();

//     res.json({
//       success: true,
//       message: "Password updated successfully",
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };