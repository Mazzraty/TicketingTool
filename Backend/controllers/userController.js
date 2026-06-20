import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";


export const getUsersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const users = await User.find({
      companyAccess: {
        $elemMatch: {
          companyId,
          isActive: true,
        },
      },
    }).select(
      "name email staffCode department position companyAccess"
    );

    const formatted = users.map((user) => {
      const access = user.companyAccess.find(
        (c) => c.companyId.toString() === companyId
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
        department: user.department,
        position: user.position,
        role: access?.role,
      };
    });

    res.json({
      success: true,
      users: formatted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};