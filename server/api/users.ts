import { getSession, requireAuthenticatedUser, signOut } from "@modules/auth";

export const usersEndpoint = {
  session: getSession,
  current: requireAuthenticatedUser,
  signOut,
};
