const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with sample products...');

  // Clear existing records
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Create sample products
  const p1 = await prisma.product.create({
    data: {
      name: "Kids Premium Cotton T-Shirt",
      description: "Soft, breathable, 100% premium cotton everyday t-shirt for kids.",
      price: 499,
      category: "kids",
      images: ["https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=500&q=80"],
      sizes: ["2-3 Yrs", "3-4 Yrs", "4-5 Yrs"],
      tag: "Best Seller",
      isActive: true
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Men's Classic Denim Jacket",
      description: "Timeless denim jacket styled for comfort and modern style.",
      price: 1899,
      category: "men",
      images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=500&q=80"],
      sizes: ["M", "L", "XL"],
      tag: "New Arrival",
      isActive: true
    }
  });

  console.log(`✅ Seeding complete! Added products: \n - ${p1.name} \n - ${p2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
