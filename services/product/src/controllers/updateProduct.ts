import prisma from "@/prisma";
import { ProductUpdateDTOSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // verify the request body
    const parsedBody = ProductUpdateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({
          message: "Invalid request body",
          errors: parsedBody.error.errors,
        });
    }
    // get the product id
    const productId = req.params.id;

    // check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found!" });
    }

    // update the product
    const product = await prisma.product.update({
        where: {
            id: productId,
        },
        data: parsedBody.data,
    })

    return res.status(200).json({ data: product });
  } catch (error) {
    next(error);
  }
};

export default updateProduct;
