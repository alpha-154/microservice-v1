import { z } from "zod";

export const CreateCartItemDTOSchema = z.object({
    productId: z.string(),
    quantity: z.number(),
    inventoryId: z.string()
});