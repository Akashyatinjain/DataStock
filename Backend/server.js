import app from "./src/app.js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PORT = process.env.PORT || 5000

async function StartServer() {
   try {
      await prisma.$connect()
      console.log("Database Connected")

      app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`)
      })

   } catch (err) {
      console.log("Internal Connection Issue", err)
   }
}

StartServer()