import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getProducts, getOrders, getOrderById, updateOrderNotes, updateOrderStatus, getOrderStatuses,
  getSettings, updateSettings, uploadImage, resolveImageUrl,
  getShippingFees, updateShippingFees, getBanners, addBanner, deleteBanner, getEffectivePrice,
  formatPrice, changeCredentials, logoutRequest,
  getDiscountCodes, createDiscountCode, deleteDiscountCode,
  getReviews, addReview, deleteReview, updateShippingLabel, deleteProduct,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import OrdersNotificationWatcher from "../components/OrdersNotificationWatcher";
import { Package, ClipboardList, Settings as SettingsIcon, Plus, Search, LogOut, Tag } from "lucide-react";

export default function AdminPage() {
  const [tab, setTab] = useState("products");
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutRequest();
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="container">
      <OrdersNotificationWatcher />
      <div className="admin-header-row">
        <h1>Admin Dashboard</h1>
        <button className="btn-cancel" onClick={handleLogout}><LogOut size={16} /> Logout</button>
      </div>
      <div className="admin-tabs">
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><Package size={18} /> Products</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><ClipboardList size={18} /> Orders</button>
        <button className={tab === "discounts" ? "active" : ""} onClick={() => setTab("discounts")}><Tag size={18} /> Discount Codes</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><SettingsIcon size={18} /> Settings</button>
      </div>
      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "discounts" && <DiscountCodesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  function loadProducts() {
    setLoading(true);
    getProducts().then(setProducts).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(() => { loadProducts(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this product? This can't be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const numbered = [...products].sort((a, b) => a.id - b.id).map((p, i) => ({ ...p, seq: i + 1 }));
  const filtered = search.trim()
    ? numbered.filter((p) => String(p.seq).includes(search.trim()))
    : numbered;

  return (
    <div>
      <div className="admin-toolbar">
        <Link to="/admin/products/new" className="btn-checkout admin-add-btn"><Plus size={18} /> Add New Product</Link>
        <div className="admin-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by product number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <p className="status-msg status-error">{error}</p>}

      {loading ? <p className="status-msg">Loading...</p> : (
        <table className="admin-table admin-table-full">
          <thead><tr><th>#</th><th>Product</th><th>Price</th><th>Stock</th><th></th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => {
              const { hasDiscount, discountPercent } = getEffectivePrice(p);
              return (
                <tr key={p.id}>
                  <td className="seq-number">#{p.seq}</td>
                  <td className="admin-table-product">
                    <img src={resolveImageUrl(p.image_url)} alt={p.name} />
                    <span dir="auto">{p.name}</span>
                    {hasDiscount && <span className="admin-discount-tag">-{discountPercent}%</span>}
                  </td>
                  <td>
                    {hasDiscount
                      ? <><span className="price-new">EGP {formatPrice(p.discount_price)}</span> <span className="price-old-sm">EGP {formatPrice(p.price)}</span></>
                      : `EGP ${formatPrice(p.price)}`}
                  </td>
                  <td className={p.stock === 0 ? "stock-zero" : ""}>{p.stock}</td>
                  <td><Link to={`/admin/products/${p.id}/edit`} className="btn-edit">Edit</Link></td>
                  <td>
                    <button className="btn-cancel" onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}>
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    Promise.all([getOrders(), getOrderStatuses()])
      .then(([o, s]) => { setOrders(o); setStatuses(s); })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSelectedOrder(null);
      }
    }
    if (selectedOrder) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOrder]);

  async function viewOrder(id) {
    const order = await getOrderById(id);
    setSelectedOrder(order);
    setNotesDraft(order.admin_notes || "");
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await updateOrderNotes(selectedOrder.id, notesDraft);
      setSelectedOrder({ ...selectedOrder, admin_notes: notesDraft });
    } finally { setSavingNotes(false); }
  }

  async function changeStatus(newStatus) {
    setSavingStatus(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
    } finally { setSavingStatus(false); }
  }

  async function handleShippingLabelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLabel(true);
    try {
      const result = await uploadImage(file);
      const updated = await updateShippingLabel(selectedOrder.id, result.image_url);
      setSelectedOrder({ ...selectedOrder, shipping_label_url: updated.shipping_label_url });
    } finally { setUploadingLabel(false); }
  }

  if (loading) return <p className="status-msg">Loading...</p>;
  if (loadError) return <p className="status-msg status-error">{loadError}</p>;
  if (orders.length === 0) return <p className="status-msg">No orders yet.</p>;

  return (
    <div>
      <table className="admin-table admin-table-full">
        <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td><td>{o.customer_name}</td><td>EGP {formatPrice(o.total)}</td>
              <td><span className="order-status-chip">{o.status}</span></td>
              <td><button className="btn-edit" onClick={() => viewOrder(o.id)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div className="order-detail-overlay">
          <div className="order-detail-panel order-detail-panel-modal" ref={panelRef}>
            <h3>Order Details #{selectedOrder.id}</h3>
            <p><strong>Customer:</strong> <span dir="auto">{selectedOrder.customer_name}</span></p>
            <p><strong>Phone:</strong> {selectedOrder.phone}</p>
            <p dir="auto"><strong>Address:</strong> {selectedOrder.governorate} - {selectedOrder.district} - {selectedOrder.area}
              {selectedOrder.landmark && ` - ${selectedOrder.landmark}`}</p>

            {selectedOrder.customer_note && (
              <div className="customer-note-box"><strong>💬 Customer note:</strong><p dir="auto">{selectedOrder.customer_note}</p></div>
            )}

            <hr />
            {selectedOrder.items.map((item, i) => (
              <div className="checkout-summary-row order-item-row" key={i}>
                <span dir="auto">
                  {item.name} {item.selected_size && `(${item.selected_size})`} {item.selected_color && `(${item.selected_color})`} × {item.quantity}
                </span>
                <span>EGP {formatPrice(item.price_at_purchase * item.quantity)}</span>
                {item.selected_design_url && (
                  <img src={resolveImageUrl(item.selected_design_url)} alt="Selected design" className="order-item-design-thumb" />
                )}
              </div>
            ))}
            <div className="checkout-summary-row"><span>Shipping</span><span>EGP {formatPrice(selectedOrder.shipping_fee)}</span></div>
            <div className="checkout-summary-total"><span>Total</span><span>EGP {formatPrice(selectedOrder.total)}</span></div>

            <hr />
            <div className="order-status-section">
              <span className="admin-notes-label">Order Status</span>
              <div className="status-steps">
                {statuses.map((s) => (
                  <button key={s} className={`status-step-btn ${selectedOrder.status === s ? "active" : ""}`} onClick={() => changeStatus(s)} disabled={savingStatus}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <hr />
            <div className="shipping-label-section">
              <span className="admin-notes-label">Shipping Waybill</span>
              {selectedOrder.shipping_label_url ? (
                <img src={resolveImageUrl(selectedOrder.shipping_label_url)} alt="Shipping waybill" className="shipping-label-preview" />
              ) : (
                <p className="admin-hint-small">No waybill image uploaded yet.</p>
              )}
              <label>{selectedOrder.shipping_label_url ? "Replace Waybill Image" : "Upload Waybill Image"}
                <input type="file" accept="image/jpeg" onChange={handleShippingLabelUpload} />
              </label>
              {uploadingLabel && <p className="upload-status">Uploading...</p>}
            </div>

            <hr />
            <label className="admin-notes-label">
              Your Private Notes (internal, not visible to the customer)
              <textarea rows={3} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="e.g. Called the customer and confirmed the order..." />
            </label>
            <button className="btn-edit" onClick={saveNotes} disabled={savingNotes}>{savingNotes ? "Saving..." : "Save Notes"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscountCodesTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function loadCodes() {
    setLoading(true);
    getDiscountCodes().then(setCodes).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(() => { loadCodes(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createDiscountCode(newCode, newPercent, newLimit);
      setNewCode("");
      setNewPercent("");
      setNewLimit("");
      loadCodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDiscountCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-grid">
      <form className="admin-form" onSubmit={handleAdd}>
        <h3>Add Discount Code</h3>
        <label>Code
          <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. WELCOME10" required />
        </label>
        <label>Discount Percentage
          <input type="number" min="1" max="100" value={newPercent} onChange={(e) => setNewPercent(e.target.value)} required />
        </label>
        <label>Usage Limit (optional)
          <input type="number" min="1" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="Leave empty for unlimited uses" />
        </label>
        {error && <p className="status-msg status-error">{error}</p>}
        <button type="submit" className="btn-checkout" disabled={saving}>{saving ? "Saving..." : "Add Code"}</button>
      </form>

      <div>
        {loading ? <p className="status-msg">Loading...</p> : codes.length === 0 ? (
          <p className="status-msg">No discount codes yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Usage</th><th></th></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discount_percent}%</td>
                  <td>{c.usage_limit ? `${c.times_used} / ${c.usage_limit}` : `${c.times_used} (unlimited)`}</td>
                  <td><button className="btn-cancel" onClick={() => handleDelete(c.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getReviews().then(setReviews).catch((err) => setError(err.message)); }, []);

  async function handleAdd(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      const newReview = await addReview(result.image_url);
      setReviews((prev) => [...prev, newReview]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(reviewId) {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-form settings-card">
      <h3>Customer Reviews</h3>
      <p className="admin-hint-small">Screenshots or photos of customer reviews shown in a carousel at the bottom of the homepage.</p>
      {error && <p className="status-msg status-error">{error}</p>}
      <div className="gallery-grid">
        {reviews.map((r) => (
          <div className="gallery-item banner-item" key={r.id}>
            <img src={resolveImageUrl(r.image_url)} alt="Review" />
            <button type="button" onClick={() => handleDelete(r.id)}>Remove</button>
          </div>
        ))}
      </div>
      <label>Add Review Image
        <input type="file" accept="image/jpeg" onChange={handleAdd} />
      </label>
      {uploading && <p className="upload-status">Uploading...</p>}
    </div>
  );
}

function BannerManager({ type, title }) {
  const [banners, setBanners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getBanners(type).then(setBanners).catch((err) => setError(err.message)); }, [type]);

  async function handleAdd(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      const newBanner = await addBanner(type, result.image_url);
      setBanners((prev) => [...prev, newBanner]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(bannerId) {
    try {
      await deleteBanner(bannerId);
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-form settings-card">
      <h3>{title}</h3>
      <p className="admin-hint-small">You can add more than one image; they'll rotate automatically every 20 seconds on the site.</p>
      {error && <p className="status-msg status-error">{error}</p>}
      <div className="gallery-grid">
        {banners.map((b) => (
          <div className="gallery-item banner-item" key={b.id}>
            <img src={resolveImageUrl(b.image_url)} alt="Banner" />
            <button type="button" onClick={() => handleDelete(b.id)}>Remove</button>
          </div>
        ))}
      </div>
      <label>Add Banner
        <input type="file" accept="image/jpeg" onChange={handleAdd} />
      </label>
      {uploading && <p className="upload-status">Uploading...</p>}
    </div>
  );
}

function LogoManager({ settings, setSettings }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      const updated = await updateSettings({ logo_url: result.image_url });
      setSettings(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-form settings-card">
      <h3>Logo</h3>
      <p className="admin-hint-small">Displayed as a circular logo next to the store name.</p>
      {error && <p className="status-msg status-error">{error}</p>}
      {settings.logo_url && (
        <img src={resolveImageUrl(settings.logo_url)} alt="Logo preview" className="logo-preview-circle" />
      )}
      <label>Upload Logo
        <input type="file" accept="image/jpeg" onChange={handleUpload} />
      </label>
      {uploading && <p className="upload-status">Uploading...</p>}
    </div>
  );
}

function AccountSecurityCard() {
  const [form, setForm] = useState({ current_password: "", new_username: "", new_password: "" });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await changeCredentials(form);
      setMessage("✅ Login details updated. Please log in again.");
      setTimeout(() => { logout(); navigate("/admin/login"); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form settings-card" onSubmit={handleSubmit}>
      <h3>Account Security</h3>
      <label>Current Password
        <input type="password" name="current_password" value={form.current_password} onChange={handleChange} required />
      </label>
      <label>New Username (optional)
        <input type="text" name="new_username" value={form.new_username} onChange={handleChange} placeholder="Leave empty to keep current" />
      </label>
      <label>New Password (optional)
        <input type="password" name="new_password" value={form.new_password} onChange={handleChange} placeholder="Leave empty to keep current" />
      </label>
      {message && <p className="status-msg admin-success">{message}</p>}
      {error && <p className="status-msg status-error">{error}</p>}
      <button type="submit" className="btn-checkout" disabled={saving}>{saving ? "Saving..." : "Update Login Details"}</button>
    </form>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [shippingData, setShippingData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    getSettings().then(setSettings).catch((err) => setLoadError(err.message));
    getShippingFees().then(setShippingData).catch((err) => setLoadError(err.message));
  }, []);

  function handleChange(e) { setSettings({ ...settings, [e.target.name]: e.target.value }); }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      setMessage("✅ Settings saved successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally { setSaving(false); }
  }

  function handleFeeChange(governorate, value) {
    setShippingData({ ...shippingData, fees: { ...shippingData.fees, [governorate]: value } });
  }

  async function handleSaveShipping() {
    setSavingShipping(true);
    try {
      const updated = await updateShippingFees(shippingData.fees);
      setShippingData(updated);
      setMessage("✅ Shipping fees saved");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally { setSavingShipping(false); }
  }

  if (loadError) return <p className="status-msg status-error">{loadError}</p>;
  if (!settings || !shippingData) return <p className="status-msg">Loading...</p>;

  return (
    <div className="admin-settings admin-settings-wide">
      {message && <p className="status-msg admin-success">{message}</p>}

      <div className="settings-cards-grid">
        <LogoManager settings={settings} setSettings={setSettings} />
        <BannerManager type="home" title="Homepage Banners" />
        <BannerManager type="product" title="Product Page Banners" />
        <ReviewsManager />

        <div className="admin-form settings-card">
          <h3>Social Media Links (shown at the bottom of the homepage)</h3>
          <label>WhatsApp Link
            <input type="text" name="whatsapp_link" value={settings.whatsapp_link || ""} onChange={handleChange} placeholder="https://wa.me/2010xxxxxxxx" />
          </label>
          <label>TikTok Link
            <input type="text" name="tiktok_link" value={settings.tiktok_link || ""} onChange={handleChange} placeholder="https://tiktok.com/@username" />
          </label>
          <label>Facebook Link
            <input type="text" name="facebook_link" value={settings.facebook_link || ""} onChange={handleChange} placeholder="https://facebook.com/yourpage" />
          </label>
          <label>Instagram Link
            <input type="text" name="instagram_link" value={settings.instagram_link || ""} onChange={handleChange} placeholder="https://instagram.com/yourpage" />
          </label>
          <button className="btn-checkout" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Links"}</button>
        </div>

        <div className="admin-form settings-card">
          <h3>Shipping Fee per Governorate (default: EGP 50)</h3>
          <div className="shipping-fees-grid">
            {shippingData.governorates.map((gov) => (
              <label key={gov} className="shipping-fee-row">
                {gov}
                <input type="number" min="0" value={shippingData.fees[gov] ?? 50} onChange={(e) => handleFeeChange(gov, e.target.value)} />
              </label>
            ))}
          </div>
          <button className="btn-checkout" onClick={handleSaveShipping} disabled={savingShipping}>
            {savingShipping ? "Saving..." : "Save All Shipping Fees"}
          </button>
        </div>

        <AccountSecurityCard />
      </div>
    </div>
  );
}
