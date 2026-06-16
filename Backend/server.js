import app from "./src/app.js"
import { PrismaClient } from "@prisma/client"
import { setIO } from "./src/socket.js";
import { createServer } from "http";
import { Server } from "socket.io";

const prisma = new PrismaClient()

const PORT = process.env.PORT || 5000

const httpServer = createServer(app);
 
export const io = new Server(httpServer, {
   cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://data-stock.vercel.app",
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});
setIO(io);

io.on("connection",(socket)=>{
   console.log("New client connected", socket.id);

   socket.on("join", (userId) => {
    socket.join(userId);

    console.log(
      `User ${userId} joined room`
    );
  });

   socket.on("disconnect",()=>{
      console.log("Client disconnected", socket.id);
   })
})


async function StartServer() {
  try {
    await prisma.$connect();

    console.log("Database Connected");

    httpServer.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  } catch (err) {
    console.log(err);
  }
}

StartServer()
