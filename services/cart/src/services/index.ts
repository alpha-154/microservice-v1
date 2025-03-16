import { INVENTORY_SERVICE } from "@/config";
import redis from "@/redis";
import axios from "axios";

export const clearCart = async (cartSessionId: string) => {
  try {
    const data = await redis.hgetall(`cart:${cartSessionId}`);
    if (Object.keys(data)?.length === 0) {
      return;
    }
    const items = Object.keys(data).map((key) => {
      const { inventoryId, quantity } = JSON.parse(data[key]) as {
        inventoryId: string;
        quantity: number;
      };
      return {
        inventoryId,
        quantity,
        productId: key,
      };
    });
    // update the inventory
    const requests = items.map((item) => {
        return axios.put(`${INVENTORY_SERVICE}/inventories/${item.inventoryId}`, {
            quantity: item.quantity,
            actionType: 'IN'
        })
    })

    await Promise.all(requests);
    console.log("inventory updated");
    //delete the cart
    await redis.del(`cart:${cartSessionId}`);
  } catch (error) {
    console.log(error);
  }
};
