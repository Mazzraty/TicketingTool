import cron from "node-cron";
import Ticket from "../models/ticketSchema.js";
import Notification from "../models/notifcationSchema.js";
import User from "../models/userShema.js";

const DEFAULT_RATING = 5;

export const autoCloseResolvedTickets = async () => {
  const now = new Date();

  const due = await Ticket.find({
    status: "Resolved",
    autoCloseAt: { $ne: null, $lte: now },
  }).select("_id rating userId companyId title ticketNumber");

  for (const t of due) {
    try {
      const needsDefaultRating = !t.rating || t.rating === 0;

      const $set = {
        status: "Closed",
        closedAt: now,
        autoCloseAt: null,
      };

      if (needsDefaultRating) {
        $set.rating = DEFAULT_RATING;
        $set.ratingSource = "auto";
        $set.reviewedAt = now;
      }

      // Atomic: only closes if the ticket is STILL Resolved, still due, and
      // the rating hasn't changed. If the user reopened/rated in between,
      // this matches nothing and is skipped.
      const closed = await Ticket.findOneAndUpdate(
        {
          _id: t._id,
          status: "Resolved",
          autoCloseAt: { $ne: null, $lte: now },
          rating: t.rating,
        },
        {
          $set,
          $push: {
            statusHistory: {
              status: "Closed",
              changedAt: now,
              note: needsDefaultRating
                ? "Auto-closed after 7 days. No rating submitted, default 5-star rating applied."
                : "Auto-closed after 7 days with no further action.",
            },
          },
        },
        { new: true }
      );

      if (!closed) continue;

      // Notify the employee
      if (closed.userId) {
        await Notification.create({
          userId: closed.userId,
          companyId: closed.companyId,
          title: "Ticket Closed",
          message: needsDefaultRating
            ? `Ticket ${closed.ticketNumber} was auto-closed after 7 days. A default 5-star rating was applied.`
            : `Ticket ${closed.ticketNumber} was auto-closed after 7 days.`,
          type: "status",
        });
      }

      // Notify admins
      const admins = await User.find({
        companyId: closed.companyId,
        role: { $in: ["company_admin", "it_support"] },
      }).select("_id");

      if (admins.length) {
        await Notification.insertMany(
          admins.map((a) => ({
            userId: a._id,
            companyId: closed.companyId,
            title: "Ticket Auto-Closed",
            message: `${closed.ticketNumber} - ${closed.title} was auto-closed`,
            type: "status",
          }))
        );
      }
    } catch (err) {
      console.error(`Auto-close failed for ${t._id}:`, err.message);
    }
  }

  if (due.length) console.log(`Auto-close checked ${due.length} ticket(s)`);
};

// Runs every 15 minutes
cron.schedule("*/15 * * * *", () => {
  autoCloseResolvedTickets().catch((e) =>
    console.error("Auto-close cron error:", e.message)
  );
});