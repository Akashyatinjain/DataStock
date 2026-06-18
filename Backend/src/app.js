import "./config/env.js";
import express from "express"
import Helmet from "helmet"
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js"
import passport from "./modules/auth/providers/googleAuth.js";
import cookieParser from "cookie-parser";
import userRoutes from "./modules/user/user.routes.js";
import cors from "cors";
import fileRoutes from "./modules/files/file.routes.js";
import folderRoutes from "./modules/folders/folder.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import shareRoutes from "./modules/share/share.routes.js";
import paymentRoutes from "./modules/payment/Payment.Route.js";
import contactRoutes from "./modules/contact/contact.routes.js";

// Fix for Prisma BigInt serialization
BigInt.prototype.toJSON = function () {
  return Number(this);
};


const app = express();
app.set("trust proxy", 1);
const limiter = rateLimit({
    windowMs:60*1000,
    max:100
})

app.disable("x-powered-by");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://data-stock.vercel.app",
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());
app.use(
  Helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);
app.use(morgan("dev"));
app.use(limiter);
app.use(cookieParser());


// Health check route — Render pings GET / to verify the service is alive
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DataStock API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);

app.use(errorHandler);

export default app;
