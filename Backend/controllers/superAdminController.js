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

    // remove existing access for same company
    user.companyAccess = user.companyAccess.filter(
      (c) => c.companyId.toString() !== companyId
    );

    // add new access
    user.companyAccess.push({
      companyId,
      companyName: company.name,
      role,
      isActive: true,
      assignedAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Company access assigned successfully",
      data: user.companyAccess,
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
      return res.status(404).json({
        message: "User not found",
      });
    }

    const access = user.companyAccess.find(
      (c) => c.companyId.toString() === companyId
    );

    if (!access) {
      return res.status(404).json({
        message: "Company access not found",
      });
    }

    access.isActive = false;
    access.revokedAt = new Date();
    access.revokedBy = req.user?._id || null;

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
   🟡 GET EMPLOYEES WITH USER ACCESS (FIXED VERSION)
====================================================== */
export const getEmployeesWithAccess = async (req, res) => {
  try {
    // 1. Get all employees
    const employees = await EmployeeMaster.find().lean();

    // 2. Normalize staff codes (VERY IMPORTANT FIX)
    const staffCodes = employees.map((emp) =>
      String(emp.staffCode).trim()
    );

    // 3. Get users linked by staffCode
    const users = await User.find({
      staffCode: { $in: staffCodes },
    })
      .select("_id staffCode companyAccess")
      .lean();

    // 4. Build fast lookup map
    const userMap = {};

    users.forEach((user) => {
      if (!user.staffCode) return;

      userMap[String(user.staffCode).trim()] = user;
    });

    // 5. Merge employee + user data
    const data = employees.map((emp) => {
      const key = String(emp.staffCode).trim();
      const user = userMap[key];

      return {
        ...emp,
        userId: user?._id || null,
        companyAccess: user?.companyAccess || [],
        isLinked: !!user, // helpful for UI debugging
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