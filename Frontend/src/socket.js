import { io } from "socket.io-client";
import { getToken } from "./utils/auth";
import { BACKEND_BASE_URL } from "./config/api.js";

let socketInstance = null;

const getSocketUrl = (url) => {
  if (!url) return "";
  return url.endsWith("/api") ? url.slice(0, -4) : url;
};

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(BACKEND_BASE_URL), {
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socketInstance;
};

export const connectSocket = () => {
  const socket = getSocket();
  socket.auth = { token: getToken() };

  if (!socket.connected) {
    socket.connect();
  } else {
    socket.disconnect();
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
};

export const socket = getSocket();

export default socket;
