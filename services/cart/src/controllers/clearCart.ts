import redis from "@/redis";
import { Request, Response, NextFunction } from "express";

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // get the cartSessionId from the request header
    const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;
    if (!cartSessionId) {
      return res.status(200).json({ message: "Cart session id not found!" });
    }

    // check if the session id exists in the store
    const sessionExists = await redis.exists(`session:${cartSessionId}`);
    if (!sessionExists) {
      delete req.headers["x-cart-session-id"];
      return res.status(200).json({ message: "Cart is Empty!" });
    }
    // clear the cart ( cartSessionId & sessionId)
    await redis.del(`session:${cartSessionId}`);
    await redis.del(`cart:${cartSessionId}`);

    delete req.headers["x-cart-session-id"];
    return res.status(200).json({ message: "Cart cleared!" });
  } catch (error) {
    next(error);
  }
};

export default clearCart;
