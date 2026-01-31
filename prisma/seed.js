const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed event categories
  const categories = [
    {
      categoryName: "Under 7",
      categoryCode: "U7",
      ageLimit: 7,
      description: "Players aged 7 years and below",
      isActive: true,
    },
    {
      categoryName: "Under 9",
      categoryCode: "U9",
      ageLimit: 9,
      description: "Players aged 9 years and below",
      isActive: true,
    },
    {
      categoryName: "Under 11",
      categoryCode: "U11",
      ageLimit: 11,
      description: "Players aged 11 years and below",
      isActive: true,
    },
    {
      categoryName: "Under 13",
      categoryCode: "U13",
      ageLimit: 13,
      description: "Players aged 13 years and below",
      isActive: true,
    },
    {
      categoryName: "Under 15",
      categoryCode: "U15",
      ageLimit: 15,
      description: "Players aged 15 years and below",
      isActive: true,
    },
    {
      categoryName: "Under 17",
      categoryCode: "U17",
      ageLimit: 17,
      description: "Players aged 17 years and below",
      isActive: true,
    },
    {
      categoryName: "Open",
      categoryCode: "OPEN",
      ageLimit: null,
      description: "Open category for all ages",
      isActive: true,
    },
  ];

  for (const category of categories) {
    await prisma.eventCategory.upsert({
      where: { categoryCode: category.categoryCode },
      update: category,
      create: category,
    });
    console.log(`Category ${category.categoryName} seeded`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
