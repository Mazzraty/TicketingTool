import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { protect } from "../middleware/authMiddleware.js";

const firstCompanyId = "64f000000000000000000001";
const secondCompanyId = "64f000000000000000000002";

const createRequest = (token, selectedCompanyId) => ({
  headers: { authorization: `Bearer ${token}` },
  query: {},
  get: (name) => (name === "X-Company-Id" ? selectedCompanyId : undefined),
});

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("IT support can select an assigned company even when it is not active", () => {
  process.env.JWT_SECRET = "company-selector-test-secret";
  const token = jwt.sign(
    {
      id: "user-id",
      role: "it_support",
      companyId: firstCompanyId,
      companyAccess: [
        { companyId: firstCompanyId, isActive: true },
        { companyId: secondCompanyId, isActive: false },
      ],
    },
    process.env.JWT_SECRET
  );
  const req = createRequest(token, secondCompanyId);
  const res = createResponse();
  let nextCalled = false;

  protect(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.companyId, secondCompanyId);
});

test("IT support cannot select a company that is not in its access token", () => {
  process.env.JWT_SECRET = "company-selector-test-secret";
  const token = jwt.sign(
    {
      id: "user-id",
      role: "it_support",
      companyId: firstCompanyId,
      companyAccess: [{ companyId: firstCompanyId, isActive: true }],
    },
    process.env.JWT_SECRET
  );
  const req = createRequest(token, secondCompanyId);
  const res = createResponse();

  protect(req, res, () => {
    assert.fail("next should not be called for an unassigned company");
  });

  assert.equal(res.statusCode, 403);
});

test("IT support cannot select a revoked company", () => {
  process.env.JWT_SECRET = "company-selector-test-secret";
  const token = jwt.sign(
    {
      id: "user-id",
      role: "it_support",
      companyId: firstCompanyId,
      companyAccess: [
        { companyId: firstCompanyId, isActive: true },
        {
          companyId: secondCompanyId,
          isActive: false,
          revokedAt: new Date().toISOString(),
        },
      ],
    },
    process.env.JWT_SECRET
  );
  const req = createRequest(token, secondCompanyId);
  const res = createResponse();

  protect(req, res, () => {
    assert.fail("next should not be called for a revoked company");
  });

  assert.equal(res.statusCode, 403);
});
