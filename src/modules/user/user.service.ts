import { USER_ROLES, type UserRole } from '../../constants/index.js';
import { User, type UserDocument } from '../../models/user.model.js';
import { ApiError } from '../../utils/apiError.js';
import type { Pagination } from '../../utils/pagination.js';
import { buildMeta } from '../../utils/pagination.js';
import { escapeRegex } from '../../utils/query.js';
import type { UpdateProfileInput } from './user.validation.js';

const USER_LIST_FIELDS = 'name email image role isBlocked businessName subscriptionPlan createdAt';

/* ────────────────────────── Profile ────────────────────────── */

export const getProfile = (user: UserDocument | null): UserDocument => {
  if (!user) {
    throw new ApiError(404, 'Account not found.');
  }
  return user;
};

export const updateProfile = async (userId: string, payload: UpdateProfileInput) => {
  const updates: Record<string, unknown> = {};

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.image !== undefined) updates.image = payload.image;
  if (payload.businessName !== undefined) updates.businessName = payload.businessName;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { returnDocument: 'after' },
  );
  if (!user) {
    throw new ApiError(404, 'Account not found.');
  }
  return user;
};

/* ────────────────────────── Admin ────────────────────────── */

export interface UserListOptions extends Pagination {
  search?: string;
  role?: string;
}

/** Public-safe projection of a user document (internal fields stripped). */
const pickPublicUser = (user: UserDocument) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  isBlocked: user.isBlocked,
  businessName: user.businessName,
  subscriptionPlan: user.subscriptionPlan,
  subscriptionExpiresAt: user.subscriptionExpiresAt,
  createdAt: user.createdAt,
});

const loadUserOr404 = async (userId: string): Promise<UserDocument> => {
  // Better Auth generates its own string ids — they are not always valid ObjectIds.
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
};

export const listUsersForAdmin = async (options: UserListOptions) => {
  const { page, limit, skip, search, role } = options;

  const filters: Record<string, unknown> = {};

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    filters.$or = [{ name: pattern }, { email: pattern }];
  }
  if (role && (USER_ROLES as readonly string[]).includes(role)) {
    filters.role = role as UserRole;
  }

  const [users, total] = await Promise.all([
    User.find(filters).select(USER_LIST_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters),
  ]);

  return { users, meta: buildMeta(total, { page, limit }) };
};

export const getUserDetailsForAdmin = async (userId: string) => {
  const user = await loadUserOr404(userId);
  return pickPublicUser(user);
};

/** Blocks or unblocks a user. Admin accounts can never be blocked. */
export const setUserBlocked = async (userId: string, isBlocked: boolean, adminId: string) => {
  const user = await loadUserOr404(userId);

  if (user.role === 'admin') {
    throw new ApiError(403, 'Admin accounts cannot be blocked.');
  }
  if (isBlocked && user._id === adminId) {
    throw new ApiError(400, 'You cannot block your own account.');
  }

  user.isBlocked = isBlocked;
  await user.save();

  return pickPublicUser(user);
};
