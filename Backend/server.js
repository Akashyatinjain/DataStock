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
    socket.username = user.username;
    socket.email = user.email;
    socket.imageUrl = user.imageUrl;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// In-memory maps to track user locations and online presence
const activeViewers = new Map();
const onlineUsers = new Map();

const broadcastFolderUsers = (folderId) => {
  const viewersInFolder = Array.from(activeViewers.values())
    .filter((viewer) => viewer.folderId === folderId);
  
  // De-duplicate users by userId in case they have multiple tabs/sockets open
  const uniqueViewers = Array.from(new Map(viewersInFolder.map(v => [v.id, v])).values());
  io.to(`folder:${folderId}`).emit("folder_users_update", {
    folderId,
    users: uniqueViewers,
  });
};

const broadcastPresenceUpdate = () => {
  const uniqueOnline = Array.from(new Map(Array.from(onlineUsers.values()).map(u => [u.id, u])).values());
  io.emit("presence_update", uniqueOnline);
};

io.on("connection", (socket) => {
  console.log("Authenticated client connected", socket.id, socket.userId);

  // Add user to online list
  onlineUsers.set(socket.id, {
    id: socket.userId,
    username: socket.username,
    email: socket.email,
    imageUrl: socket.imageUrl,
  });
  broadcastPresenceUpdate();

  socket.on("join", (userId) => {
    if (socket.userId !== userId) {
      return;
    }
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // User views a specific folder
  socket.on("view_folder", (folderId) => {
    const previous = activeViewers.get(socket.id);
    if (previous && previous.folderId) {
      socket.leave(`folder:${previous.folderId}`);
    }

    const targetFolderId = folderId || "root";
    socket.join(`folder:${targetFolderId}`);

    activeViewers.set(socket.id, {
      id: socket.userId,
      username: socket.username,
      email: socket.email,
      imageUrl: socket.imageUrl,
      folderId: targetFolderId,
    });

    if (previous && previous.folderId && previous.folderId !== targetFolderId) {
      broadcastFolderUsers(previous.folderId);
    }
    broadcastFolderUsers(targetFolderId);
  });

  // User previews a file (join comments room)
  socket.on("join_file", (fileId) => {
    socket.join(`file:${fileId}`);
  });

  socket.on("leave_file", (fileId) => {
    socket.leave(`file:${fileId}`);
  });

  // Typing indicators inside comments
  socket.on("typing_comment", ({ fileId, isTyping }) => {
    socket.to(`file:${fileId}`).emit("typing_comment", {
      fileId,
      userId: socket.userId,
      username: socket.username,
      isTyping,
    });
  });

  socket.on("disconnect", () => {
    const viewer = activeViewers.get(socket.id);
    onlineUsers.delete(socket.id);
    activeViewers.delete(socket.id);

    if (viewer && viewer.folderId) {
      broadcastFolderUsers(viewer.folderId);
    }
    broadcastPresenceUpdate();

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
