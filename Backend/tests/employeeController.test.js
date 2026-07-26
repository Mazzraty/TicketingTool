import test from "node:test";
import assert from "node:assert/strict";

import { getAllowedCompanyIds } from "../controllers/emplyeeController.js";

test("returns all accessible company IDs for IT support users", () => {
  const user = {
    role: "it_support",
    companyId: "64f000000000000000000001",
    companyAccess: [
      { companyId: "64f000000000000000000002", isActive: true },
      { companyId: "64f000000000000000000003", isActive: false },
    ],
  };

  assert.deepEqual(getAllowedCompanyIds(user), [
    "64f000000000000000000001",
    "64f000000000000000000002",
    "64f000000000000000000003",
  ]);
});

test("returns null for super admins so all companies are allowed", () => {
  const user = {
    role: "super_admin",
    companyId: "64f000000000000000000001",
  };

  assert.equal(getAllowedCompanyIds(user), null);
});
