import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Request, RequestHandler } from 'express';
import { env } from '../config/env.js';
import { USER_ROLES, type UserRole } from '../constants/index.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthUser } from '../interfaces/auth.js';

/**
 * Better Auth (mounted on this server) signs the JWTs and exposes its
 * public keys on the JWKS endpoint. Tokens are verified here on every
 * request, so invalid or expired tokens are rejected with 401 before
 * touching any data.
 */
const jwks = createRemoteJWKSet(new URL(env.jwksUrl));

/** Verifies the Bearer token, loads the user from the DB and blocks banned accounts. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please sign in to continue.');
  }

  const token = authHeader.slice('Bearer '.length).trim();

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, jwks));
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  if (!payload.sub) {
    throw new ApiError(401, 'Invalid authentication token.');
  }

  // The database is the single source of truth — roles sent by the client are never trusted.
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'The account linked to this session no longer exists.');
  }
  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Please contact support.');
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    businessName: user.businessName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };

  next();
});

/** Restricts a route to the given roles. Wrong roles get a 403. */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required. Please sign in to continue.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };

/** Returns the authenticated user or throws 401 — use inside controllers. */
export const getCurrentUser = (req: Request): AuthUser => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required. Please sign in to continue.');
  }
  return req.user;
};

export const ALL_ROLES = USER_ROLES;
