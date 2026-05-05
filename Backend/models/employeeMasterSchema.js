import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    position: {
      type: String,
      default: "Employee"
    },

    department: {
      type: String,
      default: "General"
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeMaster", employeeSchema);