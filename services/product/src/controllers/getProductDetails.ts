import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma";
import axios from "axios"; // 55.7k (gzipped: 20.5k)
import { INVENTORY_URL } from "@/config";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //console.log('Origin', req.headers.origin);

    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.inventoryId === null) {
      const { data: inventory } = await axios.post(
        `${INVENTORY_URL}/inventories`,
        {
          productId: product.id,
          sku: product.sku,
        },
        {
          headers: {
            Origin: "http://localhost:4001", // Set your desired origin
          },
        }
      );

      console.log("Inventory created successfully", inventory.id);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          inventoryId: inventory.id,
        },
      });

      console.log(
        "Product updated successfully with inventory id",
        inventory.id
      );

      return res.status(200).json({
        ...product,
        inventoryId: inventory.id,
        stock: inventory.quantity || 0,
        stockStatus: inventory.quantity > 0 ? "In stock" : "Out of stock",
      });
    }

    // fetch inventory
    const { data: inventory } = await axios.get(
      `${INVENTORY_URL}/inventories/${product.inventoryId}`,
      {
        headers: {
          Origin: "http://localhost:4001", // Set your desired origin
        },
      }
    );

    return res.status(200).json({
      ...product,
      stock: inventory.quantity || 0,
      stockStatus: inventory.quantity > 0 ? "In stock" : "Out of stock",
    });
  } catch (err) {
    // Error handling would be here
    next(err);
  }
};

export default getProductDetails;
