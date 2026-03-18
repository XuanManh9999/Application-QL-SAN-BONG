## 2026-03-18

### Fix lỗi build admin: “Only one default export allowed”

- **Hiện tượng**: Khi build/chạy admin, báo lỗi Babel: `Only one default export allowed` tại `admin/src/App.jsx`.
- **Nguyên nhân**: File `admin/src/App.jsx` có **2 dòng** `export default App;` (trùng default export).
- **Cách sửa**: Xoá 1 dòng `export default App;` để chỉ còn **một** default export hợp lệ.
- **Kết quả kiểm tra**:
  - `npm run build` trong thư mục `admin/` chạy thành công (Vite build OK).

### Tích hợp API + hoàn thiện Bài viết (Markdown)

- **Booking (Đặt sân)**
  - **Vấn đề**: Form tạo booking trước đó gửi thừa `status` và `paymentStatus` khi gọi API tạo mới, trong khi Backend schema `createBooking` không nhận 2 field này → dễ bị báo lỗi validate.
  - **Cách sửa**: Tách payload:
    - **Create**: chỉ gửi `pitchId, bookingDate, startTime, endTime, subtotalPrice, promotionCode, note, userId`.
    - **Update**: mới gửi thêm `status, paymentStatus` (đúng schema update).

- **Bài viết**
  - **Nâng cấp**: Thêm editor Markdown + preview trực tiếp, hỗ trợ GFM (list, table, code block…).
  - **Thư viện**: thêm `react-markdown` và `remark-gfm`.
  - **UI/CSS**: bổ sung style cho khu vực preview (code block, table, blockquote…).

- **Kết quả kiểm tra**
  - `npm run build` trong thư mục `admin/` chạy thành công sau khi tích hợp Markdown.

### Fix lỗi 500 Articles (Internal server error)

- **Hiện tượng**: Admin hiển thị toast “Internal server error”, Backend log lỗi:
  - `TypeError: Cannot read properties of undefined (reading 'findMany')` tại `articles.controller.js` khi gọi `GET /api/v1/articles`.
- **Nguyên nhân**:
  - File `Backend/prisma/schema.prisma` bị **trùng `enum ArticleStatus`** và **trùng `model Article`**, khiến Prisma Client đã generate trước đó **không có delegate `prisma.article`** → `prisma.article` bị `undefined`.
  - Đồng thời Prisma engine bị lock bởi tiến trình Node đang chạy, làm `prisma generate` báo `EPERM rename ... query_engine-windows.dll.node`.
- **Cách sửa**:
  - Gỡ trùng định nghĩa trong `schema.prisma` (giữ 1 `ArticleStatus` và 1 `Article`).
  - Dừng các tiến trình Node đang giữ file engine, xoá các file `query_engine-windows.dll.node.tmp*`, rồi chạy lại `npm run prisma:generate`.
  - Dọn thêm route bị lặp: xoá duplicate `router.delete("/:id"...` trong `src/modules/pitches/pitches.route.js`.
- **Kết quả kiểm tra**:
  - Gọi `GET /api/v1/articles` sau khi login trả `200` (success true).

### Hoàn thiện tích hợp API (ổn định + đúng schema)

- **Tăng độ ổn định khi tải dữ liệu tổng**
  - **Trước**: `loadAll()` dùng `Promise.all` → chỉ cần 1 API fail là toàn bộ dữ liệu không được set.
  - **Giờ**: chuyển sang `Promise.allSettled`:
    - API nào thành công thì vẫn set state tương ứng.
    - API nào lỗi thì hiển thị toast “Một số dữ liệu chưa tải được” (ghi rõ module lỗi).

- **Chuẩn hoá payload theo Backend schema**
  - **Pitches update**: không gửi `venueId` khi update (Backend schema update pitch không nhận field này).

- **Validate tối thiểu phía UI để tránh gọi API sai**
  - Thêm kiểm tra bắt buộc trước khi gọi API cho các form: `Venues`, `Pitches`, `Bookings`, `Promotions`, `Payments`, `Users`, `Articles`.

- **Smoke test**
  - Sau khi login, các endpoint list trả OK:
    - `/venues`, `/pitches`, `/bookings`, `/promotions`, `/payments`, `/users`, `/articles`.

### Nâng cấp UI + trình soạn thảo bài viết + data mẫu

- **Bài viết (Editor)**
  - **Thay Markdown textarea** bằng **Quill rich-text editor** (toolbar heading/bold/italic/list/blockquote/code/link…).
  - **Lý do kỹ thuật**: `react-quill` chưa tương thích React 19 (peer dependency), nên dùng **Quill (vanilla)** để ổn định nhưng UI/UX vẫn theo phong cách React Quill.

- **UI**
  - Tăng “độ đẹp” của card/table: shadow mềm hơn + hover highlight hàng trong bảng.

- **Data mẫu**
  - Mở rộng `Backend/prisma/seed.js`: thêm venue/pitch/user/booking/payment/article mẫu để các tab có dữ liệu hiển thị ngay.
  - Đã chạy `npm run prisma:seed` thành công.

### Re-layout UI để hiện đại hơn (UX)

- **Layout tổng**
  - Sidebar sticky (cuộn độc lập) để điều hướng luôn sẵn.
  - Nội dung chính có `max-width` và căn giữa, tạo cảm giác “dashboard” gọn gàng hơn trên màn hình lớn.
  - Topbar sticky để thao tác “Làm mới dữ liệu” luôn nằm trong tầm nhìn.

- **Bố cục các tab dạng Form + Table**
  - Grid 2 cột đổi sang **cột trái cố định** (form) + **cột phải linh hoạt** (table) giúp dễ thao tác và đọc dữ liệu.
  - Table có header sticky + giới hạn chiều cao vùng scroll để trải nghiệm giống admin hiện đại.

- **Form/Table polish**
  - Hover/striped rows, input hover, border tinh chỉnh để nhìn “mềm” và dễ đọc hơn.

### Báo cáo thống kê + biểu đồ (Dashboard)

- **Thêm biểu đồ trực quan trong tab Tổng quan** (dựa trên dữ liệu đã load từ API):
  - **Line chart**: Doanh thu 14 ngày gần nhất.
  - **Pie chart**: Booking theo trạng thái (PENDING/CONFIRMED/CANCELLED/COMPLETED).
  - **Bar chart**: Doanh thu theo cụm sân (Top 8).
  - **Pie chart**: Giao dịch theo trạng thái (PENDING/SUCCESS/FAILED).
- **Công nghệ**: dùng `echarts` + component React bọc (`EChart`) để không phụ thuộc thư viện chart có peer-deps không tương thích React 19.

### Fix action button bị đè lên nhau

- **Hiện tượng**: Các nút ở cột **Tác vụ** bị sát và chồng lên nhau khi bảng hẹp.
- **Cách sửa**:
  - Bọc nhóm nút trong `div.actions-cell` (flex + wrap + gap) để tự xuống dòng gọn gàng.
  - Bỏ `margin-right` cứng của `.small-btn` để tránh cộng dồn spacing gây tràn.

### Fix lỗi 400 khi cập nhật mã giảm giá (Promotions PATCH)

- **Hiện tượng**: `PATCH /api/v1/promotions/:id` trả **400 Validation error** khi sửa mã giảm giá trên admin.
- **Nguyên nhân**:
  - Admin gửi payload update **không đúng schema**:
    - Gửi `code` khi update (schema update không cho phép).
    - Gửi `minOrderValue/maxDiscount/usageLimit = 0` hoặc `NaN` (schema yêu cầu số dương nếu có).
- **Cách sửa**:
  - Khi **update**: chỉ gửi các field hợp lệ, **loại bỏ `code`**.
  - Với các số tuỳ chọn: chỉ gửi khi \(> 0\), nếu \(0\)/trống thì bỏ khỏi payload.
- **Kết quả kiểm tra**:
  - Test `PATCH /api/v1/promotions/:id` với payload hợp lệ trả **200**.

### Điều chỉnh nghiệp vụ Thanh toán (Admin chỉ cập nhật trạng thái)

- **Yêu cầu**: VNPay sandbox thanh toán diễn ra trên app khách hàng. Trang quản trị chỉ dùng để **đối soát/cập nhật trạng thái** giao dịch.
- **Cập nhật Admin**:
  - Bỏ phần **tạo URL VNPay** khỏi trang quản trị.
  - Không cho **tạo giao dịch mới** trên admin; chỉ cho phép cập nhật giao dịch đã có (chọn từ danh sách → “Sửa” → “Cập nhật”).
  - Hiển thị notice giải thích luồng thanh toán và hướng dẫn thao tác.

### Thêm view Lịch sân (mặc định hôm nay)

- **Mục tiêu**: để nhân viên xem nhanh lịch theo ngày và đặt booking tiện hơn.
- **Tính năng**:
  - Tab mới: **“Lịch sân”**.
  - Mặc định ngày = **hôm nay**, có lọc **cụm sân / sân**.
  - Hiển thị dạng lưới khung giờ 30 phút (06:00–23:00), booking hiển thị dạng pill.
  - Click ô trống để **prefill** giờ + sân và tạo booking nhanh (mặc định 90 phút).

### Hoàn thiện Lịch sân: lấy dữ liệu trực tiếp từ CSDL theo ngày

- **Thay đổi**:
  - Lịch sân không phụ thuộc `bookings` đã load toàn bộ nữa.
  - Mỗi khi đổi **ngày/sân**, admin gọi `GET /api/v1/bookings?date=YYYY-MM-DD&pitchId=...` để lấy booking đúng theo CSDL.
  - Tạo booking xong: tự add vào lịch và các tab khác (update state) để hiển thị ngay.
- **UI**:
  - Số cột sân trong lịch giờ tự co giãn theo số sân đang lọc (không hardcode 8 cột).

### Chống đặt trùng khung giờ (Lịch sân)

- **Yêu cầu**: cùng ngày + cùng sân + trùng khoảng thời gian thì **không cho phép đặt trùng**.
- **Cập nhật**:
  - Trên UI: trước khi gọi API tạo booking, kiểm tra overlap với các booking hiện có (trạng thái `PENDING/CONFIRMED`) và chặn tạo nếu bị trùng.
  - Backend: chặn trùng lịch ở 3 luồng:
    - **Create booking**: đã có từ trước (trả 409 nếu trùng).
    - **Update booking** (đổi ngày/giờ/sân hoặc đưa status về PENDING/CONFIRMED): thêm check overlap (trả 409).
    - **Update status** sang PENDING/CONFIRMED: thêm check overlap (trả 409).
  - UI: hiển thị message tiếng Việt rõ ràng khi nhận lỗi 409 (không lưu/không xác nhận vì trùng lịch).

### Tối ưu UI Lịch sân

- Panel “Đặt lịch nhanh” được sticky để thao tác thuận tiện khi cuộn.
- Thêm highlight “selected slot” giúp người dùng biết đang chọn khung nào.

