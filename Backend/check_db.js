import prisma from "./src/config/db.js";

async function main() {
  try {
    const files = await prisma.file.findMany({
      select: {
        id: true,
        fileName: true,
        owner: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    console.log("FILES IN DATABASE:", JSON.stringify(files, null, 2));

    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    console.log("FOLDERS IN DATABASE:", JSON.stringify(folders, null, 2));
  } catch (error) {
    console.error("Database query error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
