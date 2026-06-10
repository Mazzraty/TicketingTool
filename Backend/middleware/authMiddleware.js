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

    // ✅ ATTACH FULL SAAS CONTEXT (VERY IMPORTANT)
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      employeeId: decoded.employeeId,

      // 🔥 NEW (CRITICAL FOR SAAS)
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
   👮 ADMIN ONLY
========================= */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admins only",
    });
  }

  next();
};

/* =========================
   🧠 ROLE BASED ACCESS
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
        message: `Access denied: Requires ${allowedRoles.join(
          " or "
        )} role`,
      });
    }

    next();
  };
};

/* =========================
   🏢 COMPANY CHECK (NEW - SAAS CORE)
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