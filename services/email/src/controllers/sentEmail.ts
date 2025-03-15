import { Response, Request, NextFunction } from "express";
import prisma from "@/prisma";
import { EmailCreateDTOSchema } from "@/schemas";
import { defaultSender, transporter } from "@/config";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the request body
    const parsedBody = EmailCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: parsedBody.error.errors });
    }
    // Create the email mail option
    const { sender, recipient, subject, body, source } = parsedBody.data;
    const from = sender || defaultSender;
    const emailOption = {
      from,
      to: recipient,
      subject,
      text: body,
    };
    //send the email
    const { rejected } = await transporter.sendMail(emailOption);

    if (rejected.length > 0) {
      return res.status(500).json({ message: "Email could not be sent!" });
    }

    const email = await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
      },
    });
    res.status(201).json({ message: "Email sent successfully!", email });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
