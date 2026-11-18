import { z } from 'zod';

export const createOrderSchema = z.object({
  itemId: z.string({ message: 'Menu item is required' }).min(1, 'Menu item is required'),
  deliveryDate: z
    .string({ message: 'Delivery date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be in YYYY-MM-DD format'),
  deliveryAddress: z
    .string({ message: 'Delivery address is required' })
    .trim()
    .min(10, 'Delivery address must be at least 10 characters long')
    .max(300, 'Delivery address cannot exceed 300 characters'),
  message: z.string().trim().max(500, 'Message cannot exceed 500 characters').optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
