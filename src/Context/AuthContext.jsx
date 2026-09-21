import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { createAdminAuth } from "../adminAuth";
import {
  signInWithEmailAndPassword, signOut, onIdTokenChanged,
  sendEmailVerification, reload, getIdToken,
} from "firebase/auth";

const AuthContext = createContext(null);
const actions = createAdminAuth(auth, {
  signInWithEmailAndPassword, signOut, sendEmailVerification, reload, getIdToken,
});

export function AuthProvider({ children }) {
  // Firebase mutates its User object during reload. A new state wrapper also
  // re-renders route guards when the object identity has not changed.
  const [session, setSession] = useState({ user: undefined });
  useEffect(() => onIdTokenChanged(auth, user => setSession({ user: user || null })), []);
  const refreshVerification = async () => {
    const user = await actions.refreshVerification();
    setSession({ user });
  };
  return (
    <AuthContext.Provider value={{ ...actions, user: session.user, refreshVerification }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() { return useContext(AuthContext); }
