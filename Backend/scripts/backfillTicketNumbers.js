/**
 * backfillSlaBreachReason.js
 *
 * One-time migration: adds sla.breachReason and sla.firstResponseBreachReason
 * to existing tickets that don't have them yet.
 *
 * Why this is needed: Mongoose schema `default: ""` only applies when a NEW
 * document is created. Tickets that already existed in the database before
 * these fields were added to ticketSchema.js do NOT have them at all — so
 * reading ticket.sla.breachReason on an old ticket returns undefined, not "".
 * This script writes "" (or a note, for already-breached tickets) onto every
 * existing ticket so the fields are consistently present going forward.
 *
 * Behavior:
 *   - If sla.resolutionBreached is true and breachReason is missing/empty,
 *     sets a placeholder note ("Backfilled - reason not recorded") so it's
 *     obvious in the UI that this is historical data, not a real reason.
 *   - If sla.firstResponseBreached is true and firstResponseBreachReason is
 *     missing/empty, same placeholder treatment.
 *   - If a leg was NOT breached, the field is just set to "" (normal default).
 *   - Tickets that already have a non-empty reason are left untouched.
 *
 * Usage:
 *   node backfillSlaBreachReason.js
 *
 * IMPORTANT:
 *   - Take a database backup before running this.
 *   - Set MONGO_URI in your env before running.
 *   - Adjust the relative import path for Ticket below to match where you
 *     place this script (assumes it sits next to your controllers/ folder,
 *     alongside models/).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Ticket from "../models/ticketSchema.js";

dotenv.config();

const PLACEHOLDER_NOTE = "Backfilled - reason not recorded";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  // Grab every ticket that has an sla object at all. We check field
  // presence in JS below rather than in the query, since $exists on a
  // nested path only tells us the key is missing, and we want to handle
  // "missing" and "empty string" the same way.
  const tickets = await Ticket.find({ sla: { $exists: true, $ne: null } });

  console.log(`Found ${tickets.length} tickets with an sla object`);

  let updated = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    try {
      let changed = false;

      // ============================
      // RESOLUTION BREACH REASON
      // ============================
      if (!ticket.sla.breachReason) {
        ticket.sla.breachReason = ticket.sla.resolutionBreached
          ? PLACEHOLDER_NOTE
          : "";
        changed = true;
      }

      // ============================
      // FIRST RESPONSE BREACH REASON
      // ============================
      if (!ticket.sla.firstResponseBreachReason) {
        ticket.sla.firstResponseBreachReason = ticket.sla.firstResponseBreached
          ? PLACEHOLDER_NOTE
          : "";
        changed = true;
      }

      if (!changed) {
        skipped++;
        continue;
      }

      await ticket.save();
      console.log(
        `${ticket._id} -> breachReason: "${ticket.sla.breachReason}", firstResponseBreachReason: "${ticket.sla.firstResponseBreachReason}"`
      );
      updated++;
    } catch (err) {
      console.error(`Failed on ${ticket._id}:`, err.message);
      skipped++;
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped (already had values): ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});