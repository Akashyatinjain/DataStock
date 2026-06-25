import prisma from "./src/config/db.js";

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        imageUrl: true,
      }
    });
    console.log("USERS IN DATABASE:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Database query error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
