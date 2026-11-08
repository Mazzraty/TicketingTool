import test from "node:test";
import assert from "node:assert/strict";
import Ticket from "../models/ticketSchema.js";

test("HR is a valid ticket creator role", () => {
  const ticket = new Ticket({
    companyId: new Ticket.base.Types.ObjectId(),
    title: "HR-created ticket",
    description: "Testing HR ticket creation",
    createdByType: "hr",
  });

  assert.equal(ticket.validateSync(), undefined);
});
