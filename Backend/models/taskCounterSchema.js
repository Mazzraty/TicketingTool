// models/taskCounterSchema.js
// One document per company per year, same idea as ticketCounterSchema
import mongoose from "mongoose";

const taskCounterSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  year: { type: Number, required: true },
  sequence: { type: Number, default: 0 },
});

taskCounterSchema.index({ companyId: 1, year: 1 }, { unique: true });

export default mongoose.model("TaskCounter", taskCounterSchema);