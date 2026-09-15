import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrderById, updateOrder, resolveImageUrl, formatPrice } from "../services/api";

export default function OrderEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [form, setForm] = useState(null);
  const [itemQuantities, setItemQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrderById(id)
      .then((data) => {
        if (data.status !== "Preparing Order") {
          setError("This order can no longer be edited, since it already moved to a processing/shipping stage.");
          setOrder(data);
          return;
        }
        setOrder(data);
        setForm({
          customer_name: data.customer_name, phone: data.phone, governorate: data.governorate,
          district: data.district, area: data.area, landmark: data.landmark || "", customer_note: data.customer_note || "",
        });
        const quantities = {};
        data.items.forEach((item) => { quantities[item.item_id] = item.quantity; });
        setItemQuantities(quantities);
      })
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function changeQty(itemId, delta, maxAvailable) {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(prev[itemId] + delta, prev[itemId] + maxAvailable)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const items = order.items.map((item) => ({ item_id: item.item_id, quantity: itemQuantities[item.item_id] }));
      await updateOrder(id, { ...form, items });
      navigate("/cart");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="status-msg">Loading...</p>;
  if (!order) return <p className="status-msg status-error">{error}</p>;

  if (order.status !== "Preparing Order") {
    return (
      <div className="container">
        <p className="status-msg status-error">{error}</p>
        <Link to="/cart" className="back-link">← Back to cart</Link>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <Link to="/cart" className="back-link">← Back</Link>
      <h1>Edit Order #{order.id}</h1>

      <div className="checkout-grid">
        <div className="checkout-form">
          <label>Full Name
            <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} dir="auto" />
          </label>
          <label>Phone Number
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <div className="address-fields">
            <label>Governorate
              <input type="text" name="governorate" value={form.governorate} onChange={handleChange} />
            </label>
            <label>Center
              <input type="text" name="district" value={form.district} onChange={handleChange} />
            </label>
            <label>Area
              <input type="text" name="area" value={form.area} onChange={handleChange} />
            </label>
            <label>Landmark
              <input type="text" name="landmark" value={form.landmark} onChange={handleChange} />
            </label>
          </div>
          <label>Note
            <textarea name="customer_note" value={form.customer_note} onChange={handleChange} rows={3} />
          </label>

          {error && <p className="status-msg status-error">{error}</p>}

          <button className="btn-checkout" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="checkout-summary">
          <h3>Products</h3>
          {order.items.map((item) => (
            <div className="checkout-summary-row order-edit-item" key={item.item_id}>
              <img src={resolveImageUrl(item.image_url)} alt={item.name} className="order-edit-item-img" />
              <span dir="auto">{item.name} {item.selected_size && `(${item.selected_size})`}</span>
              <div className="qty-selector">
                <button onClick={() => changeQty(item.item_id, -1, item.product_stock)} disabled={itemQuantities[item.item_id] <= 1}>−</button>
                <span>{itemQuantities[item.item_id]}</span>
                <button onClick={() => changeQty(item.item_id, 1, item.product_stock)} disabled={itemQuantities[item.item_id] >= item.quantity + item.product_stock}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
