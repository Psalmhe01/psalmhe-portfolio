// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { isAdminUser } from "../adminAccess";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!isAdminUser(result.user)) {
      await signOut(auth);
      throw new Error("Sign in with the verified photographer admin account.");
    }
    return result;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
