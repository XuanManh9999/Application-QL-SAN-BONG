const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@football.local";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!exists) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        fullName: "System Admin",
        email: adminEmail,
        passwordHash,
        role: Role.SUPER_ADMIN,
      },
    });
    console.log("Seeded default SUPER_ADMIN: admin@football.local / Admin@123");
  } else {
    console.log("SUPER_ADMIN already exists, skip seed");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
