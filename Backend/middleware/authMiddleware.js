import jwt from "jsonwebtoken";

/* =========================
   🔐 AUTH: VERIFY TOKEN
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

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      employeeId: decoded.employeeId,
      companyId: decoded.companyId || null,
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
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

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
        message: `Access denied`,
      });
    }

    next();
  };
};

/* =========================
   🏢 COMPANY CHECK
========================= */
export const companyCheck = (req, res, next) => {
  if (!req.user.companyId && req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Company access missing",
    });
  }

  next();
};