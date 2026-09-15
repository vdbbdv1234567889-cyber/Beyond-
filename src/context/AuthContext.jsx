import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "admin_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  function login(newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
