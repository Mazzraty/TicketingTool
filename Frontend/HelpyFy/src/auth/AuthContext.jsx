export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken());
  const [role, setRole] = useState(getStoredRole());
  const [user, setUser] = useState(getStoredUser());

  const companyId = user?.companyId || null;
  const companyName = user?.companyName || null;

  const login = (token, decodedUser) => {
    const normalizedUser = { ...decodedUser };
    const normalizedRole = normalizedUser.role || "user";

    localStorage.setItem("token", token);
    localStorage.setItem("role", normalizedRole);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(token);
    setRole(normalizedRole);
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        companyId,
        companyName,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};