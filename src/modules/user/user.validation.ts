import { z } from 'zod';

const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/.test(value);

/**
 * Profile updates are deliberately strict: role, subscriptionPlan and other
 * protected fields are rejected because unknown keys are not allowed.
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(80, 'Name cannot exceed 80 characters')
      .optional(),
    image: z
      .string()
      .refine(isHttpUrl, 'Image must be a valid URL')
      .nullable()
      .optional(),
    businessName: z
      .string()
      .trim()
      .min(2, 'Business name must be at least 2 characters long')
      .max(120, 'Business name cannot exceed 120 characters')
      .optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
