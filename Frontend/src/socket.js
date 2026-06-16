import { io } from "socket.io-client";
import { BACKEND_BASE_URL } from "./api/axios";

const getSocketUrl = (url) => {
  if (!url) return "";
  return url.endsWith("/api") ? url.slice(0, -4) : url;
};

const socketUrl = getSocketUrl(BACKEND_BASE_URL);
console.log("Connecting Socket.io to:", socketUrl);

export const socket = io(
  socketUrl,
  {
    withCredentials: true,
  }
);

socket.on("connect", () => {
  console.log("Socket.io connected successfully! ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket.io connection error:", error);
});
