import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./api";

const tabs = [
  { key: "dashboard", label: "Tổng quan" },
  { key: "venues", label: "Cụm sân" },
  { key: "pitches", label: "Sân con" },
  { key: "bookings", label: "Đặt sân" },
  { key: "promotions", label: "Mã giảm giá" },
  { key: "payments", label: "Thanh toán" },
];

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem("admin_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatMoney = (v) => `${Number(v || 0).toLocaleString("vi-VN")} đ`;

function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [venues, setVenues] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const token = auth?.accessToken;
  const user = auth?.user;

  const stats = useMemo(() => {
    const revenue = bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    return {
      venueCount: venues.length,
      pitchCount: pitches.length,
      bookingCount: bookings.length,
      promoCount: promotions.length,
      revenue,
    };
  }, [venues, pitches, bookings, promotions]);

  useEffect(() => {
    if (!auth) return;
    localStorage.setItem("admin_auth", JSON.stringify(auth));
  }, [auth]);

  const clearMessage = () => setTimeout(() => setMessage(""), 2500);

  const callWithMessage = async (fn, successText) => {
    try {
      setLoading(true);
      await fn();
      setMessage(successText);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
      clearMessage();
    }
  };

  const loadAll = async () => {
    if (!token) return;

    await callWithMessage(async () => {
      const [v, p, b, promo] = await Promise.all([
        api.venues.list(token),
        api.pitches.list(token),
        api.bookings.list(token),
        api.promotions.list(token),
      ]);
      setVenues(v.data || []);
      setPitches(p.data || []);
      setBookings(b.data || []);
      setPromotions(promo.data || []);
    }, "Đã đồng bộ dữ liệu mới nhất");
  };

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("admin_auth");
    setVenues([]);
    setPitches([]);
    setBookings([]);
    setPromotions([]);
  };

  if (!token) {
    return <LoginScreen onLogin={setAuth} setMessage={setMessage} setLoading={setLoading} loading={loading} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h2>Football Admin</h2>
          <p>Hệ thống quản trị nền tảng đặt sân bóng</p>
        </div>

        <div className="user-box">
          <p className="muted">{user?.fullName}</p>
          <p className="muted small">{user?.email}</p>
          <p className="muted small">Vai trò: {user?.role}</p>
        </div>

        <nav className="menu">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "menu-item active" : "menu-item"}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button className="danger" onClick={handleLogout}>Đăng xuất</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Bảng điều khiển quản trị</h1>
            <div className="subtitle">Quản lý sân, lịch đặt, thanh toán và khuyến mãi trên một giao diện tập trung</div>
          </div>
          <div className="actions">
            <button className="ghost-btn" onClick={loadAll} disabled={loading}>{loading ? "Đang tải..." : "Làm mới dữ liệu"}</button>
          </div>
        </header>

        {message && <div className="notice">{message}</div>}

        {activeTab === "dashboard" && <Dashboard stats={stats} />}
        {activeTab === "venues" && <VenuesPanel token={token} venues={venues} setVenues={setVenues} />}
        {activeTab === "pitches" && <PitchesPanel token={token} pitches={pitches} setPitches={setPitches} venues={venues} />}
        {activeTab === "bookings" && <BookingsPanel token={token} bookings={bookings} setBookings={setBookings} pitches={pitches} />}
        {activeTab === "promotions" && <PromotionsPanel token={token} promotions={promotions} setPromotions={setPromotions} />}
        {activeTab === "payments" && <PaymentsPanel token={token} bookings={bookings} />}
      </main>
    </div>
  );
}

function LoginScreen({ onLogin, setMessage, setLoading, loading }) {
  const [email, setEmail] = useState("admin@football.local");
  const [password, setPassword] = useState("Admin@123");
  const [forgotEmail, setForgotEmail] = useState("admin@football.local");

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.auth.login({ email, password });
      onLogin(res.data);
      setMessage("Đăng nhập thành công");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendForgot = async () => {
    try {
      setLoading(true);
      await api.auth.forgotPassword({ email: forgotEmail });
      setMessage("Đã gửi email đặt lại mật khẩu (nếu email tồn tại)");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={submit}>
        <h2 className="auth-title">Đăng nhập quản trị</h2>
        <p className="auth-subtitle">Truy cập hệ thống điều hành đặt sân bóng</p>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Mật khẩu</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" disabled={loading}>{loading ? "Đang xử lý..." : "Đăng nhập"}</button>

        <hr />

        <label>Quên mật khẩu (email)</label>
        <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
        <button type="button" className="ghost-btn" onClick={sendForgot}>Gửi mail reset</button>
      </form>
    </div>
  );
}

function Dashboard({ stats }) {
  return (
    <section className="grid cards-4">
      <StatCard title="Cụm sân" value={stats.venueCount} />
      <StatCard title="Sân con" value={stats.pitchCount} />
      <StatCard title="Booking" value={stats.bookingCount} />
      <StatCard title="Mã giảm giá" value={stats.promoCount} />
      <StatCard title="Doanh thu tạm tính" value={formatMoney(stats.revenue)} full />
    </section>
  );
}

function StatCard({ title, value, full }) {
  return (
    <article className={full ? "card stat full" : "card stat"}>
      <p className="muted">{title}</p>
      <h3>{value}</h3>
    </article>
  );
}

function VenuesPanel({ token, venues, setVenues }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    openTime: "06:00",
    closeTime: "23:00",
  });

  const submit = async (e) => {
    e.preventDefault();
    const res = await api.venues.create(token, form);
    setVenues((prev) => [res.data, ...prev]);
    setForm({ name: "", address: "", description: "", openTime: "06:00", closeTime: "23:00" });
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Tạo cụm sân</h3>
        <label>Tên cụm sân</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Địa chỉ</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <label>Mô tả</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>Giờ mở</label>
        <input value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
        <label>Giờ đóng</label>
        <input value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
        <button>Tạo mới</button>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách cụm sân</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Địa chỉ</th><th>Giờ hoạt động</th></tr></thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id}><td>{v.name}</td><td>{v.address}</td><td>{v.openTime} - {v.closeTime}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PitchesPanel({ token, pitches, setPitches, venues }) {
  const [form, setForm] = useState({ venueId: "", name: "", pitchType: "Sân 5", basePrice: 300000 });

  const submit = async (e) => {
    e.preventDefault();
    const res = await api.pitches.create(token, { ...form, basePrice: Number(form.basePrice) });
    setPitches((prev) => [res.data, ...prev]);
    setForm({ venueId: "", name: "", pitchType: "Sân 5", basePrice: 300000 });
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Tạo sân con</h3>
        <label>Thuộc cụm sân</label>
        <select value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
          <option value="">Chọn cụm sân</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label>Tên sân</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Loại sân</label>
        <input value={form.pitchType} onChange={(e) => setForm({ ...form, pitchType: e.target.value })} />
        <label>Giá cơ bản</label>
        <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
        <button>Tạo mới</button>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách sân con</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên sân</th><th>Loại</th><th>Giá cơ bản</th></tr></thead>
            <tbody>
              {pitches.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.pitchType}</td><td>{formatMoney(p.basePrice)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const klass = String(status || "").toLowerCase();
  return <span className={`badge ${klass}`}>{status}</span>;
}

function BookingsPanel({ token, bookings, setBookings, pitches }) {
  const [form, setForm] = useState({
    pitchId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "19:30",
    subtotalPrice: 300000,
    promotionCode: "",
    note: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      subtotalPrice: Number(form.subtotalPrice),
      promotionCode: form.promotionCode || undefined,
    };
    const res = await api.bookings.create(token, payload);
    setBookings((prev) => [res.data, ...prev]);
  };

  const updateStatus = async (id, status) => {
    const res = await api.bookings.updateStatus(token, id, { status });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: res.data.status } : b)));
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Tạo booking</h3>
        <label>Chọn sân</label>
        <select value={form.pitchId} onChange={(e) => setForm({ ...form, pitchId: e.target.value })}>
          <option value="">Chọn sân</option>
          {pitches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Ngày</label>
        <input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} />
        <label>Giờ bắt đầu</label>
        <input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <label>Giờ kết thúc</label>
        <input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        <label>Tạm tính</label>
        <input type="number" value={form.subtotalPrice} onChange={(e) => setForm({ ...form, subtotalPrice: e.target.value })} />
        <label>Mã giảm giá (tuỳ chọn)</label>
        <input value={form.promotionCode} onChange={(e) => setForm({ ...form, promotionCode: e.target.value })} />
        <label>Ghi chú</label>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button>Tạo booking</button>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách booking</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Sân</th><th>Ngày</th><th>Tổng</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.bookingCode}</td>
                  <td>{b.pitch?.name}</td>
                  <td>{new Date(b.bookingDate).toLocaleDateString("vi-VN")}</td>
                  <td>{formatMoney(b.totalPrice)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button className="small-btn" onClick={() => updateStatus(b.id, "CONFIRMED")}>Confirm</button>
                    <button className="small-btn ghost-btn" onClick={() => updateStatus(b.id, "CANCELLED")}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PromotionsPanel({ token, promotions, setPromotions }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "PERCENT",
    value: 10,
    minOrderValue: 100000,
    maxDiscount: 100000,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
    usageLimit: 100,
  });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderValue: Number(form.minOrderValue),
      maxDiscount: Number(form.maxDiscount),
      usageLimit: Number(form.usageLimit),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
    };
    const res = await api.promotions.create(token, payload);
    setPromotions((prev) => [res.data, ...prev]);
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Tạo mã giảm giá</h3>
        <label>Code</label>
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <label>Tên chương trình</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Kiểu giảm</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="PERCENT">PERCENT</option>
          <option value="FIXED">FIXED</option>
        </select>
        <label>Giá trị</label>
        <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <label>Đơn tối thiểu</label>
        <input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
        <label>Giảm tối đa</label>
        <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
        <label>Bắt đầu</label>
        <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
        <label>Kết thúc</label>
        <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        <label>Giới hạn lượt dùng</label>
        <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
        <button>Tạo mã</button>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách mã giảm giá</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Kiểu</th><th>Giá trị</th><th>Đã dùng</th></tr></thead>
            <tbody>
              {promotions.map((p) => <tr key={p.id}><td>{p.code}</td><td>{p.type}</td><td>{Number(p.value)}</td><td>{p.usedCount}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PaymentsPanel({ token, bookings }) {
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");

  const createUrl = async () => {
    const res = await api.payments.createVnpayUrl(token, {
      bookingId,
      amount: amount ? Number(amount) : undefined,
    });
    setPaymentUrl(res.data.paymentUrl);
  };

  return (
    <section className="grid two">
      <div className="card">
        <h3 className="card-title">Tạo link thanh toán VNPay</h3>
        <label>Booking</label>
        <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
          <option value="">Chọn booking</option>
          {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingCode} - {formatMoney(b.totalPrice)}</option>)}
        </select>
        <label>Số tiền (tuỳ chọn)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={createUrl}>Tạo URL thanh toán</button>
        {paymentUrl && (
          <div className="payment-link">
            <a href={paymentUrl} target="_blank">Mở cổng thanh toán VNPay</a>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Quy trình vận hành</h3>
        <ul>
          <li>Tạo booking trước khi tạo link thanh toán.</li>
          <li>Gửi link cho khách để thanh toán online.</li>
          <li>Hệ thống nhận callback và cập nhật trạng thái giao dịch.</li>
          <li>Theo dõi trạng thái booking để xác nhận vận hành.</li>
        </ul>
      </div>
    </section>
  );
}

export default App;
