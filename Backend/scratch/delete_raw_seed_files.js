import prisma from "../src/config/db.js";

async function main() {
  try {
    const filesToDelete = [
      "Product_Launch_Presentation.pptx",
      "Basanti_Agreement_Draft.docx",
      "Financial_Projections_2026.xlsx",
      "Employment_Agreement.docx"
    ];

    // Find and delete files matching these names
    const deletedCount = await prisma.file.deleteMany({
      where: {
        fileName: {
          in: filesToDelete
        }
      }
    });

    console.log(`Successfully deleted ${deletedCount.count} raw seed files from the database.`);
  } catch (error) {
    console.error("Error deleting files:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
