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
  { key: "users", label: "Người dùng" },
  { key: "articles", label: "Bài viết" },
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
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [venues, setVenues] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);

  const token = auth?.accessToken;
  const user = auth?.user;

  const stats = useMemo(() => {
    const revenue = bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    return {
      venueCount: venues.length,
      pitchCount: pitches.length,
      bookingCount: bookings.length,
      promoCount: promotions.length,
      userCount: users.length,
      articleCount: articles.length,
      revenue,
    };
  }, [venues, pitches, bookings, promotions, users, articles]);

  useEffect(() => {
    if (!auth) return;
    localStorage.setItem("admin_auth", JSON.stringify(auth));
  }, [auth]);

  const pushToast = (payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...payload }, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, payload.duration || 3200);
  };

  const callWithToast = async (fn, successText) => {
    try {
      setLoading(true);
      await fn();
      pushToast({ type: "success", title: "Thành công", message: successText });
    } catch (e) {
      pushToast({ type: "error", title: "Có lỗi", message: e.message || "Đã có lỗi xảy ra" });
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    if (!token) return;

    await callWithToast(async () => {
      const [v, p, b, promo, pay, u, art] = await Promise.all([
        api.venues.list(token),
        api.pitches.list(token),
        api.bookings.list(token),
        api.promotions.list(token),
        api.payments.list(token),
        api.users.list(token),
        api.articles.list(token),
      ]);
      setVenues(v.data || []);
      setPitches(p.data || []);
      setBookings(b.data || []);
      setPromotions(promo.data || []);
      setPayments(pay.data || []);
      setUsers(u.data || []);
      setArticles(art.data || []);
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
    setPayments([]);
    setUsers([]);
    setArticles([]);
  };

  if (!token) {
    return (
      <>
        <LoginScreen onLogin={setAuth} pushToast={pushToast} setLoading={setLoading} loading={loading} />
        <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </>
    );
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

        <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

        {activeTab === "dashboard" && <Dashboard stats={stats} />}
        {activeTab === "venues" && <VenuesPanel token={token} venues={venues} setVenues={setVenues} pushToast={pushToast} />}
        {activeTab === "pitches" && <PitchesPanel token={token} pitches={pitches} setPitches={setPitches} venues={venues} pushToast={pushToast} />}
        {activeTab === "bookings" && <BookingsPanel token={token} bookings={bookings} setBookings={setBookings} pitches={pitches} users={users} promotions={promotions} pushToast={pushToast} />}
        {activeTab === "promotions" && <PromotionsPanel token={token} promotions={promotions} setPromotions={setPromotions} pushToast={pushToast} />}
        {activeTab === "payments" && <PaymentsPanel token={token} bookings={bookings} payments={payments} setPayments={setPayments} pushToast={pushToast} />}
        {activeTab === "users" && <UsersPanel token={token} users={users} setUsers={setUsers} pushToast={pushToast} />}
        {activeTab === "articles" && <ArticlesPanel token={token} articles={articles} setArticles={setArticles} users={users} pushToast={pushToast} />}
      </main>
    </div>
  );
}

export default App;

export default App;

function LoginScreen({ onLogin, pushToast, setLoading, loading }) {
  const [email, setEmail] = useState("admin@football.local");
  const [password, setPassword] = useState("Admin@123");
  const [forgotEmail, setForgotEmail] = useState("admin@football.local");

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.auth.login({ email, password });
      onLogin(res.data);
      pushToast({ type: "success", title: "Thành công", message: "Đăng nhập thành công" });
    } catch (e) {
      pushToast({ type: "error", title: "Đăng nhập thất bại", message: e.message || "Sai tài khoản hoặc mật khẩu" });
    } finally {
      setLoading(false);
    }
  };

  const sendForgot = async () => {
    try {
      setLoading(true);
      await api.auth.forgotPassword({ email: forgotEmail });
      pushToast({ type: "success", title: "Đã gửi", message: "Đã gửi email đặt lại mật khẩu (nếu email tồn tại)" });
    } catch (e) {
      pushToast({ type: "error", title: "Không thể gửi", message: e.message || "Vui lòng thử lại" });
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
      <StatCard title="Người dùng" value={stats.userCount} />
      <StatCard title="Bài viết" value={stats.articleCount} />
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

function VenuesPanel({ token, venues, setVenues, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    address: "",
    description: "",
    openTime: "06:00",
    closeTime: "23:00",
    status: "ACTIVE",
  });

  const resetForm = () =>
    setForm({ id: "", name: "", address: "", description: "", openTime: "06:00", closeTime: "23:00", status: "ACTIVE" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const res = await api.venues.update(token, form.id, {
          name: form.name,
          address: form.address,
          description: form.description,
          openTime: form.openTime,
          closeTime: form.closeTime,
          status: form.status,
        });
        setVenues((prev) => prev.map((item) => (item.id === form.id ? res.data : item)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Thông tin cụm sân đã được lưu" });
      } else {
        const res = await api.venues.create(token, form);
        setVenues((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo cụm sân mới" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.venues.remove(token, id);
      setVenues((prev) => prev.filter((v) => v.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Cụm sân đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
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
        <label>Trạng thái</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách cụm sân</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Địa chỉ</th><th>Giờ hoạt động</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>{v.address}</td>
                  <td>{v.openTime} - {v.closeTime}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() => setForm({
                        name: v.name,
                        address: v.address,
                        description: v.description || "",
                        openTime: v.openTime,
                        closeTime: v.closeTime,
                        status: v.status,
                        id: v.id,
                      })}
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(v.id)}>Xoá</button>
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

function UsersPanel({ token, users, setUsers, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    isActive: true,
  });

  const resetForm = () =>
    setForm({ id: "", fullName: "", email: "", phone: "", password: "", role: "CUSTOMER", isActive: true });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const payload = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {}),
        };
        const res = await api.users.update(token, form.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === form.id ? res.data : u)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Người dùng đã được lưu" });
      } else {
        const res = await api.users.create(token, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password || "Password@123",
          role: form.role,
          isActive: form.isActive,
        });
        setUsers((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo người dùng" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.users.remove(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Người dùng đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Quản lý người dùng</h3>
        <label>Họ tên</label>
        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <label>Email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Số điện thoại</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <label>Mật khẩu {form.id && "(để trống nếu không đổi)"}</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label>Vai trò</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="OWNER">OWNER</option>
          <option value="STAFF">STAFF</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
        <label>Trạng thái</label>
        <select value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
          <option value="true">ACTIVE</option>
          <option value="false">INACTIVE</option>
        </select>
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách người dùng</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "-"}</td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? "ACTIVE" : "INACTIVE"}</td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() =>
                        setForm({
                          id: u.id,
                          fullName: u.fullName,
                          email: u.email,
                          phone: u.phone || "",
                          password: "",
                          role: u.role,
                          isActive: u.isActive,
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(u.id)}>Xoá</button>
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

function ArticlesPanel({ token, articles, setArticles, users, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    title: "",
    slug: "",
    summary: "",
    content: "",
    coverUrl: "",
    status: "DRAFT",
    authorId: "",
    publishedAt: "",
  });

  const resetForm = () =>
    setForm({ id: "", title: "", slug: "", summary: "", content: "", coverUrl: "", status: "DRAFT", authorId: "", publishedAt: "" });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      summary: form.summary || undefined,
      content: form.content,
      coverUrl: form.coverUrl || undefined,
      status: form.status,
      authorId: form.authorId || undefined,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
    };

    try {
      if (form.id) {
        const res = await api.articles.update(token, form.id, payload);
        setArticles((prev) => prev.map((a) => (a.id === form.id ? res.data : a)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Bài viết đã được lưu" });
      } else {
        const res = await api.articles.create(token, payload);
        setArticles((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo bài viết" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.articles.remove(token, id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Bài viết đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Quản lý bài viết</h3>
        <label>Tiêu đề</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Slug</label>
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <label>Tóm tắt</label>
        <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <label>Nội dung</label>
        <textarea rows="6" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <label>Ảnh cover URL</label>
        <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <label>Tác giả</label>
        <select value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
          <option value="">Chọn tác giả</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <label>Trạng thái</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <label>Ngày xuất bản</label>
        <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách bài viết</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tiêu đề</th><th>Slug</th><th>Trạng thái</th><th>Tác giả</th><th>Ngày tạo</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.slug}</td>
                  <td>{a.status}</td>
                  <td>{a.author?.fullName || "-"}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() =>
                        setForm({
                          id: a.id,
                          title: a.title,
                          slug: a.slug,
                          summary: a.summary || "",
                          content: a.content,
                          coverUrl: a.coverUrl || "",
                          status: a.status,
                          authorId: a.authorId || "",
                          publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "",
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(a.id)}>Xoá</button>
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

function ToastStack({ toasts, onClose }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || "info"}`}>
          <div className="toast-content">
            <div>
              <p className="toast-title">{toast.title}</p>
              <p className="toast-message">{toast.message}</p>
            </div>
          </div>
          <button className="toast-close" onClick={() => onClose(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function PitchesPanel({ token, pitches, setPitches, venues, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    venueId: "",
    name: "",
    pitchType: "Sân 5",
    basePrice: 300000,
    status: "ACTIVE",
  });

  const resetForm = () =>
    setForm({ id: "", venueId: "", name: "", pitchType: "Sân 5", basePrice: 300000, status: "ACTIVE" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const res = await api.pitches.update(token, form.id, {
          venueId: form.venueId,
          name: form.name,
          pitchType: form.pitchType,
          basePrice: Number(form.basePrice),
          status: form.status,
        });
        setPitches((prev) => prev.map((item) => (item.id === form.id ? res.data : item)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Thông tin sân con đã được lưu" });
      } else {
        const res = await api.pitches.create(token, { ...form, basePrice: Number(form.basePrice) });
        setPitches((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo sân con" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.pitches.remove(token, id);
      setPitches((prev) => prev.filter((p) => p.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Sân con đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
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
        <label>Trạng thái</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách sân con</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên sân</th><th>Loại</th><th>Giá cơ bản</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {pitches.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.pitchType}</td>
                  <td>{formatMoney(p.basePrice)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() => setForm({
                        id: p.id,
                        venueId: p.venueId,
                        name: p.name,
                        pitchType: p.pitchType,
                        basePrice: Number(p.basePrice),
                        status: p.status,
                      })}
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(p.id)}>Xoá</button>
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

function StatusBadge({ status }) {
  const klass = String(status || "").toLowerCase();
  return <span className={`badge ${klass}`}>{status}</span>;
}

function BookingsPanel({ token, bookings, setBookings, pitches, users, promotions, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    userId: "",
    pitchId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "19:30",
    subtotalPrice: 300000,
    promotionCode: "",
    note: "",
    status: "PENDING",
    paymentStatus: "UNPAID",
  });

  const resetForm = () =>
    setForm({
      id: "",
      userId: "",
      pitchId: "",
      bookingDate: new Date().toISOString().slice(0, 10),
      startTime: "18:00",
      endTime: "19:30",
      subtotalPrice: 300000,
      promotionCode: "",
      note: "",
      status: "PENDING",
      paymentStatus: "UNPAID",
    });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      subtotalPrice: Number(form.subtotalPrice),
      promotionCode: form.promotionCode || undefined,
      userId: form.userId || undefined,
      status: form.status,
      paymentStatus: form.paymentStatus,
    };
    try {
      if (form.id) {
        const res = await api.bookings.update(token, form.id, payload);
        setBookings((prev) => prev.map((b) => (b.id === form.id ? res.data : b)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Booking đã được cập nhật" });
      } else {
        const res = await api.bookings.create(token, payload);
        setBookings((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo booking" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.bookings.updateStatus(token, id, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: res.data.status } : b)));
      pushToast({ type: "success", title: "Cập nhật trạng thái", message: `Booking đã chuyển sang ${status}` });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể cập nhật", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.bookings.remove(token, id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Booking đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
  };

  return (
    <section className="grid two">
      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Tạo booking</h3>
        <label>Khách hàng</label>
        <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
          <option value="">Chọn người dùng (tuỳ chọn)</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} - {u.email}</option>)}
        </select>
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
        <select value={form.promotionCode} onChange={(e) => setForm({ ...form, promotionCode: e.target.value })}>
          <option value="">Chọn mã (tuỳ chọn)</option>
          {promotions.map((p) => <option key={p.id} value={p.code}>{p.code} - {p.name}</option>)}
        </select>
        <label>Trạng thái booking</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
        <label>Trạng thái thanh toán</label>
        <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
          <option value="UNPAID">UNPAID</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="PAID">PAID</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <label>Ghi chú</label>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo booking"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách booking</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Khách</th><th>Sân</th><th>Ngày</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.bookingCode}</td>
                  <td>{b.user?.fullName || "-"}</td>
                  <td>{b.pitch?.name}</td>
                  <td>{new Date(b.bookingDate).toLocaleDateString("vi-VN")}</td>
                  <td>{formatMoney(b.totalPrice)}</td>
                  <td><StatusBadge status={b.paymentStatus} /></td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() =>
                        setForm({
                          id: b.id,
                          userId: b.userId || "",
                          pitchId: b.pitchId,
                          bookingDate: new Date(b.bookingDate).toISOString().slice(0, 10),
                          startTime: b.startTime,
                          endTime: b.endTime,
                          subtotalPrice: Number(b.subtotalPrice),
                          promotionCode: b.promotion?.code || "",
                          note: b.note || "",
                          status: b.status,
                          paymentStatus: b.paymentStatus,
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button className="small-btn" onClick={() => updateStatus(b.id, "CONFIRMED")}>Confirm</button>
                    <button className="small-btn ghost-btn" onClick={() => updateStatus(b.id, "CANCELLED")}>Cancel</button>
                    <button className="small-btn danger" onClick={() => handleDelete(b.id)}>Xoá</button>
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

function PromotionsPanel({ token, promotions, setPromotions, pushToast }) {
  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    description: "",
    type: "PERCENT",
    value: 10,
    minOrderValue: 100000,
    maxDiscount: 100000,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
    usageLimit: 100,
    isActive: true,
  });

  const resetForm = () =>
    setForm({
      id: "",
      code: "",
      name: "",
      description: "",
      type: "PERCENT",
      value: 10,
      minOrderValue: 100000,
      maxDiscount: 100000,
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
      usageLimit: 100,
      isActive: true,
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
    try {
      if (form.id) {
        const res = await api.promotions.update(token, form.id, payload);
        setPromotions((prev) => prev.map((item) => (item.id === form.id ? res.data : item)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Mã giảm giá đã được lưu" });
      } else {
        const res = await api.promotions.create(token, payload);
        setPromotions((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo mã giảm giá" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.promotions.remove(token, id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Mã giảm giá đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
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
        <label>Mô tả</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>Kích hoạt</label>
        <select value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
          <option value="true">ACTIVE</option>
          <option value="false">INACTIVE</option>
        </select>
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo mã"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách mã giảm giá</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Kiểu</th><th>Giá trị</th><th>Đã dùng</th><th>Trạng thái</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>{p.type}</td>
                  <td>{Number(p.value)}</td>
                  <td>{p.usedCount}</td>
                  <td>{p.isActive ? "ACTIVE" : "INACTIVE"}</td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          code: p.code,
                          name: p.name,
                          type: p.type,
                          value: Number(p.value),
                          minOrderValue: Number(p.minOrderValue || 0),
                          maxDiscount: Number(p.maxDiscount || 0),
                          startAt: new Date(p.startAt).toISOString().slice(0, 16),
                          endAt: new Date(p.endAt).toISOString().slice(0, 16),
                          usageLimit: p.usageLimit || 0,
                          isActive: p.isActive,
                          description: p.description || "",
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(p.id)}>Xoá</button>
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

function PaymentsPanel({ token, bookings, payments, setPayments, pushToast }) {
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [form, setForm] = useState({
    id: "",
    bookingId: "",
    amount: "",
    status: "PENDING",
    provider: "VNPAY",
    providerTxnNo: "",
    paidAt: "",
  });

  const resetForm = () =>
    setForm({ id: "", bookingId: "", amount: "", status: "PENDING", provider: "VNPAY", providerTxnNo: "", paidAt: "" });

  const createUrl = async () => {
    try {
      const res = await api.payments.createVnpayUrl(token, {
        bookingId,
        amount: amount ? Number(amount) : undefined,
      });
      setPaymentUrl(res.data.paymentUrl);
      pushToast({ type: "success", title: "Đã tạo link", message: "Link thanh toán đã sẵn sàng" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể tạo link", message: error.message || "Vui lòng thử lại" });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const res = await api.payments.update(token, form.id, {
          status: form.status,
          amount: Number(form.amount),
          providerTxnNo: form.providerTxnNo || undefined,
          paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : null,
        });
        setPayments((prev) => prev.map((p) => (p.id === form.id ? res.data : p)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Giao dịch đã được lưu" });
      } else {
        const res = await api.payments.create(token, {
          bookingId: form.bookingId,
          provider: form.provider,
          status: form.status,
          amount: Number(form.amount),
          providerTxnNo: form.providerTxnNo || undefined,
          paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : undefined,
        });
        setPayments((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo giao dịch" });
      }
      resetForm();
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng thử lại" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.payments.remove(token, id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      pushToast({ type: "success", title: "Đã xoá", message: "Giao dịch đã được xoá" });
    } catch (error) {
      pushToast({ type: "error", title: "Không thể xoá", message: error.message || "Vui lòng thử lại" });
    }
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
        <button type="button" onClick={createUrl}>Tạo URL thanh toán</button>
        {paymentUrl && (
          <div className="payment-link">
            <a href={paymentUrl} target="_blank" rel="noreferrer">Mở cổng thanh toán VNPay</a>
          </div>
        )}
      </div>

      <form className="card" onSubmit={submit}>
        <h3 className="card-title">Quản lý giao dịch</h3>
        <label>Booking</label>
        <select value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}>
          <option value="">Chọn booking</option>
          {bookings.map((b) => <option key={b.id} value={b.id}>{b.bookingCode} - {formatMoney(b.totalPrice)}</option>)}
        </select>
        <label>Số tiền</label>
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <label>Trạng thái</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="PENDING">PENDING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <label>Mã giao dịch nhà cung cấp</label>
        <input value={form.providerTxnNo} onChange={(e) => setForm({ ...form, providerTxnNo: e.target.value })} />
        <label>Thanh toán lúc</label>
        <input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
        <div className="form-actions">
          <button>{form.id ? "Cập nhật" : "Tạo giao dịch"}</button>
          {form.id && (
            <button type="button" className="ghost-btn" onClick={resetForm}>
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách giao dịch</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Booking</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.txnRef}</td>
                  <td>{p.booking?.bookingCode}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{new Date(p.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <button
                      className="small-btn ghost-btn"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          bookingId: p.bookingId,
                          amount: Number(p.amount),
                          status: p.status,
                          provider: p.provider,
                          providerTxnNo: p.providerTxnNo || "",
                          paidAt: p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 16) : "",
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(p.id)}>Xoá</button>
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
