import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import prisma from "@/prisma";

// /users/:id?field=id|authUserId   cm891b08l0002jcfjk4vsilia
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const field = req.query.field as string;
    let user: User | null = null;
   console.log("id", id, "field", field);
    if (field === "authUserId") {
      user = await prisma.user.findUnique({ where: { authUserId: id } });
    } else {
      user = await prisma.user.findUnique({ where: { id } });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
};

export default getUserById;
