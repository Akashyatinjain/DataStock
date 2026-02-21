import app from "./src/app.js"
import { Prisma } from "@prisma/client"

const port = process.env.DATABASE_URL || 3000;

async function StartServer() {
    try{
       await Prisma.$connect();
       console.log("Database connected successfully");

       app.listen(port, () => {
       console.log(`Server running on port ${port}`);
    });

    }
    catch(err){
        console.log("Internal Connection Isuue");
        process.exit(1);
    }
}
StartServer();