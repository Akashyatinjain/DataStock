import "./src/config/env.js";
import app from "./src/app.js";
import { PrismaClient } from "@prisma/client";
import { setIO } from "./src/socket.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cookie from "cookie";
import { verifyAccessToken } from "./src/utils/token.utils.js";
import { validateAccessPayload } from "./src/utils/authSession.utils.js";
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://data-stock.vercel.app",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

setIO(io);

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const cookieHeader = socket.handshake.headers?.cookie;
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
    const token = authToken || cookies.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyAccessToken(token);
    const user = await validateAccessPayload(decoded);

    if (!user) {
      return next(new Error("Invalid or revoked session"));
    }

    socket.userId = user.id;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated client connected", socket.id, socket.userId);

  socket.on("join", (userId) => {
    if (socket.userId !== userId) {
      return;
    }

    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

async function StartServer() {
  try {
    await prisma.$connect();
    console.log("Database Connected");

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

StartServer();
