import { getCurrentUser } from '../../middleware/auth.js';
import { User } from '../../models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination } from '../../utils/pagination.js';
import { asOptionalString } from '../../utils/query.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as userService from './user.service.js';
import { updateProfileSchema } from './user.validation.js';

/* ────────────────────────── Profile ────────────────────────── */

/** GET /api/v1/users/me */
export const getProfile = asyncHandler(async (req, res) => {
  const authUser = getCurrentUser(req);
  const user = await User.findById(authUser.id);

  return sendResponse(res, {
    message: 'Profile fetched successfully',
    data: userService.getProfile(user),
  });
});

/** PATCH /api/v1/users/me */
export const updateProfile = asyncHandler(async (req, res) => {
  const authUser = getCurrentUser(req);
  const payload = updateProfileSchema.parse(req.body);
  const user = await userService.updateProfile(authUser.id, payload);

  return sendResponse(res, { message: 'Profile updated successfully', data: user });
});

/* ────────────────────────── Admin ────────────────────────── */

/** GET /api/v1/users?search=&role=&page=&limit= */
export const listUsersForAdmin = asyncHandler(async (req, res) => {
  const result = await userService.listUsersForAdmin({
    ...parsePagination(req.query),
    search: asOptionalString(req.query.search),
    role: asOptionalString(req.query.role),
  });

  return sendResponse(res, {
    message: 'Users fetched successfully',
    data: result.users,
    meta: result.meta,
  });
});

/** GET /api/v1/users/:id */
export const getUserDetailsForAdmin = asyncHandler(async (req, res) => {
  const user = await userService.getUserDetailsForAdmin(String(req.params.id));

  return sendResponse(res, { message: 'User details fetched successfully', data: user });
});

/** PATCH /api/v1/users/:id/block */
export const blockUser = asyncHandler(async (req, res) => {
  const admin = getCurrentUser(req);
  const user = await userService.setUserBlocked(String(req.params.id), true, admin.id);

  return sendResponse(res, { message: 'User blocked successfully', data: user });
});

/** PATCH /api/v1/users/:id/unblock */
export const unblockUser = asyncHandler(async (req, res) => {
  const admin = getCurrentUser(req);
  const user = await userService.setUserBlocked(String(req.params.id), false, admin.id);

  return sendResponse(res, { message: 'User unblocked successfully', data: user });
});
