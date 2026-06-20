import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";


/* ======================================================
   🟢 ASSIGN COMPANY ACCESS
====================================================== */
export const assignCompanyAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId, role } = req.body;

    if (!companyId || !role) {
      return res.status(400).json({
        message: "companyId and role are required",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.companyAccess = user.companyAccess.filter(
      (c) => c.companyId.toString() !== companyId
    );

    user.companyAccess.push({
      companyId,
      companyName: company.name,
      role,
      isActive: true,
      assignedAt: new Date(),
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Company access assigned successfully",
      data: user.companyAccess,
    });
  } catch (error) {
    console.error("Assign Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ======================================================
   🔴 REVOKE COMPANY ACCESS
====================================================== */
export const revokeCompanyAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        message: "companyId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const access = user.companyAccess.find(
      (c) => c.companyId.toString() === companyId
    );

    if (!access) {
      return res.status(404).json({
        message: "Company access not found",
      });
    }

    // 🚫 revoke access
    access.isActive = false;
    access.revokedAt = new Date();
    access.revokedBy = req.user._id; // from protect middleware

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Company access revoked successfully",
      data: access,
    });

  } catch (error) {
    console.error("Revoke Error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};



/* ======================================================
   🟡 GET USER COMPANY ACCESS (DEBUG / ADMIN PANEL)
====================================================== */


export const getEmployeesWithAccess = async (req, res) => {
  try {
    const employees = await EmployeeMaster.find().lean();

    const staffCodes = employees.map((emp) => emp.staffCode);

    const users = await User.find({
      staffCode: { $in: staffCodes },
    })
      .select("_id staffCode companyAccess")
      .lean();

    const userMap = {};

    users.forEach((user) => {
      userMap[user.staffCode] = user;
    });

    const data = employees.map((emp) => {
      const user = userMap[emp.staffCode];

      return {
        ...emp,
        userId: user?._id || null,
        companyAccess: user?.companyAccess || [],
      };
    });

    res.status(200).json({
      success: true,
      employees: data,
    });
  } catch (err) {
    console.error("Employees Access Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};