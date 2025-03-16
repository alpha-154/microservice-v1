import { z } from "zod";

export const OrderCreateDTOSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    userEmail: z.string().email(),
    cartSessionId: z.string(),
})

export const CartItemSchema = z.object({
    inventoryId: z.string(),
    quantity: z.number(),
    productId: z.string()
})