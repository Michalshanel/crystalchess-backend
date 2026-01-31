const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@crystalchess.com" },
    update: {},
    create: {
      email: "admin@crystalchess.com",
      passwordHash: adminPassword,
      fullName: "System Admin",
      phone: "9999999999",
      userType: "ADMIN",
      userStatus: "ACTIVE",
      emailVerified: true,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create Demo Organizer
  const organizerPassword = await bcrypt.hash("Organizer@123", 10);
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@crystalchess.com" },
    update: {},
    create: {
      email: "organizer@crystalchess.com",
      passwordHash: organizerPassword,
      fullName: "Demo Organizer",
      phone: "8888888888",
      userType: "ORGANIZER",
      organizerApproved: true,
      userStatus: "ACTIVE",
      emailVerified: true,
    },
  });
  console.log(`Organizer user created: ${organizer.email}`);

  // Create Demo Player
  const playerPassword = await bcrypt.hash("Player@123", 10);
  const player = await prisma.user.upsert({
    where: { email: "player@crystalchess.com" },
    update: {},
    create: {
      email: "player@crystalchess.com",
      passwordHash: playerPassword,
      fullName: "Demo Player",
      phone: "7777777777",
      userType: "PLAYER",
      userStatus: "ACTIVE",
      emailVerified: true,
    },
  });
  console.log(`Player user created: ${player.email}`);

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

  // Create Flash News
  const flashNews = [
    { message: "Welcome to CrystalChess - Your Premier Chess Tournament Platform!", isActive: true },
    { message: "New tournaments added every week. Register now!", isActive: true },
    { message: "FIDE Rated tournaments coming soon. Stay tuned!", isActive: true },
  ];

  for (const news of flashNews) {
    await prisma.flashNews.create({ data: news });
  }
  console.log("Flash news created");

  // Create Sample Event
  const sampleEvent = await prisma.event.upsert({
    where: { eventId: 1 },
    update: {},
    create: {
      organizerId: organizer.userId,
      eventName: "CrystalChess Open Championship 2026",
      description: "Join us for an exciting open chess tournament! All skill levels welcome. Prizes for top performers in each category.",
      eventDates: JSON.stringify(["2026-03-15", "2026-03-16"]),
      eventStartTime: new Date("2026-03-15T09:00:00"),
      eventEndTime: new Date("2026-03-15T18:00:00"),
      location: "Chennai Chess Center",
      venueAddress: "123 Chess Street, Chennai, Tamil Nadu 600001",
      entryFee: 500.00,
      prize: "1st: ₹10,000 | 2nd: ₹5,000 | 3rd: ₹2,500",
      maxCapacity: 100,
      currentBookings: 0,
      eventType: "STATE_LEVEL",
      eventStatus: "UPCOMING",
      isFeatured: true,
    },
  });
  console.log(`Sample event created: ${sampleEvent.eventName}`);

  // Link event to categories
  const openCategory = await prisma.eventCategory.findUnique({ where: { categoryCode: "OPEN" } });
  const u17Category = await prisma.eventCategory.findUnique({ where: { categoryCode: "U17" } });

  if (openCategory) {
    await prisma.eventCategoryMapping.upsert({
      where: { unique_event_category: { eventId: sampleEvent.eventId, categoryId: openCategory.categoryId } },
      update: {},
      create: { eventId: sampleEvent.eventId, categoryId: openCategory.categoryId },
    });
  }
  if (u17Category) {
    await prisma.eventCategoryMapping.upsert({
      where: { unique_event_category: { eventId: sampleEvent.eventId, categoryId: u17Category.categoryId } },
      update: {},
      create: { eventId: sampleEvent.eventId, categoryId: u17Category.categoryId },
    });
  }
  console.log("Event categories linked");

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
