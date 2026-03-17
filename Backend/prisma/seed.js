const { PrismaClient, Role, ArticleStatus, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@football.local" },
    update: {
      fullName: "System Admin",
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      fullName: "System Admin",
      email: "admin@football.local",
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@football.local" },
    update: {
      fullName: "Chủ sân Nguyễn An",
      role: Role.OWNER,
      isActive: true,
    },
    create: {
      fullName: "Chủ sân Nguyễn An",
      email: "owner@football.local",
      passwordHash,
      role: Role.OWNER,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@football.local" },
    update: {
      fullName: "Nhân viên Lê Minh",
      role: Role.STAFF,
      isActive: true,
    },
    create: {
      fullName: "Nhân viên Lê Minh",
      email: "staff@football.local",
      passwordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@football.local" },
    update: {
      fullName: "Khách hàng Trần Vy",
      role: Role.CUSTOMER,
      isActive: true,
    },
    create: {
      fullName: "Khách hàng Trần Vy",
      email: "customer@football.local",
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      phone: "0909000111",
    },
  });

  const venue1 = await prisma.venue.upsert({
    where: { id: "venue-hcm-1" },
    update: {},
    create: {
      id: "venue-hcm-1",
      name: "Sân bóng Thủ Đức",
      address: "12 Võ Văn Ngân, Thủ Đức",
      description: "Cụm sân tiêu chuẩn thi đấu, có chỗ gửi xe và căn tin",
      openTime: "06:00",
      closeTime: "23:00",
      status: "ACTIVE",
    },
  });

  const venue2 = await prisma.venue.upsert({
    where: { id: "venue-hcm-2" },
    update: {},
    create: {
      id: "venue-hcm-2",
      name: "Sân bóng Quận 7",
      address: "120 Huỳnh Tấn Phát, Quận 7",
      description: "Cụm sân cho giải phong trào và huấn luyện",
      openTime: "05:30",
      closeTime: "22:30",
      status: "ACTIVE",
    },
  });

  const pitch1 = await prisma.pitch.upsert({
    where: { id: "pitch-td-1" },
    update: {},
    create: {
      id: "pitch-td-1",
      venueId: venue1.id,
      name: "TD-01",
      pitchType: "Sân 5",
      basePrice: new Prisma.Decimal(300000),
      status: "ACTIVE",
    },
  });

  const pitch2 = await prisma.pitch.upsert({
    where: { id: "pitch-td-2" },
    update: {},
    create: {
      id: "pitch-td-2",
      venueId: venue1.id,
      name: "TD-02",
      pitchType: "Sân 7",
      basePrice: new Prisma.Decimal(450000),
      status: "ACTIVE",
    },
  });

  const pitch3 = await prisma.pitch.upsert({
    where: { id: "pitch-q7-1" },
    update: {},
    create: {
      id: "pitch-q7-1",
      venueId: venue2.id,
      name: "Q7-01",
      pitchType: "Sân 5",
      basePrice: new Prisma.Decimal(280000),
      status: "ACTIVE",
    },
  });

  const promo1 = await prisma.promotion.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      name: "Ưu đãi khách mới",
      description: "Giảm 10% cho booking đầu tiên",
      type: "PERCENT",
      value: new Prisma.Decimal(10),
      maxDiscount: new Prisma.Decimal(80000),
      minOrderValue: new Prisma.Decimal(200000),
      startAt: new Date(Date.now() - 86400000 * 3),
      endAt: new Date(Date.now() + 86400000 * 30),
      usageLimit: 200,
      isActive: true,
    },
  });

  await prisma.promotion.upsert({
    where: { code: "OFF100K" },
    update: {},
    create: {
      code: "OFF100K",
      name: "Giảm 100k cuối tuần",
      description: "Giảm cố định 100k cho booking cuối tuần",
      type: "FIXED",
      value: new Prisma.Decimal(100000),
      maxDiscount: null,
      minOrderValue: new Prisma.Decimal(350000),
      startAt: new Date(Date.now() - 86400000 * 2),
      endAt: new Date(Date.now() + 86400000 * 14),
      usageLimit: 50,
      isActive: true,
    },
  });

  const booking1 = await prisma.booking.upsert({
    where: { id: "booking-1" },
    update: {},
    create: {
      id: "booking-1",
      bookingCode: "BK-0001",
      userId: customer.id,
      pitchId: pitch1.id,
      bookingDate: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
      startTime: "18:00",
      endTime: "19:30",
      subtotalPrice: new Prisma.Decimal(300000),
      discountAmount: new Prisma.Decimal(30000),
      totalPrice: new Prisma.Decimal(270000),
      promotionId: promo1.id,
      note: "Booking buổi tối",
      status: "CONFIRMED",
      paymentStatus: "PARTIAL",
    },
  });

  const booking2 = await prisma.booking.upsert({
    where: { id: "booking-2" },
    update: {},
    create: {
      id: "booking-2",
      bookingCode: "BK-0002",
      userId: customer.id,
      pitchId: pitch3.id,
      bookingDate: new Date(`${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}T00:00:00.000Z`),
      startTime: "20:00",
      endTime: "21:30",
      subtotalPrice: new Prisma.Decimal(280000),
      discountAmount: new Prisma.Decimal(0),
      totalPrice: new Prisma.Decimal(280000),
      note: "Booking ngày mai",
      status: "PENDING",
      paymentStatus: "UNPAID",
    },
  });

  await prisma.paymentTransaction.upsert({
    where: { id: "payment-1" },
    update: {},
    create: {
      id: "payment-1",
      bookingId: booking1.id,
      provider: "VNPAY",
      status: "SUCCESS",
      amount: new Prisma.Decimal(150000),
      txnRef: "TXN-0001",
      providerTxnNo: "VNP-20260316-0001",
      paidAt: new Date(),
    },
  });

  await prisma.article.upsert({
    where: { slug: "khai-truong-san-bong" },
    update: {},
    create: {
      title: "Khai trương cụm sân bóng mới tại Thủ Đức",
      slug: "khai-truong-san-bong",
      summary: "Sân bóng Thủ Đức chính thức khai trương với ưu đãi hấp dẫn.",
      content: "Chúng tôi mang đến 4 sân 5 và 2 sân 7 đạt chuẩn, kèm dịch vụ nước uống và phòng thay đồ.",
      coverUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  await prisma.article.upsert({
    where: { slug: "huong-dan-dat-san" },
    update: {},
    create: {
      title: "Hướng dẫn đặt sân nhanh trong 60 giây",
      slug: "huong-dan-dat-san",
      summary: "Các bước đặt sân, thanh toán và nhận xác nhận nhanh chóng.",
      content: "Chọn cụm sân, thời gian, áp mã giảm giá và nhận xác nhận ngay sau khi thanh toán.",
      coverUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2",
      status: ArticleStatus.PUBLISHED,
      authorId: owner.id,
      publishedAt: new Date(Date.now() - 86400000 * 2),
    },
  });

  console.log("Seeded admin + sample data (venues, pitches, promotions, bookings, payments, articles)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
