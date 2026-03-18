## Tổng quan

Ứng dụng gồm 3 phần chính:

- **Admin web**: giao diện quản trị (quản lý cụm sân, sân con, booking, khuyến mãi, thanh toán, người dùng, bài viết, lịch sân, dashboard biểu đồ).
- **Backend API**: cung cấp REST API, xác thực/ phân quyền, nghiệp vụ đặt sân, thanh toán VNPay, lưu trữ dữ liệu.
- **App khách hàng**: app Android để người dùng xem sân/đặt lịch/thanh toán (VNPay sandbox trên app).

## Admin web (`/admin`)

- **Framework/UI**: React 19, CSS thuần (custom layout/dashboard).
- **Build tool**: Vite.
- **Editor bài viết**: Quill (rich-text editor).
- **Biểu đồ thống kê**: ECharts.
- **Lint**: ESLint.
- **Gọi API**: `fetch` (REST JSON) + token Bearer.

## Backend API (`/Backend`)

- **Runtime**: Node.js.
- **Web framework**: Express.
- **Bảo mật & middleware**:
  - `helmet`: security headers
  - `cors`: CORS
  - `morgan`: request logging
  - `dotenv`: env config
- **Xác thực/Phân quyền**: JWT (`jsonwebtoken`) + middleware `protect/authorize`.
- **Validation**: Zod (validate body/query/params).
- **Mã hoá mật khẩu**: `bcryptjs`.
- **Email**: `nodemailer` (quên mật khẩu / email liên quan).
- **Thanh toán**: tích hợp **VNPay** (tạo URL/return/ipn ở backend; admin chỉ dùng để đối soát/cập nhật trạng thái giao dịch).

## App khách hàng Android (`/AppDatSan`)

- **Nền tảng**: Android native.
- **Ngôn ngữ**: Kotlin (Android Gradle Plugin + Kotlin plugin).
- **Build system**: Gradle + Kotlin DSL (`build.gradle.kts`) + Version Catalog (`gradle/libs.versions.toml`).
- **UI libs**: AndroidX (`core-ktx`, `appcompat`) + Material Components.
- **Lưu ý hiện trạng**: repo hiện chủ yếu là khung project Android; chưa thấy source Kotlin ở `app/src/main/java` trong workspace hiện tại nên phần tích hợp API/UI chi tiết của app có thể nằm ngoài hoặc chưa được commit.

## Database & ORM

- **Database**: MySQL (qua `DATABASE_URL`).
- **ORM**: Prisma (`prisma` + `@prisma/client`).
- **Migration/Seed**:
  - `prisma migrate`
  - `prisma/seed.js` tạo dữ liệu mẫu (users/venues/pitches/bookings/promotions/payments/articles).

## Quy ước tích hợp dữ liệu (tóm tắt)

- **REST API base**: mặc định `http://localhost:4000/api/v1` (cấu hình qua `VITE_API_BASE_URL` ở admin).
- **Chống đặt trùng giờ**: kiểm tra overlap ở cả **frontend** (chặn sớm) và **backend** (đảm bảo chuẩn, trả `409` khi trùng).

