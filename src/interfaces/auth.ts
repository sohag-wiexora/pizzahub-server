import type { UserRole } from '../constants/index.js';

/** The authenticated user attached to the request by the auth middleware. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  businessName: string | null;
  subscriptionPlan: 'free' | 'premium';
  subscriptionExpiresAt: Date | null;
}
