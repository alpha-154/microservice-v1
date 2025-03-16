import { CART_TTL, INVENTORY_SERVICE } from "@/config";
import redis from "@/redis";
import { CreateCartItemDTOSchema } from "@/schemas";
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate rquest body
    const parsedBody = CreateCartItemDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        status: "error",
        message: parsedBody.error.errors,
      });
    }
    let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;
    // check if cart session id is present in the request header and exists in the store
    if (cartSessionId) {
      const exists = await redis.exists(`session:${cartSessionId}`);
      console.log("session-exists", exists);
      if (!exists) {
        cartSessionId = null;
      }
    }
    // if cart session id is not present , create a new one
    if (!cartSessionId) {
      cartSessionId = uuid();
      console.log("new-session-id", cartSessionId);
      // set the session id with the ttl in the redis store
      await redis.setex(`session:${cartSessionId}`, CART_TTL, cartSessionId);
      // set the cart session id in the response header
      res.setHeader("x-cart-session-id", cartSessionId);
    }

    // check if the inventory is available
    const { data } = await axios.get(
      `${INVENTORY_SERVICE}/inventories/${parsedBody.data.inventoryId}`
    );
    if (Number(data.quantity) < parsedBody.data.quantity) {
      return res.status(400).json({
        status: "error",
        message: "Inventory not available",
      });
    }
    //add item to the cart
    await redis.hset(
      `cart:${cartSessionId}`,
      parsedBody.data.productId, // key of the hash
      JSON.stringify({
        // value of the hash
        inventoryId: parsedBody.data.inventoryId,
        quantity: parsedBody.data.quantity,
      })
    );

    // update the inventory
    await axios.put(
      `${INVENTORY_SERVICE}/inventories/${parsedBody.data.inventoryId}`,
      {
        quantity: Number(data.quantity) - parsedBody.data.quantity,
        actionType: "OUT",
      }
    );
    return res.status(201).json({
      status: "success",
      message: "Item added to cart!",
      cartSessionId,
    });
  } catch (error) {
    next(error);
  }
};

export default addToCart;
