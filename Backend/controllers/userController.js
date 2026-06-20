import User from "../models/userShema.js";
import Company from "../models/comapnySchema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";

export const getUsersByCompany = async (req, res) => {

  try {
    const { companyId } = req.params;
    const { role } = req.user;

    // 🔵 SUPER ADMIN → SEE EVERYTHING
    if (role === "super_admin") {
      const users = await User.find().lean();
      return res.json({ success: true, users });
    }

    // 🟡 IT SUPPORT → ONLY COMPANY DATA
    if (role === "it_support") {
      const users = await User.find({
        "companyAccess.companyId": companyId,
      }).lean();

      const filtered = users.map((user) => {
        const access = user.companyAccess.find(
          (c) => c.companyId.toString() === companyId
        );

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          staffCode: user.staffCode,
          role: access?.role,
          department: access?.department,
          position: access?.position,
        };
      });

      return res.json({ success: true, users: filtered });
    }

    return res.status(403).json({ message: "Access denied" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};