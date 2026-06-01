const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all products from database...');
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('✅ All products have been successfully deleted!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
