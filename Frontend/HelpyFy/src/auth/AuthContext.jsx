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

const getStoredCompany = () => {
  try {
    return JSON.parse(localStorage.getItem("activeCompany") || "null");
  } catch {
    return null;
  }
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
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Active selected company
  const [activeCompany, setActiveCompany] = useState(getStoredCompany);

  const activeCompanyDetails = activeCompany?.companyId || activeCompany;
  const activeCompanyId = activeCompanyDetails?._id || activeCompanyDetails;
  const companyId =
    activeCompanyId && typeof activeCompanyId.toString === "function"
      ? activeCompanyId.toString()
      : activeCompanyId || null;
  const companyName =
    activeCompanyDetails?.name || activeCompany?.companyName || null;

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = getStoredUser();

      if (storedUser) {
        setUser(storedUser);
        setRole(storedUser.role || getStoredRole());
        setToken("cookie");

        try {
          const res = await api.get("/auth/me");
          const serverUser = res.data || storedUser;
          const normalizedUser = {
            ...serverUser,
            companies:
              serverUser?.companies ||
              serverUser?.companyAccess ||
              [],
          };

          if (normalizedUser.role === "super_admin") {
            localStorage.removeItem("activeCompany");
            setActiveCompany(null);
          } else if (normalizedUser.role === "it_support") {
            const availableCompanies = (normalizedUser.companyAccess || [])
              .filter((company) => !company.revokedAt);
            const currentSelection = getStoredCompany();
            const selectedId =
              currentSelection?.companyId?._id ||
              currentSelection?.companyId ||
              currentSelection?._id ||
              currentSelection;
            const selectionIsAllowed = availableCompanies.some((company) => {
              const companyId =
                company.companyId?._id || company.companyId;
              return String(companyId) === String(selectedId);
            });

            if (!selectionIsAllowed && availableCompanies.length > 0) {
              const selectedCompany =
                availableCompanies.find((company) => company.isActive) ||
                availableCompanies[0];
              localStorage.setItem(
                "activeCompany",
                JSON.stringify(selectedCompany)
              );
              setActiveCompany(selectedCompany);
            } else if (availableCompanies.length === 0) {
              localStorage.removeItem("activeCompany");
              setActiveCompany(null);
            }
          }

          localStorage.setItem("user", JSON.stringify(normalizedUser));
          localStorage.setItem("role", normalizedUser.role || "user");
          setUser(normalizedUser);
          setRole(normalizedUser.role || "user");
          setToken("cookie");
        } catch {
          // keep the locally stored session if it exists
        }
      }

      setIsAuthReady(true);
    };

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

    restoreSession();
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

    if (normalizedRole === "super_admin") {
      localStorage.removeItem("activeCompany");
      setActiveCompany(null);
      return;
    }

    const availableCompanies = normalizedUser.companies?.filter(
      (company) => !company.revokedAt
    );
    const firstCompany =
      availableCompanies?.find((company) => company.isActive) ||
      availableCompanies?.[0];

    if (firstCompany) {
      localStorage.setItem("activeCompany", JSON.stringify(firstCompany));
      setActiveCompany(firstCompany);
    } else {
      localStorage.removeItem("activeCompany");
      setActiveCompany(null);
    }
  };

  /* =========================
     SELECT COMPANY
  ========================= */

  const selectCompany = (company) => {
    if (company) {
      localStorage.setItem("activeCompany", JSON.stringify(company));
    } else {
      localStorage.removeItem("activeCompany");
    }

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
        isAuthReady,

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