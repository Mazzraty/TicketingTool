import test from "node:test";
import assert from "node:assert/strict";

import { buildNotificationFilter } from "../controllers/notificationController.js";

test("scopes notifications to the active company for company admins", () => {
  const filter = buildNotificationFilter({
    id: "user-1",
    role: "company_admin",
    companyId: "company-1",
  });

  assert.deepEqual(filter, {
    userId: "user-1",
    companyId: "company-1",
  });
});

test("keeps a safe fallback when the user has no active company", () => {
  const filter = buildNotificationFilter({
    id: "user-2",
    role: "user",
    companyId: null,
  });

  assert.deepEqual(filter, {
    userId: "user-2",
  });
});
