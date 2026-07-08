import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/axios.js";

const AuthContext = createContext();

/* =========================
   LOCAL STORAGE HELPERS
========================= */

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  const legacyToken = localStorage.getItem("token");

  if (legacyToken) {
    localStorage.removeItem("token");
  }

  return null;
};

const getStoredRole = () => {
  return (
    localStorage.getItem("role") ||
    getStoredUser()?.role ||
    null
  );
};

/* =========================
   AUTH PROVIDER
========================= */

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return getStoredToken() || (getStoredUser() ? "cookie" : null);
  });
  const [role, setRole] = useState(getStoredRole());
  const [user, setUser] = useState(getStoredUser());

  // Active selected company
  const [activeCompany, setActiveCompany] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("activeCompany") || "null"
      );
    } catch {
      return null;
    }
  });

  const companyId = activeCompany?._id || null;
  const companyName = activeCompany?.name || null;

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("activeCompany");

      setToken(null);
      setRole(null);
      setUser(null);
      setActiveCompany(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  /* =========================
     LOGIN
  ========================= */

  const login = (decodedUser) => {
    const normalizedUser = {
      ...decodedUser,
      companies:
        decodedUser?.companies ||
        decodedUser?.companyAccess ||
        [],
    };

    const normalizedRole =
      normalizedUser?.role || "user";

    localStorage.setItem("role", normalizedRole);
    localStorage.setItem(
      "user",
      JSON.stringify(normalizedUser)
    );

    setToken("cookie");
    setRole(normalizedRole);
    setUser(normalizedUser);

    // Auto-select first company if user has company list
    if (
      normalizedUser.companies &&
      normalizedUser.companies.length > 0
    ) {
      const firstCompany = normalizedUser.companies[0];

      localStorage.setItem(
        "activeCompany",
        JSON.stringify(firstCompany)
      );

      setActiveCompany(firstCompany);
    }
  };

  /* =========================
     SELECT COMPANY
  ========================= */

  const selectCompany = (company) => {
    localStorage.setItem(
      "activeCompany",
      JSON.stringify(company)
    );

    setActiveCompany(company);
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors and still clear local state
    }

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("activeCompany");

    setToken(null);
    setRole(null);
    setUser(null);
    setActiveCompany(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,

        // company access
        activeCompany,
        companyId,
        companyName,
        selectCompany,

        // auth
        login,
        logout,

        // setters (optional)
        setUser,
        setToken,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =========================
   CUSTOM HOOK
========================= */

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;