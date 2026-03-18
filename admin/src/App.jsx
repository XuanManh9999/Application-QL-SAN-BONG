import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import * as echarts from "echarts";
import TurndownService from "turndown";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "./App.css";
import { api } from "./api";

const tabs = [
  { key: "dashboard", label: "Tổng quan" },
  { key: "venues", label: "Cụm sân" },
  { key: "pitches", label: "Sân con" },
  { key: "schedule", label: "Lịch sân" },
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

const isBlank = (v) => String(v ?? "").trim().length === 0;
const requireField = (value, message) => {
  if (isBlank(value)) throw new Error(message);
};
const requirePositiveNumber = (value, message) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(message);
};

const toDateInput = (d) => new Date(d).toISOString().slice(0, 10);
const toDateTimeLocalInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 16);
};
const pad2 = (n) => String(n).padStart(2, "0");
const timeToMinutes = (t) => {
  const [hh, mm] = String(t || "00:00").split(":").map((x) => Number(x));
  return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
};
const minutesToTime = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const isOverlapTime = (aStart, aEnd, bStart, bEnd) => {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  const be = timeToMinutes(bEnd);
  return Math.max(as, bs) < Math.min(ae, be);
};

function RichTextEditor({ value, onChange, placeholder }) {
  const hostRef = useRef(null);
  const quillRef = useRef(null);
  const lastValueRef = useRef(value || "");

  useEffect(() => {
    if (!hostRef.current || quillRef.current) return;

    const q = new Quill(hostRef.current, {
      theme: "snow",
      placeholder: placeholder || "Viết nội dung...",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link"],
          ["clean"],
        ],
      },
    });

    q.on("text-change", () => {
      const html = q.root.innerHTML;
      lastValueRef.current = html;
      onChange?.(html);
    });

    if (value) q.root.innerHTML = value;
    quillRef.current = q;
  }, [onChange, placeholder, value]);

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const next = value || "";
    if (next === lastValueRef.current) return;
    q.root.innerHTML = next;
    lastValueRef.current = next;
  }, [value]);

  return <div className="rte" ref={hostRef} />;
}

function MarkdownProEditor({ token, value, onChange, onUploadError }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const lastValueRef = useRef(value || "");

  useEffect(() => {
    if (!hostRef.current || editorRef.current) return;

    const editor = new Editor({
      el: hostRef.current,
      height: "640px",
      initialEditType: "wysiwyg",
      previewStyle: "tab",
      hideModeSwitch: true,
      usageStatistics: false,
      initialValue: value || "",
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          // Upload and insert URL (clean content, stable rendering)
          try {
            const res = await api.uploads.image(token, blob);
            const url = res?.data?.url;
            if (!url) throw new Error("Upload failed");
            callback(url, blob?.name || "image");
          } catch {
            callback("", "");
            onUploadError?.(new Error("Không thể upload ảnh. Vui lòng kiểm tra Backend đang chạy và bạn đã đăng nhập."));
          }
          return false;
        },
      },
    });

    editor.on("change", () => {
      const md = editor.getMarkdown();
      lastValueRef.current = md;
      onChange?.(md);
    });

    editorRef.current = editor;
  }, [onChange, onUploadError, token, value]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const next = value || "";
    if (next === lastValueRef.current) return;
    ed.setMarkdown(next, false);
    lastValueRef.current = next;
  }, [value]);

  useEffect(() => {
    return () => {
      try {
        editorRef.current?.destroy?.();
      } finally {
        editorRef.current = null;
      }
    };
  }, []);

  return <div className="md-pro" ref={hostRef} />;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});
const looksLikeHtml = (s) => /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
const toMarkdown = (content) => {
  const raw = String(content || "");
  if (!raw) return "";
  if (!looksLikeHtml(raw)) return raw;
  try {
    return turndown.turndown(raw);
  } catch {
    return raw.replace(/<[^>]+>/g, "").trim();
  }
};

function EChart({ option, height = 320 }) {
  const hostRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = echarts.init(hostRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option || {}, { notMerge: true, lazyUpdate: true });
  }, [option]);

  return <div className="chart" ref={hostRef} style={{ height }} />;
}

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

  const pushToast = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...payload }, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, payload.duration || 3200);
  }, []);

  const callWithToast = useCallback(async (fn, successText) => {
    try {
      setLoading(true);
      await fn();
      pushToast({ type: "success", title: "Thành công", message: successText });
    } catch (e) {
      pushToast({ type: "error", title: "Có lỗi", message: e.message || "Đã có lỗi xảy ra" });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  const loadAll = useCallback(async () => {
    if (!token) return;

    await callWithToast(async () => {
      const results = await Promise.allSettled([
        api.venues.list(token),
        api.pitches.list(token),
        api.bookings.list(token),
        api.promotions.list(token),
        api.payments.list(token),
        api.users.list(token),
        api.articles.list(token),
      ]);

      const names = ["cụm sân", "sân con", "booking", "khuyến mãi", "thanh toán", "người dùng", "bài viết"];
      const [v, p, b, promo, pay, u, art] = results;

      if (v.status === "fulfilled") setVenues(v.value.data || []);
      if (p.status === "fulfilled") setPitches(p.value.data || []);
      if (b.status === "fulfilled") setBookings(b.value.data || []);
      if (promo.status === "fulfilled") setPromotions(promo.value.data || []);
      if (pay.status === "fulfilled") setPayments(pay.value.data || []);
      if (u.status === "fulfilled") setUsers(u.value.data || []);
      if (art.status === "fulfilled") setArticles(art.value.data || []);

      const failed = results
        .map((r, i) => (r.status === "rejected" ? `${names[i]}: ${r.reason?.message || "lỗi"}` : null))
        .filter(Boolean);
      if (failed.length) {
        pushToast({
          type: "error",
          title: "Một số dữ liệu chưa tải được",
          message: failed.join(" • "),
          duration: 5200,
        });
      }
    }, "Đã đồng bộ dữ liệu mới nhất");
  }, [callWithToast, pushToast, token]);

  useEffect(() => {
    if (token) loadAll();
  }, [loadAll, token]);

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

        {activeTab === "dashboard" && (
          <Dashboard stats={stats} bookings={bookings} venues={venues} pitches={pitches} payments={payments} />
        )}
        {activeTab === "venues" && <VenuesPanel token={token} venues={venues} setVenues={setVenues} pushToast={pushToast} />}
        {activeTab === "pitches" && <PitchesPanel token={token} pitches={pitches} setPitches={setPitches} venues={venues} pushToast={pushToast} />}
        {activeTab === "schedule" && (
          <SchedulePanel
            token={token}
            venues={venues}
            pitches={pitches}
            users={users}
            promotions={promotions}
            setBookings={setBookings}
            pushToast={pushToast}
          />
        )}
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

function Dashboard({ stats, bookings, venues, pitches, payments }) {
  const kpis = [
    { title: "Cụm sân", value: stats.venueCount },
    { title: "Sân con", value: stats.pitchCount },
    { title: "Booking", value: stats.bookingCount },
    { title: "Mã giảm giá", value: stats.promoCount },
    { title: "Người dùng", value: stats.userCount },
    { title: "Bài viết", value: stats.articleCount },
  ];

  const pitchToVenue = useMemo(() => {
    const m = new Map();
    for (const p of pitches || []) m.set(p.id, p.venueId);
    return m;
  }, [pitches]);

  const venueName = useMemo(() => {
    const m = new Map();
    for (const v of venues || []) m.set(v.id, v.name);
    return m;
  }, [venues]);

  const revenueByDay = useMemo(() => {
    const days = 14;
    const labels = [];
    const totals = new Array(days).fill(0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      labels.push(d.toISOString().slice(0, 10));
    }
    const idx = (iso) => labels.indexOf(iso);
    for (const b of bookings || []) {
      const iso = new Date(b.bookingDate).toISOString().slice(0, 10);
      const i = idx(iso);
      if (i >= 0) totals[i] += Number(b.totalPrice || 0);
    }
    return { labels, totals };
  }, [bookings]);

  const bookingStatus = useMemo(() => {
    const map = new Map([
      ["PENDING", 0],
      ["CONFIRMED", 0],
      ["CANCELLED", 0],
      ["COMPLETED", 0],
    ]);
    for (const b of bookings || []) map.set(b.status, (map.get(b.status) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const paymentStatus = useMemo(() => {
    const map = new Map([
      ["PENDING", 0],
      ["SUCCESS", 0],
      ["FAILED", 0],
    ]);
    for (const p of payments || []) map.set(p.status, (map.get(p.status) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const revenueByVenue = useMemo(() => {
    const map = new Map();
    for (const b of bookings || []) {
      const venueId = pitchToVenue.get(b.pitchId) || b.pitch?.venueId;
      const key = venueId || "unknown";
      map.set(key, (map.get(key) || 0) + Number(b.totalPrice || 0));
    }
    const arr = Array.from(map.entries())
      .map(([venueId, value]) => ({
        name: venueId === "unknown" ? "Khác" : venueName.get(venueId) || venueId,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return arr;
  }, [bookings, pitchToVenue, venueName]);

  const baseTheme = useMemo(
    () => ({
      textStyle: { fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
      tooltip: { trigger: "axis" },
      grid: { left: 42, right: 18, top: 40, bottom: 36 },
    }),
    []
  );

  const optRevenueLine = useMemo(
    () => ({
      ...baseTheme,
      title: { text: "Doanh thu 14 ngày gần nhất", left: 12, top: 10, textStyle: { fontSize: 13, fontWeight: 700 } },
      xAxis: {
        type: "category",
        data: revenueByDay.labels.map((d) => d.slice(5).replace("-", "/")),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#64748b" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(226,232,240,0.8)" } },
        axisLabel: { color: "#64748b" },
      },
      series: [
        {
          type: "line",
          data: revenueByDay.totals,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color: "#2563eb" },
          areaStyle: { color: "rgba(37,99,235,0.14)" },
        },
      ],
    }),
    [revenueByDay, baseTheme]
  );

  const optBookingPie = useMemo(
    () => ({
      textStyle: baseTheme.textStyle,
      title: { text: "Booking theo trạng thái", left: 12, top: 10, textStyle: { fontSize: 13, fontWeight: 700 } },
      tooltip: { trigger: "item" },
      legend: { bottom: 10, left: "center", textStyle: { color: "#64748b" } },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 700 } },
          data: bookingStatus,
          color: ["#f59e0b", "#22c55e", "#ef4444", "#6366f1"],
        },
      ],
    }),
    [bookingStatus, baseTheme.textStyle]
  );

  const optRevenueVenue = useMemo(
    () => ({
      ...baseTheme,
      title: { text: "Doanh thu theo cụm sân (Top 8)", left: 12, top: 10, textStyle: { fontSize: 13, fontWeight: 700 } },
      xAxis: {
        type: "category",
        data: revenueByVenue.map((x) => x.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#64748b", rotate: 18 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(226,232,240,0.8)" } },
        axisLabel: { color: "#64748b" },
      },
      series: [
        {
          type: "bar",
          data: revenueByVenue.map((x) => x.value),
          barWidth: 18,
          itemStyle: { borderRadius: [8, 8, 0, 0], color: "#0ea5e9" },
        },
      ],
    }),
    [revenueByVenue, baseTheme]
  );

  const optPaymentPie = useMemo(
    () => ({
      textStyle: baseTheme.textStyle,
      title: { text: "Giao dịch theo trạng thái", left: 12, top: 10, textStyle: { fontSize: 13, fontWeight: 700 } },
      tooltip: { trigger: "item" },
      legend: { bottom: 10, left: "center", textStyle: { color: "#64748b" } },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 700 } },
          data: paymentStatus,
          color: ["#94a3b8", "#22c55e", "#ef4444"],
        },
      ],
    }),
    [paymentStatus, baseTheme.textStyle]
  );

  return (
    <section className="dashboard">
      <div className="kpi-grid">
        {kpis.map((k) => (
          <StatCard key={k.title} title={k.title} value={k.value} />
        ))}
        <StatCard title="Doanh thu tạm tính" value={formatMoney(stats.revenue)} full />
      </div>

      <div className="charts-grid">
        <div className="card chart-card span-2">
          <EChart option={optRevenueLine} height={320} />
        </div>
        <div className="card chart-card">
          <EChart option={optBookingPie} height={320} />
        </div>
        <div className="card chart-card span-2">
          <EChart option={optRevenueVenue} height={320} />
        </div>
        <div className="card chart-card">
          <EChart option={optPaymentPie} height={320} />
        </div>
      </div>
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
      requireField(form.name, "Vui lòng nhập tên cụm sân");
      requireField(form.address, "Vui lòng nhập địa chỉ");
      requireField(form.openTime, "Vui lòng nhập giờ mở");
      requireField(form.closeTime, "Vui lòng nhập giờ đóng");
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
                    <div className="actions-cell">
                      <button
                        className="small-btn ghost-btn"
                        onClick={() =>
                          setForm({
                            name: v.name,
                            address: v.address,
                            description: v.description || "",
                            openTime: v.openTime,
                            closeTime: v.closeTime,
                            status: v.status,
                            id: v.id,
                          })
                        }
                      >
                        Sửa
                      </button>
                      <button className="small-btn danger" onClick={() => handleDelete(v.id)}>Xoá</button>
                    </div>
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
      requireField(form.fullName, "Vui lòng nhập họ tên");
      requireField(form.email, "Vui lòng nhập email");
      if (form.id) {
        if (form.password && String(form.password).length < 8) {
          throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
        }
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
        const pwd = form.password || "Password@123";
        if (String(pwd).length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
        const res = await api.users.create(token, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          password: pwd,
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
                    <div className="actions-cell">
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
                    </div>
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
  const [editorSeed, setEditorSeed] = useState(0);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    authorId: "",
  });
  const resetForm = () =>
    setForm({ id: "", title: "", slug: "", summary: "", content: "", coverUrl: "", status: "DRAFT", authorId: "", publishedAt: "" });

  const filteredArticles = useMemo(() => {
    const q = String(filters.q || "").trim().toLowerCase();
    const byText = (a) => {
      if (!q) return true;
      const hay = `${a.title || ""}\n${a.slug || ""}\n${a.summary || ""}`.toLowerCase();
      return hay.includes(q);
    };
    const byStatus = (a) => (!filters.status ? true : String(a.status || "") === filters.status);
    const byAuthor = (a) => (!filters.authorId ? true : String(a.authorId || a.author?.id || "") === filters.authorId);
    return (articles || [])
      .filter((a) => byText(a) && byStatus(a) && byAuthor(a))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [articles, filters.authorId, filters.q, filters.status]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      requireField(form.title, "Vui lòng nhập tiêu đề");
      requireField(form.slug, "Vui lòng nhập slug");
      requireField(form.content, "Vui lòng nhập nội dung");
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng kiểm tra lại" });
      return;
    }
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
        <MarkdownProEditor
          key={`${form.id || "new"}-${editorSeed}`}
          token={token}
          value={form.content}
          onChange={(md) => setForm((prev) => ({ ...prev, content: md }))}
          onUploadError={(e) => pushToast({ type: "error", title: "Upload ảnh thất bại", message: e.message || "Vui lòng thử lại" })}
        />

        <label>Ảnh cover URL</label>
        <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <label>Tác giả</label>
        <select value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
          <option value="">Chọn tác giả</option>
          {form.authorId && users.every((u) => u.id !== form.authorId) && (
            <option value={form.authorId}>Tác giả hiện tại (không có trong danh sách)</option>
          )}
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
        <div className="table-top">
          <div>
            <h3 className="card-title">Danh sách bài viết</h3>
            <div className="subtitle">Hiển thị {filteredArticles.length} / {(articles || []).length} bài viết</div>
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setFilters({ q: "", status: "", authorId: "" })}
            disabled={!filters.q && !filters.status && !filters.authorId}
          >
            Xoá lọc
          </button>
        </div>

        <div className="table-filters">
          <div className="field">
            <label>Tìm kiếm</label>
            <input
              value={filters.q}
              onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
              placeholder="Tìm theo tiêu đề / slug / tóm tắt..."
            />
          </div>
          <div className="field">
            <label>Trạng thái</label>
            <select value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}>
              <option value="">Tất cả</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div className="field">
            <label>Tác giả</label>
            <select value={filters.authorId} onChange={(e) => setFilters((s) => ({ ...s, authorId: e.target.value }))}>
              <option value="">Tất cả</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tiêu đề</th><th>Slug</th><th>Trạng thái</th><th>Tác giả</th><th>Ngày tạo</th><th>Tác vụ</th></tr></thead>
            <tbody>
              {filteredArticles.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.slug}</td>
                  <td>{a.status}</td>
                  <td>{a.author?.fullName || "-"}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="small-btn ghost-btn"
                        onClick={() =>
                          (setForm({
                            id: a.id,
                            title: a.title,
                            slug: a.slug,
                            summary: a.summary || "",
                            content: toMarkdown(a.content),
                            coverUrl: a.coverUrl || "",
                            status: a.status,
                            authorId: a.authorId || a.author?.id || "",
                            publishedAt: a.publishedAt ? toDateTimeLocalInput(a.publishedAt) : "",
                          }), setEditorSeed((s) => s + 1))
                        }
                      >
                        Sửa
                      </button>
                      <button className="small-btn danger" onClick={() => handleDelete(a.id)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredArticles.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="notice" style={{ margin: 0 }}>
                      Không có bài viết nào phù hợp bộ lọc hiện tại.
                    </div>
                  </td>
                </tr>
              )}
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
        requireField(form.name, "Vui lòng nhập tên sân");
        requireField(form.pitchType, "Vui lòng nhập loại sân");
        requirePositiveNumber(form.basePrice, "Giá cơ bản phải lớn hơn 0");
        const res = await api.pitches.update(token, form.id, {
          name: form.name,
          pitchType: form.pitchType,
          basePrice: Number(form.basePrice),
          status: form.status,
        });
        setPitches((prev) => prev.map((item) => (item.id === form.id ? res.data : item)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Thông tin sân con đã được lưu" });
      } else {
        requireField(form.venueId, "Vui lòng chọn cụm sân");
        requireField(form.name, "Vui lòng nhập tên sân");
        requireField(form.pitchType, "Vui lòng nhập loại sân");
        requirePositiveNumber(form.basePrice, "Giá cơ bản phải lớn hơn 0");
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
                    <div className="actions-cell">
                      <button
                        className="small-btn ghost-btn"
                        onClick={() =>
                          setForm({
                            id: p.id,
                            venueId: p.venueId,
                            name: p.name,
                            pitchType: p.pitchType,
                            basePrice: Number(p.basePrice),
                            status: p.status,
                          })
                        }
                      >
                        Sửa
                      </button>
                      <button className="small-btn danger" onClick={() => handleDelete(p.id)}>Xoá</button>
                    </div>
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
    try {
      requireField(form.pitchId, "Vui lòng chọn sân");
      requireField(form.bookingDate, "Vui lòng chọn ngày");
      requireField(form.startTime, "Vui lòng nhập giờ bắt đầu");
      requireField(form.endTime, "Vui lòng nhập giờ kết thúc");
      requirePositiveNumber(form.subtotalPrice, "Tạm tính phải lớn hơn 0");
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng kiểm tra lại" });
      return;
    }
    const basePayload = {
      pitchId: form.pitchId,
      bookingDate: form.bookingDate,
      startTime: form.startTime,
      endTime: form.endTime,
      subtotalPrice: Number(form.subtotalPrice),
      promotionCode: form.promotionCode || undefined,
      userId: form.userId || undefined,
      note: form.note || undefined,
    };
    try {
      if (form.id) {
        const payload = {
          ...basePayload,
          status: form.status,
          paymentStatus: form.paymentStatus,
        };
        const res = await api.bookings.update(token, form.id, payload);
        setBookings((prev) => prev.map((b) => (b.id === form.id ? res.data : b)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Booking đã được cập nhật" });
      } else {
        const res = await api.bookings.create(token, basePayload);
        setBookings((prev) => [res.data, ...prev]);
        pushToast({ type: "success", title: "Thành công", message: "Đã tạo booking" });
      }
      resetForm();
    } catch (error) {
      const msg = error?.message || "Vui lòng thử lại";
      pushToast({
        type: "error",
        title: "Không thể lưu",
        message: msg.includes("Time slot already booked") ? "Khung giờ đã được đặt. Vui lòng chọn khung khác." : msg,
      });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.bookings.updateStatus(token, id, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: res.data.status } : b)));
      pushToast({ type: "success", title: "Cập nhật trạng thái", message: `Booking đã chuyển sang ${status}` });
    } catch (error) {
      const msg = error?.message || "Vui lòng thử lại";
      pushToast({
        type: "error",
        title: "Không thể cập nhật",
        message: msg.includes("Time slot already booked") ? "Khung giờ đã bị trùng lịch, không thể xác nhận." : msg,
      });
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
                    <div className="actions-cell">
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
                    </div>
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

function SchedulePanel({ token, venues, pitches, users, promotions, setBookings, pushToast }) {
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [venueId, setVenueId] = useState("");
  const [pitchId, setPitchId] = useState("");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const filteredPitches = useMemo(() => {
    const list = pitches || [];
    if (!venueId) return list;
    return list.filter((p) => p.venueId === venueId);
  }, [pitches, venueId]);

  useEffect(() => {
    if (pitchId && filteredPitches.every((p) => p.id !== pitchId)) setPitchId("");
  }, [filteredPitches, pitchId]);

  const reloadSchedule = useCallback(async () => {
    try {
      setScheduleLoading(true);
      const res = await api.bookings.list(token, { date, pitchId: pitchId || undefined });
      setScheduleBookings(res.data || []);
    } catch (e) {
      pushToast({ type: "error", title: "Không tải được lịch", message: e.message || "Vui lòng thử lại" });
    } finally {
      setScheduleLoading(false);
    }
  }, [date, pitchId, pushToast, token]);

  useEffect(() => {
    reloadSchedule();
  }, [reloadSchedule]);

  const dayBookings = useMemo(() => {
    if (!venueId) return scheduleBookings || [];
    const pitchMap = new Map((pitches || []).map((p) => [p.id, p.venueId]));
    return (scheduleBookings || []).filter((b) => pitchMap.get(b.pitchId) === venueId);
  }, [scheduleBookings, venueId, pitches]);

  const bookingByPitch = useMemo(() => {
    const map = new Map();
    for (const b of dayBookings) {
      const arr = map.get(b.pitchId) || [];
      arr.push(b);
      map.set(b.pitchId, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      map.set(k, arr);
    }
    return map;
  }, [dayBookings]);

  const visiblePitches = useMemo(() => {
    const list = filteredPitches;
    if (pitchId) return list.filter((p) => p.id === pitchId);
    return list;
  }, [filteredPitches, pitchId]);

  const getPitchBasePrice = useCallback(
    (id) => {
      const p = (pitches || []).find((x) => x.id === id);
      const n = Number(p?.basePrice);
      return Number.isFinite(n) && n > 0 ? n : 300000;
    },
    [pitches]
  );

  const timeSlots = useMemo(() => {
    const start = 6 * 60;
    const end = 23 * 60;
    const step = 30;
    const slots = [];
    for (let t = start; t <= end; t += step) slots.push(t);
    return slots;
  }, []);

  const pickSlot = (p, startMin) => {
    const endMin = startMin + 90;
    setSelected({
      pitchId: p.id,
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
      slotKey: `${p.id}-${date}-${startMin}`,
      subtotalPrice: Number.isFinite(Number(p?.basePrice)) && Number(p.basePrice) > 0 ? Number(p.basePrice) : 300000,
      userId: "",
      promotionCode: "",
      note: "",
    });
  };

  const createBooking = async () => {
    if (!selected) return;
    try {
      setCreating(true);
      requireField(selected.pitchId, "Vui lòng chọn sân");
      requireField(date, "Vui lòng chọn ngày");
      requireField(selected.startTime, "Vui lòng chọn giờ bắt đầu");
      requireField(selected.endTime, "Vui lòng chọn giờ kết thúc");
      const subtotal = Number(selected.subtotalPrice ?? getPitchBasePrice(selected.pitchId));
      requirePositiveNumber(subtotal, "Tạm tính phải lớn hơn 0");

      const payload = {
        pitchId: selected.pitchId,
        bookingDate: date,
        startTime: selected.startTime,
        endTime: selected.endTime,
        subtotalPrice: subtotal,
        promotionCode: selected.promotionCode || undefined,
        userId: selected.userId || undefined,
        note: selected.note || undefined,
      };

      // Client-side guard: prevent overlapping bookings in same day/pitch.
      const existing = (scheduleBookings || []).filter(
        (b) => b.pitchId === payload.pitchId && toDateInput(b.bookingDate) === payload.bookingDate && ["PENDING", "CONFIRMED"].includes(b.status)
      );
      const conflict = existing.find((b) => isOverlapTime(payload.startTime, payload.endTime, b.startTime, b.endTime));
      if (conflict) {
        throw new Error(`Khung giờ đã được đặt (${conflict.startTime} - ${conflict.endTime}). Vui lòng chọn khung khác.`);
      }

      const res = await api.bookings.create(token, payload);
      setBookings((prev) => [res.data, ...(prev || [])]);
      setScheduleBookings((prev) => [res.data, ...(prev || [])]);
      pushToast({ type: "success", title: "Thành công", message: "Đã tạo booking" });
      setSelected(null);
    } catch (e) {
      pushToast({ type: "error", title: "Không thể tạo booking", message: e.message || "Vui lòng thử lại" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="schedule">
      <div className="schedule-toolbar card">
        <div className="schedule-filters">
          <div>
            <label>Ngày</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label>Cụm sân</label>
            <select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
              <option value="">Tất cả</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Sân</label>
            <select value={pitchId} onChange={(e) => setPitchId(e.target.value)}>
              <option value="">Tất cả</option>
              {filteredPitches.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pitchType})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="notice schedule-hint">
          Click vào một khung giờ trống để tạo booking nhanh (mặc định 90 phút).
        </div>
      </div>

      <div className="schedule-grid">
        <div className="card">
          <div className="schedule-table">
            <div
              className="schedule-head"
              style={{ gridTemplateColumns: `72px repeat(${Math.max(1, visiblePitches.length)}, minmax(160px, 1fr))` }}
            >
              <div className="cell time">Giờ</div>
              {visiblePitches.map((p) => (
                <div key={p.id} className="cell pitch">
                  <div className="pitch-name">{p.name}</div>
                  <div className="pitch-sub">{p.pitchType}</div>
                </div>
              ))}
            </div>

            {timeSlots.map((t) => (
              <div
                key={t}
                className="schedule-row"
                style={{ gridTemplateColumns: `72px repeat(${Math.max(1, visiblePitches.length)}, minmax(160px, 1fr))` }}
              >
                <div className="cell time">{minutesToTime(t)}</div>
                {visiblePitches.map((p) => {
                  const list = bookingByPitch.get(p.id) || [];
                  const hit = list.find((b) => {
                    const s = timeToMinutes(b.startTime);
                    const e = timeToMinutes(b.endTime);
                    return t >= s && t < e;
                  });
                  const isStart = hit && timeToMinutes(hit.startTime) === t;
                  return (
                    <div
                      key={`${p.id}-${t}`}
                      className={
                        hit
                          ? "cell slot busy"
                          : selected?.slotKey === `${p.id}-${date}-${t}`
                            ? "cell slot selected"
                            : "cell slot"
                      }
                      onClick={() => (!hit ? pickSlot(p, t) : null)}
                      role="button"
                      tabIndex={0}
                    >
                      {hit && isStart ? (
                        <div className="booking-pill">
                          <div className="booking-title">{hit.bookingCode}</div>
                          <div className="booking-sub">
                            {hit.startTime} - {hit.endTime}
                          </div>
                        </div>
                      ) : hit ? (
                        <div className="booking-ghost" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="card quick-card">
          <div className="quick-header">
            <h3 className="card-title">Đặt lịch nhanh</h3>
            {selected ? (
              <button type="button" className="ghost-btn small-btn" onClick={() => setSelected(null)}>
                Bỏ chọn
              </button>
            ) : null}
          </div>

          {scheduleLoading ? <div className="notice">Đang tải lịch...</div> : null}

          {!selected ? (
            <div className="notice">Chọn một khung giờ trống ở bảng lịch để tạo booking.</div>
          ) : (
            <div className="quick-form">
              <div className="form-grid">
                <div className="field">
                  <label>Sân</label>
                  <select
                    value={selected.pitchId}
                    onChange={(e) =>
                      setSelected((s) => {
                        const nextPitchId = e.target.value;
                        const current = Number(s?.subtotalPrice);
                        const shouldAutofill = !Number.isFinite(current) || current <= 0;
                        return {
                          ...s,
                          pitchId: nextPitchId,
                          subtotalPrice: shouldAutofill ? getPitchBasePrice(nextPitchId) : s.subtotalPrice,
                        };
                      })
                    }
                  >
                    {filteredPitches.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pitchType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Ngày</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="field">
                  <label>Giờ bắt đầu</label>
                  <input value={selected.startTime} onChange={(e) => setSelected((s) => ({ ...s, startTime: e.target.value }))} />
                </div>

                <div className="field">
                  <label>Giờ kết thúc</label>
                  <input value={selected.endTime} onChange={(e) => setSelected((s) => ({ ...s, endTime: e.target.value }))} />
                </div>

                <div className="field span-2">
                  <label>Khách hàng (tuỳ chọn)</label>
                  <select value={selected.userId || ""} onChange={(e) => setSelected((s) => ({ ...s, userId: e.target.value || "" }))}>
                    <option value="">Chọn người dùng</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field span-2">
                  <label>Mã giảm giá (tuỳ chọn)</label>
                  <select
                    value={selected.promotionCode || ""}
                    onChange={(e) => setSelected((s) => ({ ...s, promotionCode: e.target.value || "" }))}
                  >
                    <option value="">Không dùng</option>
                    {promotions.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Tạm tính</label>
                  <input
                    type="number"
                    value={selected.subtotalPrice || 300000}
                    onChange={(e) => setSelected((s) => ({ ...s, subtotalPrice: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label>Ghi chú</label>
                  <input value={selected.note || ""} onChange={(e) => setSelected((s) => ({ ...s, note: e.target.value }))} />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={createBooking} disabled={creating}>
                  {creating ? "Đang tạo..." : "Tạo booking"}
                </button>
                <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PromotionsPanel({ token, promotions, setPromotions, pushToast }) {
  const [form, setForm] = useState(() => ({
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
  }));

  const resetForm = () =>
    setForm(() => ({
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
    }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      requireField(form.name, "Vui lòng nhập tên chương trình");
      requireField(form.type, "Vui lòng chọn kiểu giảm");
      requirePositiveNumber(form.value, "Giá trị giảm phải lớn hơn 0");
      requireField(form.startAt, "Vui lòng chọn thời gian bắt đầu");
      requireField(form.endAt, "Vui lòng chọn thời gian kết thúc");
      if (!form.id) requireField(form.code, "Vui lòng nhập code");
    } catch (error) {
      pushToast({ type: "error", title: "Không thể lưu", message: error.message || "Vui lòng kiểm tra lại" });
      return;
    }
    const maybePositive = (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    const commonPayload = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minOrderValue: maybePositive(form.minOrderValue),
      maxDiscount: maybePositive(form.maxDiscount),
      usageLimit: maybePositive(form.usageLimit),
      isActive: form.isActive,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
    };
    try {
      if (form.id) {
        // Update schema does NOT allow changing code; also omit optional numeric fields when empty/0.
        const res = await api.promotions.update(token, form.id, commonPayload);
        setPromotions((prev) => prev.map((item) => (item.id === form.id ? res.data : item)));
        pushToast({ type: "success", title: "Đã cập nhật", message: "Mã giảm giá đã được lưu" });
      } else {
        const createPayload = {
          ...commonPayload,
          code: form.code,
        };
        const res = await api.promotions.create(token, createPayload);
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
                    <div className="actions-cell">
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
                    </div>
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
  const [q, setQ] = useState("");

  const filteredPayments = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return payments || [];
    const norm = (v) => String(v || "").toLowerCase();
    return (payments || []).filter((p) => {
      const booking = p.booking || {};
      const user = booking.user || {};
      const pitch = booking.pitch || {};
      const hay = [
        p.txnRef,
        p.providerTxnNo,
        p.provider,
        p.status,
        p.amount,
        booking.bookingCode,
        booking.paymentStatus,
        user.fullName,
        user.email,
        user.phone,
        pitch.name,
      ]
        .map(norm)
        .join(" | ");
      return hay.includes(query);
    });
  }, [payments, q]);

  return (
    <section className="grid two payments">
      <div className="card payments-search">
        <h3 className="card-title">Tìm kiếm giao dịch</h3>
        <div className="notice">
          Thanh toán VNPay được thực hiện trên app khách hàng. Tab này chỉ dùng để tra cứu giao dịch.
        </div>
        <label>Từ khoá</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo mã giao dịch / booking / tên khách / email / SĐT / sân / trạng thái..."
        />
        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={() => setQ("")} disabled={!q}>
            Xoá tìm kiếm
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-top">
          <div>
            <h3 className="card-title">Danh sách giao dịch</h3>
            <div className="subtitle">Hiển thị {filteredPayments.length} / {(payments || []).length} giao dịch</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Booking</th>
                <th>Người thanh toán</th>
                <th>Sân</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.txnRef}</td>
                  <td>{p.booking?.bookingCode}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.booking?.user?.fullName || "-"}</div>
                    <div className="muted small">{p.booking?.user?.email || ""}</div>
                    <div className="muted small">{p.booking?.user?.phone || ""}</div>
                  </td>
                  <td>{p.booking?.pitch?.name || "-"}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{new Date(p.createdAt).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
              {!filteredPayments.length && (
                <tr>
                  <td colSpan={7}>
                    <div className="notice" style={{ margin: 0 }}>
                      Không có giao dịch nào phù hợp.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
