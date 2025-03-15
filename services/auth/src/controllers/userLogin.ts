import { Response, Request, NextFunction } from "express";
import prisma from "@/prisma";
import { UserLoginDTOSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginAttempt } from "@prisma/client";

type LoginHistory = {
  userId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  await prisma.loginHistory.create({
    data: {
      userId: info.userId,
      userAgent: info.userAgent,
      ipAddress: info.ipAddress,
      attempt: info.attempt,
    },
  });
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = req.headers["user-agent"] || "";
    // parsed the request body
    const parsedBody = UserLoginDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: parsedBody.error.errors });
    }

    //check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });
    if (!existingUser) {
     
      return res.status(400).json({ message: "User does not exist" });
    }

    //check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(
      parsedBody.data.password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      await createLoginHistory({
        userId: existingUser.id,
        userAgent,
        ipAddress,
        attempt: "FAILED",
      });
      return res.status(400).json({ message: "Password is incorrect" });
    }

    if (!existingUser.verified) {
      await createLoginHistory({
        userId: existingUser.id,
        userAgent,
        ipAddress,
        attempt: "FAILED",
      });
      return res.status(307).json({ message: "User is not verified" });
    }

    // check if the user is active
    if (existingUser.status !== "ACTIVE") {
      await createLoginHistory({
        userId: existingUser.id,
        userAgent,
        ipAddress,
        attempt: "FAILED",
      });
      return res.status(400).json({
        message: `your accout is ${existingUser.status.toLocaleLowerCase()}`,
      });
    }
    // generate access token
    const accessToken = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      },
      process.env.JWT_SECRET ?? "secret",
      {
        expiresIn: "2h",
      }
    );

    await createLoginHistory({
      userId: existingUser.id,
      userAgent,
      ipAddress,
      attempt: "SUCCESS",
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
