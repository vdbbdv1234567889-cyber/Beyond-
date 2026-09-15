const BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("admin_token");
}

function handleSessionExpired() {
  localStorage.removeItem("admin_token");
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.href = "/admin/login";
  }
}

async function apiFetch(path, { method = "GET", body, isFormData = false, auth = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (!token) {
      handleSessionExpired();
      throw new Error("Login required");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleSessionExpired();
    throw new Error("Session expired, please log in again");
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || "Something went wrong, please try again");
  }

  return res.json();
}

export const getProducts = () => apiFetch("/products");
export const getProductById = (id) => apiFetch(`/products/${id}`);
export const createOrder = (orderData) => apiFetch("/orders", { method: "POST", body: orderData });

export const loginRequest = (username, password) =>
  apiFetch("/auth/login", { method: "POST", body: { username, password } });
export const logoutRequest = () => apiFetch("/auth/logout", { method: "POST", auth: true }).catch(() => {});
export const changeCredentials = (data) => apiFetch("/auth/credentials", { method: "PATCH", body: data, auth: true });

export const createProduct = (productData) => apiFetch("/products", { method: "POST", body: productData, auth: true });
export const updateProduct = (id, productData) => apiFetch(`/products/${id}`, { method: "PUT", body: productData, auth: true });
export const deleteProduct = (id) => apiFetch(`/products/${id}`, { method: "DELETE", auth: true });
export const addProductImage = (productId, imageUrl) =>
  apiFetch(`/products/${productId}/images`, { method: "POST", body: { image_url: imageUrl }, auth: true });
export const deleteProductImage = (productId, imageId) =>
  apiFetch(`/products/${productId}/images/${imageId}`, { method: "DELETE", auth: true });
export const addProductDesign = (productId, imageUrl, name = "") =>
  apiFetch(`/products/${productId}/designs`, { method: "POST", body: { image_url: imageUrl, name }, auth: true });
export const deleteProductDesign = (productId, designId) =>
  apiFetch(`/products/${productId}/designs/${designId}`, { method: "DELETE", auth: true });

export const getOrders = () => apiFetch("/orders", { auth: true });
export const getOrderById = (orderId) => apiFetch(`/orders/${orderId}`);
export const updateOrderNotes = (orderId, adminNotes) =>
  apiFetch(`/orders/${orderId}/notes`, { method: "PATCH", body: { admin_notes: adminNotes }, auth: true });
export const updateOrderStatus = (orderId, status) =>
  apiFetch(`/orders/${orderId}/status`, { method: "PATCH", body: { status }, auth: true });
export const getOrderStatuses = () => apiFetch("/orders/statuses");
export const updateOrder = (orderId, data) => apiFetch(`/orders/${orderId}`, { method: "PATCH", body: data });
export const updateShippingLabel = (orderId, imageUrl) =>
  apiFetch(`/orders/${orderId}/shipping-label`, { method: "PATCH", body: { shipping_label_url: imageUrl }, auth: true });

export const getSettings = () => apiFetch("/settings");
export const updateSettings = (settingsData) => apiFetch("/settings", { method: "PUT", body: settingsData, auth: true });

export const getShippingFees = () => apiFetch("/shipping-fees");
export const updateShippingFees = (fees) => apiFetch("/shipping-fees", { method: "PUT", body: { fees }, auth: true });

export const getBanners = (type) => apiFetch(`/banners/${type}`);
export const addBanner = (type, imageUrl) => apiFetch(`/banners/${type}`, { method: "POST", body: { image_url: imageUrl }, auth: true });
export const deleteBanner = (bannerId) => apiFetch(`/banners/${bannerId}`, { method: "DELETE", auth: true });

export const getReviews = () => apiFetch("/reviews");
export const addReview = (imageUrl) => apiFetch("/reviews", { method: "POST", body: { image_url: imageUrl }, auth: true });
export const deleteReview = (reviewId) => apiFetch(`/reviews/${reviewId}`, { method: "DELETE", auth: true });

export const getDiscountCodes = () => apiFetch("/discount-codes", { auth: true });
export const createDiscountCode = (code, discountPercent, usageLimit) =>
  apiFetch("/discount-codes", {
    method: "POST",
    body: { code, discount_percent: discountPercent, usage_limit: usageLimit || null },
    auth: true,
  });
export const deleteDiscountCode = (id) => apiFetch(`/discount-codes/${id}`, { method: "DELETE", auth: true });
export const validateDiscountCode = (code) => apiFetch(`/discount-codes/validate/${code}`);

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch("/upload", { method: "POST", body: formData, isFormData: true, auth: true });
}

export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
}

export const LOW_STOCK_THRESHOLD = 5;

export function getEffectivePrice(product) {
  const hasDiscount =
    product.discount_price !== null && product.discount_price !== undefined &&
    product.discount_price > 0 && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
  return {
    hasDiscount,
    currentPrice: hasDiscount ? product.discount_price : product.price,
    originalPrice: product.price,
    discountPercent,
  };
}

export function formatPrice(amount) {
  return Math.round(amount).toLocaleString("en-US");
}
