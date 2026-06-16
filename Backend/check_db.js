import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      subscriptionPlan: true,
      subscriptionId: true,
      storageLimit: true,
      storageUsed: true,
    }
  });

  console.log("Users:", users);
  
  // also get the first user and format BigInt properly for display
  if (users.length > 0) {
    console.log("First user storage limit:", users[0].storageLimit?.toString(), "bytes");
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
