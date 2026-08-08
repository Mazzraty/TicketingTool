import TicketCounter from "../models/ticketCounterSchema.js";

export const generateTicketNumber = async (
  companyId,
  companyCode
) => {
  const year = new Date().getFullYear();

  const counter =
    await TicketCounter.findOneAndUpdate(
      {
        companyId,
        year,
      },
      {
        $inc: {
          sequence: 1,
        },

        $setOnInsert: {
          companyId,
          year,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

  const sequence = String(
    counter.sequence
  ).padStart(6, "0");

  return `${companyCode}-${year}-${sequence}`;
};