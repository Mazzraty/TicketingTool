import test from "node:test";
import assert from "node:assert/strict";

import { getCompanyFilter } from "../controllers/dashboardController.js";

test("super admin can filter by a single company when companyId is provided", () => {
  const user = { role: "super_admin" };

  assert.deepEqual(getCompanyFilter(user, { companyId: "company-123" }), {
    companyId: "company-123",
  });
});

test("super admin without company filter sees all companies", () => {
  const user = { role: "super_admin" };

  assert.deepEqual(getCompanyFilter(user), {});
});
