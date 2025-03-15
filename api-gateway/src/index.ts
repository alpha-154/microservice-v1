import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { configureRoutes } from "./utils";

dotenv.config();

const app = express();

// security middleware
app.use(helmet());

// rate limit middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res) => {
        res.status(429).json({
            message: "Too many requests, please try again later",
        });
    }
});

app.use("/api", limiter);

// request logger 
app.use(morgan("dev"));
app.use(express.json());

// auth middleware
const port = process.env.PORT || 8081;

//error handler middleware
const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
};

configureRoutes(app);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});


app.listen(port, () => {
    console.log(`API Gateway is running on port ${port}`);
})