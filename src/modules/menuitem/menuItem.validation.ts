import { z } from 'zod';
import { PIZZA_CATEGORIES } from '../../constants/index.js';

const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/.test(value);

export const createMenuItemSchema = z.object({
  itemName: z
    .string({ message: 'Item name is required' })
    .trim()
    .min(3, 'Item name must be at least 3 characters long')
    .max(100, 'Item name cannot exceed 100 characters'),
  category: z.enum(PIZZA_CATEGORIES, { message: 'Please select a valid pizza category' }),
  description: z
    .string({ message: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(1000, 'Description cannot exceed 1000 characters'),
  price: z.coerce
    .number({ message: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(100000, 'Price is unreasonably high'),
  location: z
    .string({ message: 'Location is required' })
    .trim()
    .min(2, 'Location must be at least 2 characters long')
    .max(100, 'Location cannot exceed 100 characters'),
  images: z
    .array(z.string().refine(isHttpUrl, 'Each image must be a valid URL'))
    .min(1, 'At least one item image is required')
    .max(5, 'A menu item can have at most 5 images'),
});

/** Vendors may only toggle availability; approval stays with the admin. */
export const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .extend({
    status: z
      .enum(['approved', 'inactive'], {
        message: 'Status can only be switched between approved and inactive',
      })
      .optional(),
  });

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
