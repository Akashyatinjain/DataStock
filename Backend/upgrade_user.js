import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeUser() {
  const email = 'hydargamin14@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      subscriptionPlan: 'PRO',
      storageLimit: BigInt(2 * 1024 * 1024 * 1024 * 1024) // 2TB
    }
  });

  console.log(`Successfully upgraded ${email} to PRO with 2TB storage.`);
}

upgradeUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
