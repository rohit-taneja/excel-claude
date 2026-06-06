import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppUser, SessionUser } from "./types";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session";

/** Parse the configured users from the APP_USERS_JSON environment variable. */
export function getAppUsers(): AppUser[] {
  const raw = process.env.APP_USERS_JSON;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is AppUser =>
        typeof u === "object" &&
        u !== null &&
        typeof (u as AppUser).username === "string" &&
        typeof (u as AppUser).password === "string",
    );
  } catch {
    console.error("APP_USERS_JSON is not valid JSON.");
    return [];
  }
}

/** Verify username/password against configured users. Returns null when invalid. */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const users = getAppUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
  );

  // Plaintext comparison — passwords are stored as-is in APP_USERS_JSON.
  if (!user || user.password !== password) return null;

  return { userKey: user.userKey, username: user.username, role: user.role };
}

/** Persist a signed, HttpOnly session cookie for the user. */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Remove the session cookie (logout). */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Read and verify the current session user from the cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Require an authenticated user in a server component, else redirect to /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
