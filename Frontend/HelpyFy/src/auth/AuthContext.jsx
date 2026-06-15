export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken());
  const [role, setRole] = useState(getStoredRole());
  const [user, setUser] = useState(getStoredUser());

  // 🏢 NEW: active company (selected by user)
  const [activeCompany, setActiveCompany] = useState(
    JSON.parse(localStorage.getItem("activeCompany")) || null
  );

  const companyId = activeCompany?._id || null;
  const companyName = activeCompany?.name || null;

  const login = (token, decodedUser) => {
    const normalizedUser = {
      ...decodedUser,
      companies: decodedUser.companies || [], // IMPORTANT for multi-company
    };

    const normalizedRole = normalizedUser.role || "user";

    localStorage.setItem("token", token);
    localStorage.setItem("role", normalizedRole);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(token);
    setRole(normalizedRole);
    setUser(normalizedUser);
  };

  // 🏢 NEW: select company after login
  const selectCompany = (company) => {
    localStorage.setItem("activeCompany", JSON.stringify(company));
    setActiveCompany(company);
  };

  const logout = () => {
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

        // 🏢 company system
        activeCompany,
        companyId,
        companyName,
        selectCompany,

        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};