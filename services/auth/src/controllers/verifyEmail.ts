import { Response, Request, NextFunction } from "express";
import prisma from "@/prisma";
import { EmailVerificationSchema } from "@/schemas";
import axios from "axios";
import { EMAIL_SERVICE } from "@/config";

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // validate the request body
    const parsedBody = EmailVerificationSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: parsedBody.error.errors });
    }
    // check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });
    if (!existingUser) {
      return res.status(400).json({ message: "User does not exist!" });
    }
    // find the verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: existingUser.id,
        code: parsedBody.data.code,
      },
    });
    if (!verificationCode) {
      return res.status(400).json({ message: "Invalid verification code!" });
    }
    // check if the code is expired
    if (verificationCode.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Verification code has expired!" });
    }

    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        verified: true,
        status: "ACTIVE",
      },
    });

    // Update verification code status to used
    await prisma.verificationCode.update({
      where: {
        id: verificationCode.id,
      },
      data: {
        status: "USED",
        verifiedAt: new Date(),
      },
    });

    // send success email
    await axios.post(`${EMAIL_SERVICE}/emails/send`, {
      recipient: existingUser.email,
      subject: "Email verification success",
      body: `Your email has been verified successfully!`,
      source: "verfiy-email",
    });

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    next(error);
  }
};

export default verifyEmail;
