import { z } from 'zod';

/** Body for POST /api/v1/favorites/toggle — id of the item to toggle. */
export const toggleFavoriteSchema = z.object({
  itemId: z
    .string({ message: 'Menu item id is required' })
    .trim()
    .min(1, 'Menu item id is required'),
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
