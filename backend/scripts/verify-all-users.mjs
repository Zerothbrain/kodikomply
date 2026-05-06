import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = await prisma.user.findMany({ select: { id: true, email: true, isEmailVerified: true } });
console.log(`Found ${users.length} user(s):`);
users.forEach(u => console.log(` - [${u.id}] ${u.email}  verified=${u.isEmailVerified}`));

if (users.length > 0) {
  const result = await prisma.user.updateMany({ data: { isEmailVerified: true } });
  console.log(`\nMarked ${result.count} user(s) as verified.`);
}

await prisma.$disconnect();
