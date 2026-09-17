import prisma from "../config/db.js";

// Vibrant collaboration colors for user cursors & avatar rings
const PRESENCE_COLORS = [
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Rose
  "#3B82F6", // Blue
  "#14B8A6", // Teal
  "#F97316", // Orange
];

// In-memory registry of actively edited documents
// fileId -> { fileId, content, version, peers: Map(socketId -> peer), isDirty, lastSavedContent, saveTimer }
const activeDocuments = new Map();

class CollabService {
  /**
   * Assigns a distinct color to a collaborator based on current room size
   */
  getColorForIndex(index) {
    return PRESENCE_COLORS[index % PRESENCE_COLORS.length];
  }

  /**
   * Gets or initializes document state in memory
   */
  async getOrCreateDocument(fileId, initialContentLoader) {
    let doc = activeDocuments.get(fileId);
    if (!doc) {
      let initialContent = "";
      if (typeof initialContentLoader === "function") {
        try {
          initialContent = await initialContentLoader(fileId);
        } catch (err) {
          console.warn(`[Collab] Failed to load initial content for file ${fileId}:`, err.message);
        }
      }

      doc = {
        fileId,
        content: initialContent || "",
        version: 1,
        peers: new Map(),
        isDirty: false,
        lastSavedContent: initialContent || "",
        lastSavedAt: new Date(),
        saveTimer: null,
      };
      activeDocuments.set(fileId, doc);
    }
    return doc;
  }

  /**
   * Adds a user to the document room
   */
  async joinDocument(fileId, socket, user, initialContentLoader) {
    const doc = await this.getOrCreateDocument(fileId, initialContentLoader);

    // Pick a color for this peer
    const assignedColor = this.getColorForIndex(doc.peers.size);

    const peerInfo = {
      socketId: socket.id,
      userId: user.id || socket.userId,
      username: user.username || socket.username || "Anonymous",
      email: user.email || socket.email || "",
      imageUrl: user.imageUrl || socket.imageUrl || null,
      color: assignedColor,
      cursor: null,
      joinedAt: new Date(),
    };

    doc.peers.set(socket.id, peerInfo);

    return {
      docState: {
        fileId,
        content: doc.content,
        version: doc.version,
        isDirty: doc.isDirty,
        lastSavedAt: doc.lastSavedAt,
      },
      selfPeer: peerInfo,
      activePeers: Array.from(doc.peers.values()),
    };
  }

  /**
   * Removes a user from the document room
   */
  leaveDocument(fileId, socketId) {
    const doc = activeDocuments.get(fileId);
    if (!doc) return null;

    const departedPeer = doc.peers.get(socketId);
    doc.peers.delete(socketId);

    const remainingPeers = Array.from(doc.peers.values());

    // If no peers left in room, check if we need to flush dirty state
    return {
      fileId,
      departedPeer,
      remainingPeers,
      shouldFlush: doc.peers.size === 0 && doc.isDirty,
    };
  }

  /**
   * Applies an edit patch from a client
   */
  applyEdit(fileId, socketId, { text }) {
    const doc = activeDocuments.get(fileId);
    if (!doc) return null;

    doc.content = text;
    doc.version += 1;
    doc.isDirty = doc.content !== doc.lastSavedContent;

    return {
      version: doc.version,
      content: doc.content,
      isDirty: doc.isDirty,
      editedBySocketId: socketId,
    };
  }

  /**
   * Updates a user's cursor / selection position
   */
  updateCursor(fileId, socketId, cursorData) {
    const doc = activeDocuments.get(fileId);
    if (!doc) return null;

    const peer = doc.peers.get(socketId);
    if (!peer) return null;

    peer.cursor = cursorData;

    return {
      socketId,
      userId: peer.userId,
      username: peer.username,
      color: peer.color,
      cursor: cursorData,
    };
  }

  /**
   * Schedules debounced auto-save
   */
  scheduleAutoSave(fileId, saveCallback, delayMs = 3000) {
    const doc = activeDocuments.get(fileId);
    if (!doc) return;

    if (doc.saveTimer) {
      clearTimeout(doc.saveTimer);
    }

    doc.saveTimer = setTimeout(async () => {
      if (doc.isDirty && doc.content !== doc.lastSavedContent) {
        try {
          await saveCallback(fileId, doc.content);
          doc.lastSavedContent = doc.content;
          doc.isDirty = false;
          doc.lastSavedAt = new Date();
        } catch (err) {
          console.error(`[Collab] Auto-save error for doc ${fileId}:`, err);
        }
      }
    }, delayMs);
  }

  /**
   * Force save now (e.g. manual Ctrl+S)
   */
  async forceSave(fileId, saveCallback) {
    const doc = activeDocuments.get(fileId);
    if (!doc) return null;

    if (doc.saveTimer) {
      clearTimeout(doc.saveTimer);
      doc.saveTimer = null;
    }

    try {
      const result = await saveCallback(fileId, doc.content);
      doc.lastSavedContent = doc.content;
      doc.isDirty = false;
      doc.lastSavedAt = new Date();
      return { success: true, lastSavedAt: doc.lastSavedAt, result };
    } catch (err) {
      console.error(`[Collab] Force save error for doc ${fileId}:`, err);
      throw err;
    }
  }

  /**
   * Retrieves active document by ID
   */
  getDocument(fileId) {
    return activeDocuments.get(fileId);
  }

  /**
   * Finds any document that this socket is currently part of
   */
  findDocumentsForSocket(socketId) {
    const found = [];
    for (const [fileId, doc] of activeDocuments.entries()) {
      if (doc.peers.has(socketId)) {
        found.push(fileId);
      }
    }
    return found;
  }
}

export const collabService = new CollabService();
