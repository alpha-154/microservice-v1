import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { addToCart, clearCart, getMyCart } from "./controllers";
import "./events/onKeyExpires";
import "./receiver";
dotenv.config();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
  });
});

// making the product service private to other api calls other than api-gateway service (http://localhost:8081)
// app.use((req, res, next) => {
//   const allowedOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin!)) {
//     res.setHeader("Access-Control-Allow-Origin", origin!);
//     next();
//   } else {
//     res.status(403).json({ message: "Forbidden!" });
//   }
// });

// routes
app.post("/cart/add-to-cart", (req, res, next) => {
  addToCart(req, res, next);
});
app.get("/cart/get-my-cart", (req, res, next) => {
  getMyCart(req, res, next);
});
app.get("/cart/clear-cart", (req, res, next) => {
  clearCart(req, res, next);
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    message: "Not found!",
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error!",
  });
});

const port = process.env.PORT || 4006;

const serviceName = process.env.SERVICE_NAME || "Cart-Service";

app.listen(port, () => {
  console.log(`Service ${serviceName} running on port ${port} 🚀`);
});
