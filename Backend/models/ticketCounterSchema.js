import mongoose from "mongoose";

const ticketCounterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
    },

    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One counter per company per year
ticketCounterSchema.index(
  { companyId: 1, year: 1 },
  { unique: true }
);

export default mongoose.model(
  "TicketCounter",
  ticketCounterSchema
);