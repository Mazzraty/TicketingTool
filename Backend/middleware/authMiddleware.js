import jwt from "jsonwebtoken";

/**
 * 🔐 AUTH: Verify JWT Token
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ❌ No token
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  // ❌ Invalid format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email || null,
      employeeId: decoded.employeeId
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * 👮 ADMIN ONLY
 */
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

/**
 * 🧠 ROLE BASED ACCESS (NEW - SAP STYLE FLEXIBLE SECURITY)
 * Example: roleCheck("admin", "manager")
 */
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
        message: `Access denied: Requires ${allowedRoles.join(" or ")} role`,
      });
    }

    next();
  };
};