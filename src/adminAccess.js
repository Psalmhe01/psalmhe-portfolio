// Keep this identity in sync with isAdmin() in firestore.rules.
export const ADMIN_EMAIL = "psalmhe@gmail.com";
export const isAdminUser = (user) => Boolean(user && user.email === ADMIN_EMAIL && user.emailVerified);
