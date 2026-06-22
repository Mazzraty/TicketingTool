import jwt from "jsonwebtoken";

/* =========================
   🔐 PROTECT MIDDLEWARE
   MULTI-TENANT SAFE VERSION
========================= */

/* =========================
   🔐 PROTECT MIDDLEWARE
   MULTI-TENANT SAFE VERSION (FIXED)
========================= */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIXED USER OBJECT (STAFFCODE VERSION)
    const activeCompany =
      decoded.companyAccess?.find((c) => c.isActive && c.companyId) ||
      decoded.companyAccess?.[0] ||
      null;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,

      // ❌ OLD: employeeId
      // employeeId: decoded.employeeId,

      // ✅ NEW: staffCode
      staffCode: decoded.staffCode || null,

      // ACTIVE TENANT
      companyId: decoded.companyId || null,
      companyName: activeCompany?.companyName || null,

      // MULTI-COMPANY ACCESS
      companyAccess: decoded.companyAccess || [],
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/* =========================
   🔐 ADMIN ONLY
========================= */
export const adminOnly = (req, res, next) => {
  const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admins only",
    });
  }

  next();
};

/* =========================
   👑 SUPER ADMIN ONLY
========================= */
export const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Super admins only",
    });
  }

  next();
};

/* =========================
   🧠 ROLE CHECK
========================= */
export const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

/* =========================
   🏢 COMPANY CHECK
   ✅ Multi-tenant safe
========================= */
export const companyCheck = (req, res, next) => {
  // ✅ Super admin has access to everything
  if (req.user.role === "super_admin") {
    return next();
  }

  // ✅ User must have a company assigned
  if (!req.user.companyId) {
    return res.status(403).json({
      success: false,
      message: "Company access missing - no active company",
    });
  }

  next();
};

/* =========================
   🏢 MULTI-COMPANY CHECK
   Verify user has access to specific company
========================= */
export const verifyCompanyAccess = (req, res, next) => {
  const companyIdParam = req.params.companyId || req.body.companyId;

  if (!companyIdParam) {
    return next();  // If no company specified, skip this check
  }

  // ✅ Super admin can access any company
  if (req.user.role === "super_admin") {
    return next();
  }

  // ✅ Check if user has access to the requested company
  const companyIdString = companyIdParam?.toString?.();

  const hasAccess =
    req.user.companyId?.toString?.() === companyIdString ||
    req.user.companyAccess?.some(
      (c) => c.companyId?.toString?.() === companyIdString && c.isActive
    );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "You don't have access to this company",
    });
  }

  next();
};

/* =========================
   🏢 TENANT ISOLATION
   Ensure queries are scoped to user's company
========================= */
export const tenantIsolation = (req, res, next) => {
  // ✅ Attach active companyId for automatic query filtering
  req.companyFilter = req.user.role === "super_admin"
    ? {}
    : { companyId: req.user.companyId };

  next();
};