import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma";

const getEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emails = await prisma.email.findMany();
    return res.status(200).json({ data: emails });
  } catch (error) {
    next(error);
  }
};

export default getEmails;
