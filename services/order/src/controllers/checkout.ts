//A checkout function that:
// following controller function doing the following:
// Validates the order request using Zod schemas
// Fetches cart details and verifies items exist
// Gets product details for each cart item
// Calculates the subtotal and grand total (with tax placeholder)
// Creates an order in the database using Prisma
// Clears the cart after successful order creation
// Sends a confirmation email
// Returns the created order

import { CART_SERVICE, EMAIL_SERVICE, PRODUCT_SERVICE } from '@/config';
import prisma from '@/prisma';
import { CartItemSchema, OrderCreateDTOSchema } from '@/schemas';
import axios from 'axios';  // 55.7k (gzipped: 20.5k)
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';  // 53.9k (gzipped: 12.8k)

const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate request
    const parsedBody = OrderCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.errors });
    }

    // get cart details
    const { data: cartData } = await axios.get(`${CART_SERVICE}/cart/get-my-cart`, {
      headers: {
        'x-cart-session-id': parsedBody.data.cartSessionId,
      },
    });
    console.log("cartdata", cartData);

    const cartItems = z.array(CartItemSchema).safeParse(cartData.data);
    console.log("cartItems: ", cartItems);
    console.log("cartItems.data: ", cartItems.data);
    if (!cartItems.success) {
      return res.status(400).json({ message: cartItems.error.errors });
    }

    if (cartItems.data.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // get product details from cart items
    const productDetails = await Promise.all(
      cartItems.data.map(async (item) => {
        const { data: product } = await axios.get(
          `${PRODUCT_SERVICE}/products/${item.productId}`
        );
        console.log("product details:", product);
        return {
          productId: product.id as string,
          productName: product.name as string,
          sku: product.sku as string,
          price: product.price as number,
          quantity: item.quantity,
          total: product.price * item.quantity,
        };
      })
    );

    const subtotal = productDetails.reduce((acc, item) => acc + item.total, 0);
    console.log("subtotal: ", subtotal);

    // TODO: will handle tax calculation later
    const tax = 0;
    const grandTotal = subtotal + tax;

    // create order
    const order = await prisma.order.create({
      data: {
        userId: parsedBody.data.userId,
        userName: parsedBody.data.userName,
        userEmail: parsedBody.data.userEmail,
        subtotal,
        tax,
        grandTotal,
        orderItems: {
          create: productDetails.map((item) => ({
            ...item,
          })),
        },
      },
    });

    // clear cart
    await axios.get(`${CART_SERVICE}/cart/clear-cart`, {
      headers: {
        'x-cart-session-id': parsedBody.data.cartSessionId,
      },
    });
console.log("reacheed email")
    // send email
    await axios.post(`${EMAIL_SERVICE}/emails/send`, {
      recipient: parsedBody.data.userEmail,
      subject: 'Order Confirmation',
      body: `Thank you for your order. Your order id is ${order.id}. Your order total is $${grandTotal}`,
      source: 'Checkout',
    });

    return res.status(201).json(order);
  } catch (error) {
    // Note: The catch block opening was visible but the content wasn't shown in the images
    // I'm adding a typical error handler based on the pattern used elsewhere
    return res.status(500).json({ message: 'An error occurred during checkout' });
  }
};

export default checkout;