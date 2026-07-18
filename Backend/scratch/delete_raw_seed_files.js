import prisma from "../src/config/db.js";

async function main() {
  try {
    const filesToDelete = [
      "Brand_Styleguide.pdf",
      "Dashboard_Mockup_V1.png",
      "Secure_Credentials.key",
      "Sprint_Demo_Recording.mp4",
      "Team_Photo.jpg",
      "Investor_Pitch_Deck.pdf",
      "Promotional_Video_Teaser.mp4",
      "Standard_NDA.pdf",
      "Product_Launch_Presentation.pptx",
      "Basanti_Agreement_Draft.docx",
      "Financial_Projections_2026.xlsx",
      "Employment_Agreement.docx"
    ];

    const foldersToDelete = [
      "Basanti",
      "Project Pitch",
      "Legal Templates"
    ];

    // Delete files first
    const deletedFiles = await prisma.file.deleteMany({
      where: {
        OR: [
          { fileName: { in: filesToDelete } },
          { originalName: { in: filesToDelete } }
        ]
      }
    });
    console.log(`Successfully deleted ${deletedFiles.count} seeded files.`);

    // Delete folders
    const deletedFolders = await prisma.folder.deleteMany({
      where: {
        name: { in: foldersToDelete }
      }
    });
    console.log(`Successfully deleted ${deletedFolders.count} seeded folders.`);

    // Reset storage used to 0 for users who had seeded files
    const users = await prisma.user.findMany({
      select: { id: true }
    });
    for (const user of users) {
      const activeFiles = await prisma.file.findMany({
        where: { ownerId: user.id, isTrash: false }
      });
      const storageUsed = activeFiles.reduce((sum, file) => sum + file.size, 0);
      await prisma.user.update({
        where: { id: user.id },
        data: { storageUsed }
      });
    }
    console.log("Recalculated storage for all users.");

  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
