import { ADMIN_EMAIL, isAdminUser } from "./adminAccess.js";

// Dependencies are supplied by AuthContext; no provider secrets are needed.
export function createAdminAuth(auth, sdk) {
  const photographer = () => {
    const user = auth.currentUser;
    if (!user || user.email !== ADMIN_EMAIL) throw new Error("Sign in with the authorized photographer account.");
    return user;
  };
  return {
    async login(email, password) {
      const result = await sdk.signInWithEmailAndPassword(auth, email.trim(), password);
      if (result.user.email !== ADMIN_EMAIL) {
        await sdk.signOut(auth);
        throw new Error("This account is not authorized to manage this website. Use the photographer account.");
      }
      // Keep the account signed in so it can request verification, but the
      // route guard and Firestore rules continue to deny admin access.
      if (!isAdminUser(result.user)) throw new Error("Verify your email address before opening the admin dashboard.");
      await sdk.getIdToken(result.user, true);
      return result;
    },
    async sendVerification() {
      const user = photographer();
      if (!user.emailVerified) await sdk.sendEmailVerification(user);
    },
    async refreshVerification() {
      const user = photographer();
      await sdk.reload(user);
      if (auth.currentUser !== user) throw new Error("Your session changed. Please sign in again.");
      await sdk.getIdToken(user, true);
      if (!isAdminUser(user)) throw new Error("Your email is not verified yet. Open the link in your verification email, then try again.");
      return user;
    },
    logout: () => sdk.signOut(auth),
  };
}
