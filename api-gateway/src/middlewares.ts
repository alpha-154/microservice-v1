import axios from "axios";
import { Request, Response, NextFunction } from "express";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ message: "Unauthorized!" });
  }

  try {
    const token = req.headers["authorization"].split(" ")[1];
    const { data } = await axios.post(`/auth/verify-token`, {
      accessToken: token,
    });
    req.headers["x-user-id"] = data.user.id;
    req.headers["x-user-email"] = data.user.email;
    next();
  } catch (error) {
    console.log("[auth middleware]", error);
    return res.status(401).json({ message: "Unauthorized!" });
  }
};

const middlewares = { auth };
export default middlewares;
