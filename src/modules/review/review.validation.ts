import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce
    .number({ message: 'Rating is required' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string({ message: 'Review comment is required' })
    .trim()
    .min(5, 'Review comment must be at least 5 characters long')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
