import EmployeeMaster from "../models/employeeMasterSchema.js";

// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  const data = await EmployeeMaster.find().sort({ createdAt: -1 });
  res.json(data);
};

// GET SINGLE EMPLOYEE
export const getEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOne({
    employeeId: req.params.id
  });

  res.json(emp);
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
  const emp = await EmployeeMaster.findOneAndUpdate(
    { employeeId: req.params.id },
    req.body,
    { new: true }
  );

  res.json(emp);
};

// DELETE (OPTIONAL)
export const deleteEmployee = async (req, res) => {
  await EmployeeMaster.deleteOne({
    employeeId: req.params.id
  });

  res.json({ msg: "Deleted" });
};