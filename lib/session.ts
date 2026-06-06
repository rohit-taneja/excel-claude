import { SignJWT, jwtVerify } from "jose";
import type { SessionUser, UserRole } from "./types";

/**
 * Edge-safe session token helpers (no `next/headers` import) so they can run in
 * middleware as well as in server components and route handlers.
 */

export const SESSION_COOKIE_NAME = "excel_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production.");
    }
    // Dev-only fallback so the app runs before env vars are configured.
    secret = "dev-only-insecure-session-secret-change-me-0123456789";
  }
  return new TextEncoder().encode(secret);
}

/** Sign a session JWT for the given user. */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userKey: user.userKey,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verify a session JWT and return the user, or null when invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userKey === "string" &&
      typeof payload.username === "string"
    ) {
      return {
        userKey: payload.userKey,
        username: payload.username,
        role: (payload.role as UserRole) ?? "learner",
      };
    }
    return null;
  } catch {
    return null;
  }
}
