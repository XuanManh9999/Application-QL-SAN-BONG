const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const buildHeaders = (token, hasJson = true) => {
  const headers = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const request = async (path, { method = "GET", body, token } = {}) => {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined && !isFormData),
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data;
};

export const api = {
  auth: {
    login: (payload) => request("/auth/login", { method: "POST", body: payload }),
    forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload }),
    me: (token) => request("/users/me", { token }),
  },
  venues: {
    list: (token) => request("/venues", { token }),
    create: (token, payload) => request("/venues", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/venues/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/venues/${id}`, { method: "DELETE", token }),
  },
  pitches: {
    list: (token, venueId) => request(`/pitches${venueId ? `?venueId=${venueId}` : ""}`, { token }),
    create: (token, payload) => request("/pitches", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/pitches/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/pitches/${id}`, { method: "DELETE", token }),
  },
  bookings: {
    list: (token, query) => {
      const qs = query
        ? `?${new URLSearchParams(
            Object.entries(query).filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
          ).toString()}`
        : "";
      return request(`/bookings${qs}`, { token });
    },
    create: (token, payload) => request("/bookings", { method: "POST", token, body: payload }),
    updateStatus: (token, id, payload) => request(`/bookings/${id}/status`, { method: "PATCH", token, body: payload }),
    update: (token, id, payload) => request(`/bookings/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/bookings/${id}`, { method: "DELETE", token }),
  },
  promotions: {
    list: (token) => request("/promotions", { token }),
    create: (token, payload) => request("/promotions", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/promotions/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/promotions/${id}`, { method: "DELETE", token }),
    apply: (token, payload) => request("/promotions/apply", { method: "POST", token, body: payload }),
  },
  payments: {
    list: (token) => request("/payments", { token }),
    create: (token, payload) => request("/payments", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/payments/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/payments/${id}`, { method: "DELETE", token }),
    createVnpayUrl: (token, payload) => request("/payments/vnpay/create-url", { method: "POST", token, body: payload }),
  },
  users: {
    list: (token) => request("/users", { token }),
    create: (token, payload) => request("/users", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/users/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/users/${id}`, { method: "DELETE", token }),
  },
  articles: {
    list: (token) => request("/articles", { token }),
    create: (token, payload) => request("/articles", { method: "POST", token, body: payload }),
    update: (token, id, payload) => request(`/articles/${id}`, { method: "PATCH", token, body: payload }),
    remove: (token, id) => request(`/articles/${id}`, { method: "DELETE", token }),
  },
  uploads: {
    image: async (token, fileOrBlob) => {
      const fd = new FormData();
      const name = fileOrBlob?.name || `image-${Date.now()}.png`;
      fd.append("file", fileOrBlob, name);
      const res = await request("/uploads/images", { method: "POST", token, body: fd });
      const rawUrl = res?.data?.url;
      const path = res?.data?.path;
      const url = rawUrl || (path ? `${API_ORIGIN}${path}` : "");
      return { ...res, data: { ...res.data, url } };
    },
  },
};

export { API_BASE_URL };
