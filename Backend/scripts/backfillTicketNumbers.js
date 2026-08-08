/**
 * backfillTicketNumbers.js
 *
 * One-time migration: assigns ticketNumber to any existing tickets that
 * don't have one yet. Uses the SAME TicketCounter collection/logic as
 * generateTicketNumber() in utils/generateTicketNumber.js, so future
 * tickets created normally will continue the sequence correctly and
 * never collide with these backfilled numbers.
 *
 * Difference from calling generateTicketNumber() directly: that helper
 * always stamps the CURRENT year. This script instead uses each
 * ticket's own createdAt year, so old tickets get historically
 * accurate numbers (e.g. a ticket from 2025 gets "...-2025-000001",
 * not "...-2026-...").
 *
 * Processes tickets oldest-first (by createdAt) so sequence numbers
 * within each company+year bucket are assigned in the order tickets
 * were actually created.
 *
 * Usage:
 *   node backfillTicketNumbers.js
 *
 * IMPORTANT:
 *   - Take a database backup before running this.
 *   - Set MONGODB_URI in your env (or hardcode your connection string
 *     below) before running.
 *   - Adjust the relative import paths below to match where you place
 *     this script in your project (paths assume it sits next to your
 *     existing controllers/ folder, alongside models/ and utils/).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Ticket from "../models/ticketSchema.js";
import Company from "../models/comapnySchema.js";
import TicketCounter from "../models/ticketCounterSchema.js";

dotenv.config();

async function getNextTicketNumber(companyId, companyCode, year) {
  const counter = await TicketCounter.findOneAndUpdate(
    { companyId, year },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { companyId, year },
    },
    { new: true, upsert: true }
  );

  const sequence = String(counter.sequence).padStart(6, "0");
  return `${companyCode}-${year}-${sequence}`;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  // Only tickets missing a ticketNumber, oldest first so numbers are
  // assigned in the order tickets were actually created.
  const tickets = await Ticket.find({
    $or: [
      { ticketNumber: { $exists: false } },
      { ticketNumber: null },
      { ticketNumber: "" },
    ],
  }).sort({ createdAt: 1 });

  console.log(`Found ${tickets.length} tickets without a ticket number`);

  // Cache resolved company codes so we don't re-query per ticket.
  const companyCodeCache = new Map();

  let updated = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    try {
      const companyIdStr = ticket.companyId?.toString();

      if (!companyIdStr) {
        console.warn(`Skipping ${ticket._id} — no companyId on ticket`);
        skipped++;
        continue;
      }

      let companyCode = companyCodeCache.get(companyIdStr);

      if (!companyCode) {
        const company = await Company.findById(ticket.companyId);

        if (!company) {
          console.warn(`Skipping ${ticket._id} — company not found`);
          skipped++;
          continue;
        }

        companyCode =
          company.code ||
          company.companyCode ||
          company.name?.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();

        if (!companyCode) {
          console.warn(`Skipping ${ticket._id} — no company code resolvable`);
          skipped++;
          continue;
        }

        companyCodeCache.set(companyIdStr, companyCode);
      }

      const year = new Date(ticket.createdAt).getFullYear();

      const ticketNumber = await getNextTicketNumber(
        ticket.companyId,
        companyCode,
        year
      );

      ticket.ticketNumber = ticketNumber;
      await ticket.save();

      console.log(`${ticket._id} -> ${ticketNumber}`);
      updated++;
    } catch (err) {
      console.error(`Failed on ${ticket._id}:`, err.message);
      skipped++;
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});