import "./src/config/env.js";
import app from "./src/app.js";
import prisma from "./src/config/db.js";
import { setIO } from "./src/socket.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cookie from "cookie";
import { verifyAccessToken } from "./src/utils/token.utils.js";
import { validateAccessPayload } from "./src/utils/authSession.utils.js";
import { startScheduler } from "./src/services/scheduler.js";
import { initQueuesAndWorkers } from "./src/queues/index.js";
import { collabService } from "./src/services/collab.service.js";
import { saveFileContentService } from "./src/modules/files/file.service.js";
import { checkFileAccess } from "./src/utils/permission.js";
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
    const authToken = socket.handshake.auth?.token; // waiting for the token from the frontend
    const cookieHeader = socket.handshake.headers?.cookie; // save the cookies 
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
    if (fileId) {
      socket.join(`file:${String(fileId)}`);
    }
  });

  socket.on("leave_file", (fileId) => {
    if (fileId) {
      socket.leave(`file:${String(fileId)}`);
    }
  });

  // Typing indicators inside comments
  socket.on("typing_comment", ({ fileId, isTyping }) => {
    if (fileId) {
      socket.to(`file:${String(fileId)}`).emit("typing_comment", {
        fileId: String(fileId),
        userId: socket.userId,
        username: socket.username,
        isTyping,
      });
    }
  });

  // ── Collaborative Workspace Real-Time Synchronization ──
  socket.on("collab:join", async ({ fileId }) => {
    try {
      if (!fileId) return;

      const access = await checkFileAccess(fileId, socket.userId);
      if (!access) {
        socket.emit("collab:error", { message: "Unauthorized: No access to this document", fileId });
        return;
      }

      socket.join(`collab:doc:${fileId}`);

      const result = await collabService.joinDocument(
        fileId,
        socket,
        {
          id: socket.userId,
          username: socket.username,
          email: socket.email,
          imageUrl: socket.imageUrl,
        },
        async (fId) => {
          const file = await prisma.file.findUnique({ where: { id: fId } });
          if (file?.url) {
            const resp = await fetch(file.url);
            if (resp.ok) return await resp.text();
          }
          return "";
        }
      );

      socket.emit("collab:init_state", {
        ...result.docState,
        selfPeer: result.selfPeer,
        activePeers: result.activePeers,
        permission: access.permission,
      });

      socket.to(`collab:doc:${fileId}`).emit("collab:peer_joined", {
        fileId,
        peer: result.selfPeer,
      });
    } catch (err) {
      console.error("[Collab] Error in collab:join:", err);
      socket.emit("collab:error", { message: err.message, fileId });
    }
  });

  socket.on("collab:leave", ({ fileId }) => {
    if (!fileId) return;
    socket.leave(`collab:doc:${fileId}`);
    const leaveRes = collabService.leaveDocument(fileId, socket.id);
    if (leaveRes) {
      io.to(`collab:doc:${fileId}`).emit("collab:peer_left", {
        fileId,
        socketId: socket.id,
        userId: socket.userId,
        remainingPeers: leaveRes.remainingPeers,
      });
      if (leaveRes.shouldFlush) {
        collabService.forceSave(fileId, async (id, content) => {
          return await saveFileContentService(id, content, socket.userId);
        }).catch((e) => console.warn("[Collab] Auto-flush on empty room failed:", e.message));
      }
    }
  });

  socket.on("collab:edit", async ({ fileId, text }) => {
    try {
      if (!fileId || typeof text !== "string") return;

      const editResult = collabService.applyEdit(fileId, socket.id, { text });
      if (!editResult) return;

      // Broadcast remote edit to all other peers in the room
      socket.to(`collab:doc:${fileId}`).emit("collab:remote_edit", {
        fileId,
        text: editResult.content,
        version: editResult.version,
        editedBy: socket.userId,
        username: socket.username,
        socketId: socket.id,
      });

      // Schedule debounced auto-save
      collabService.scheduleAutoSave(fileId, async (id, content) => {
        return await saveFileContentService(id, content, socket.userId);
      }, 3000);
    } catch (err) {
      console.error("[Collab] Error in collab:edit:", err);
    }
  });

  socket.on("collab:cursor", ({ fileId, cursor }) => {
    if (!fileId) return;
    const cursorInfo = collabService.updateCursor(fileId, socket.id, cursor);
    if (cursorInfo) {
      socket.to(`collab:doc:${fileId}`).emit("collab:remote_cursor", {
        fileId,
        ...cursorInfo,
      });
    }
  });

  socket.on("collab:typing", ({ fileId, isTyping }) => {
    if (!fileId) return;
    socket.to(`collab:doc:${fileId}`).emit("collab:remote_typing", {
      fileId,
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      isTyping,
    });
  });

  socket.on("collab:save_now", async ({ fileId }) => {
    try {
      if (!fileId) return;
      const saveRes = await collabService.forceSave(fileId, async (id, content) => {
        return await saveFileContentService(id, content, socket.userId);
      });
      io.to(`collab:doc:${fileId}`).emit("collab:save_status", {
        fileId,
        status: "SAVED",
        savedAt: saveRes.lastSavedAt,
        versionNumber: saveRes.result?.versionNumber,
      });
    } catch (err) {
      socket.emit("collab:save_status", {
        fileId,
        status: "ERROR",
        error: err.message,
      });
    }
  });

  socket.on("disconnect", () => {
    const viewer = activeViewers.get(socket.id);
    onlineUsers.delete(socket.id);
    activeViewers.delete(socket.id);

    if (viewer && viewer.folderId) {
      broadcastFolderUsers(viewer.folderId);
    }
    broadcastPresenceUpdate();

    // Cleanup active collaborative document rooms for this socket
    const userCollabDocs = collabService.findDocumentsForSocket(socket.id);
    for (const docId of userCollabDocs) {
      const leaveRes = collabService.leaveDocument(docId, socket.id);
      if (leaveRes) {
        io.to(`collab:doc:${docId}`).emit("collab:peer_left", {
          fileId: docId,
          socketId: socket.id,
          userId: socket.userId,
          remainingPeers: leaveRes.remainingPeers,
        });
        if (leaveRes.shouldFlush) {
          collabService.forceSave(docId, async (id, content) => {
            return await saveFileContentService(id, content, socket.userId);
          }).catch((e) => console.warn("[Collab] Flush on disconnect failed:", e.message));
        }
      }
    }

    console.log("Client disconnected", socket.id);
  });
});

async function StartServer() {
  const maxRetries = 5;
  let attempt = 0;
  let connected = false;

  while (attempt < maxRetries && !connected) {
    try {
      attempt++;
      console.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
      await prisma.$connect();
      connected = true;
      console.log("Database Connected successfully");
    } catch (err) {
      console.warn(`Database connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log("Retrying database connection in 3 seconds (waiting for serverless DB wake-up)...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        console.error("Could not connect to database after maximum retries:", err);
        process.exit(1);
      }
    }
  }

  // Start background automated jobs scheduler
  startScheduler();

  // Start BullMQ background queues & workers (OCR & Emails)
  initQueuesAndWorkers();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

StartServer();
