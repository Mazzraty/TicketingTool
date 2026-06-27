import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/userShema.js";
import EmployeeMaster from "../models/employeeMasterSchema.js";
import mongoose from "mongoose";

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
    args[key] = val;
  }
}

async function run() {
  await connectDB();

  const { email, userId, staffCode, employeeRef } = args;

  if (!email && !userId) {
    console.error("Provide --email or --userId");
    process.exit(1);
  }

  if (!staffCode && !employeeRef) {
    console.error("Provide --staffCode or --employeeRef");
    process.exit(1);
  }

  const user = email
    ? await User.findOne({ email: email.toLowerCase().trim() })
    : await User.findById(userId);

  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  let employee = null;

  if (employeeRef) {
    if (!mongoose.Types.ObjectId.isValid(employeeRef)) {
      console.error("employeeRef must be a valid ObjectId");
      process.exit(1);
    }
    employee = await EmployeeMaster.findById(employeeRef);
  } else if (staffCode) {
    employee = await EmployeeMaster.findOne({
      staffCode: new RegExp(`^${String(staffCode).trim()}$`, "i"),
    });
  }

  if (!employee) {
    console.error("Employee not found for provided staffCode/employeeRef");
    process.exit(1);
  }

  user.staffCode = employee.staffCode;
  user.employeeRef = employee._id;
  user.companyId = user.companyId || employee.companyId;

  await user.save();

  console.log("User linked to employee successfully:", {
    userId: user._id.toString(),
    staffCode: user.staffCode,
    employeeRef: user.employeeRef.toString(),
    companyId: user.companyId?.toString?.(),
  });

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
