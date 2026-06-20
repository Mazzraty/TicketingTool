import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";

/* ======================================================
   🟢 ASSIGN COMPANY ACCESS (FIXED)
====================================================== */
export const assignCompanyAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId, role } = req.body;

    if (!companyId || !role) {
      return res.status(400).json({
        success: false,
        message: "companyId and role are required",
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // remove old access for same company
    user.companyAccess = user.companyAccess.filter(
      (c) => c.companyId.toString() !== companyId
    );

    // add new access
    user.companyAccess.push({
      companyId,
      companyName: company.name,
      role,
      isActive: true,
      joinedAt: new Date(),
      permissions: [],
    });

    // 🔥 IMPORTANT: sync ROOT USER ROLE
    user.role = role;

    // optional but recommended
    user.companyId = companyId;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role + company access updated successfully",
      data: {
        role: user.role,
        companyAccess: user.companyAccess,
      },
    });

  } catch (error) {
    console.error("Assign Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ======================================================
   🔴 REVOKE COMPANY ACCESS (FIXED)
====================================================== */
export const revokeCompanyAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const access = user.companyAccess.find(
      (c) => c.companyId.toString() === companyId
    );

    if (!access) {
      return res.status(404).json({
        success: false,
        message: "Company access not found",
      });
    }

    access.isActive = false;
    access.revokedAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Company access revoked successfully",
      data: access,
    });

  } catch (error) {
    console.error("Revoke Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   🟡 GET EMPLOYEES WITH USER ACCESS (OPTIMIZED)
====================================================== */
export const getEmployeesWithAccess = async (req, res) => {
  try {
    const employees = await EmployeeMaster.find().lean();

    const staffCodes = employees.map((emp) =>
      String(emp.staffCode).trim()
    );

    const users = await User.find({
      staffCode: { $in: staffCodes },
    })
      .select("_id staffCode companyAccess companyId")
      .lean();

    const userMap = new Map();

    users.forEach((user) => {
      if (!user.staffCode) return;

      userMap.set(String(user.staffCode).trim(), user);
    });

    const data = employees.map((emp) => {
      const key = String(emp.staffCode).trim();
      const user = userMap.get(key);

      return {
        ...emp,
        userId: user?._id || null,
        companyId: user?.companyId || null,
        companyAccess: user?.companyAccess || [],
        isLinked: !!user,
      };
    });

    return res.status(200).json({
      success: true,
      employees: data,
    });

  } catch (err) {
    console.error("Employees Access Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};