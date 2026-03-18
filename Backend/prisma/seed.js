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

  // Trước đây có OWNER/STAFF; hiện hệ thống chỉ dùng SUPER_ADMIN (Admin) và CUSTOMER.

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

  const customer2 = await prisma.user.upsert({
    where: { email: "vy.nguyen@football.local" },
    update: {
      fullName: "Vy Nguyễn",
      role: Role.CUSTOMER,
      isActive: true,
      phone: "0909000222",
    },
    create: {
      fullName: "Vy Nguyễn",
      email: "vy.nguyen@football.local",
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      phone: "0909000222",
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { email: "khoa.tran@football.local" },
    update: {
      fullName: "Khoa Trần",
      role: Role.CUSTOMER,
      isActive: true,
      phone: "0909000333",
    },
    create: {
      fullName: "Khoa Trần",
      email: "khoa.tran@football.local",
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      phone: "0909000333",
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

  const venue3 = await prisma.venue.upsert({
    where: { id: "venue-hn-1" },
    update: {},
    create: {
      id: "venue-hn-1",
      name: "Sân bóng Cầu Giấy",
      address: "88 Trần Thái Tông, Cầu Giấy, Hà Nội",
      description: "Cụm sân trung tâm, có phòng thay đồ và thuê áo bib",
      openTime: "06:00",
      closeTime: "23:30",
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

  await prisma.pitch.upsert({
    where: { id: "pitch-q7-2" },
    update: {},
    create: {
      id: "pitch-q7-2",
      venueId: venue2.id,
      name: "Q7-02",
      pitchType: "Sân 7",
      basePrice: new Prisma.Decimal(420000),
      status: "ACTIVE",
    },
  });

  await prisma.pitch.upsert({
    where: { id: "pitch-cg-1" },
    update: {},
    create: {
      id: "pitch-cg-1",
      venueId: venue3.id,
      name: "CG-01",
      pitchType: "Sân 5",
      basePrice: new Prisma.Decimal(320000),
      status: "ACTIVE",
    },
  });

  await prisma.pitch.upsert({
    where: { id: "pitch-cg-2" },
    update: {},
    create: {
      id: "pitch-cg-2",
      venueId: venue3.id,
      name: "CG-02",
      pitchType: "Sân 7",
      basePrice: new Prisma.Decimal(500000),
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

  const booking3 = await prisma.booking.upsert({
    where: { id: "booking-3" },
    update: {},
    create: {
      id: "booking-3",
      bookingCode: "BK-0003",
      userId: customer2.id,
      pitchId: pitch2.id,
      bookingDate: new Date(`${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T00:00:00.000Z`),
      startTime: "19:00",
      endTime: "20:30",
      subtotalPrice: new Prisma.Decimal(450000),
      discountAmount: new Prisma.Decimal(0),
      totalPrice: new Prisma.Decimal(450000),
      note: "Đã đá xong, chờ đối soát",
      status: "COMPLETED",
      paymentStatus: "PAID",
    },
  });

  const booking4 = await prisma.booking.upsert({
    where: { id: "booking-4" },
    update: {},
    create: {
      id: "booking-4",
      bookingCode: "BK-0004",
      userId: customer3.id,
      pitchId: pitch1.id,
      bookingDate: new Date(`${new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)}T00:00:00.000Z`),
      startTime: "17:00",
      endTime: "18:30",
      subtotalPrice: new Prisma.Decimal(300000),
      discountAmount: new Prisma.Decimal(0),
      totalPrice: new Prisma.Decimal(300000),
      note: "Đặt trước 3 ngày",
      status: "CONFIRMED",
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

  await prisma.paymentTransaction.upsert({
    where: { id: "payment-2" },
    update: {},
    create: {
      id: "payment-2",
      bookingId: booking3.id,
      provider: "VNPAY",
      status: "SUCCESS",
      amount: new Prisma.Decimal(450000),
      txnRef: "TXN-0002",
      providerTxnNo: "VNP-20260316-0002",
      paidAt: new Date(Date.now() - 3600 * 1000 * 12),
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
    where: { slug: "bang-gia-san-va-khung-gio" },
    update: {},
    create: {
      title: "Bảng giá sân theo khung giờ (cập nhật 2026)",
      slug: "bang-gia-san-va-khung-gio",
      summary: "Tổng hợp giá sân 5/7 theo giờ vàng, cuối tuần và ngày thường.",
      content:
        "<h2>Khung giờ phổ biến</h2><ul><li><strong>06:00 - 16:59</strong>: giá tiêu chuẩn</li><li><strong>17:00 - 22:00</strong>: giờ vàng</li></ul><blockquote>Lưu ý: giá có thể thay đổi theo giải đấu/đặt theo gói.</blockquote><h3>Mẹo tiết kiệm</h3><ol><li>Đặt theo nhóm để nhận ưu đãi</li><li>Sử dụng mã giảm giá cuối tuần</li></ol>",
      coverUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2",
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 86400000 * 5),
    },
  });

  await prisma.article.upsert({
    where: { slug: "kinh-nghiem-chon-giay-da-bong" },
    update: {},
    create: {
      title: "Kinh nghiệm chọn giày đá bóng sân cỏ nhân tạo",
      slug: "kinh-nghiem-chon-giay-da-bong",
      summary: "Chọn đinh TF/AG, form giày và mẹo bảo quản để đá bền hơn.",
      content:
        "<h2>Chọn đinh giày</h2><p>Sân cỏ nhân tạo phù hợp nhất với <strong>TF</strong> (đinh dăm) và một số loại <strong>AG</strong>.</p><h3>Checklist nhanh</h3><ul><li>Form vừa chân</li><li>Đế bám tốt</li><li>Vớ dày vừa đủ</li></ul><pre><code>// Gợi ý: lau sạch đế sau mỗi trận\n</code></pre>",
      coverUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 86400000 * 1),
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
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 86400000 * 2),
    },
  });

  console.log("Seeded admin + extended sample data (venues, pitches, promotions, bookings, payments, articles, users)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
