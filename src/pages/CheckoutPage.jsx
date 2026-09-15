import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder, getShippingFees, formatPrice, validateDiscountCode } from "../services/api";
import { saveMyOrderId } from "../services/myOrders";

const emptyForm = {
  customer_name: "", phone: "", governorate: "", district: "", area: "", landmark: "", customer_note: "",
};

function isValidPhone(phone) {
  return /^01[0-9]{9}$/.test(phone);
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [governorates, setGovernorates] = useState([]);
  const [feesMap, setFeesMap] = useState({});
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);

  useEffect(() => {
    getShippingFees().then((r) => { setGovernorates(r.governorates); setFeesMap(r.fees); }).catch(() => {});
  }, []);

  const shippingFee = form.governorate ? (feesMap[form.governorate] ?? 50) : null;
  const discountAmount = appliedDiscount ? Math.round(totalPrice * (appliedDiscount.discount_percent / 100)) : 0;
  const grandTotal = totalPrice - discountAmount + (shippingFee || 0);
  const phoneIsValid = isValidPhone(form.phone);

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <p>Your cart is empty, nothing to checkout.</p>
        <Link to="/" className="back-link">← Browse products</Link>
      </div>
    );
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleApplyCode() {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    setDiscountError(null);
    try {
      const result = await validateDiscountCode(discountCode);
      setAppliedDiscount(result);
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError(err.message);
    } finally {
      setCheckingCode(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPhoneTouched(true);
    setError(null);

    if (!phoneIsValid) {
      setError("Invalid phone number");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        ...form,
        discount_code: appliedDiscount ? appliedDiscount.code : undefined,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          selected_size: item.selected_size,
          selected_color: item.selected_color,
          selected_design_url: item.selected_design_url,
          customer_weight: item.customer_weight,
          customer_height: item.customer_height,
        })),
      };
      const result = await createOrder(orderData);
      saveMyOrderId(result.order_id);
      clearCart();
      navigate(`/order-success/${result.order_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <label>Full Name
            <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} required dir="auto" />
          </label>

          <label>Phone Number
            <input
              type="tel" name="phone" value={form.phone} onChange={handleChange}
              onBlur={() => setPhoneTouched(true)} required
              className={phoneTouched && !phoneIsValid ? "input-error" : ""}
            />
            {phoneTouched && !phoneIsValid && <span className="field-error">Invalid phone number</span>}
          </label>

          <div className="address-fields">
            <label>Governorate
              <select name="governorate" value={form.governorate} onChange={handleChange} required>
                <option value="">Select governorate</option>
                {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>Center
              <input type="text" name="district" value={form.district} onChange={handleChange} required dir="auto" />
            </label>
            <label>Area
              <input type="text" name="area" value={form.area} onChange={handleChange} required dir="auto" />
            </label>
            <label>Landmark (optional)
              <input type="text" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near a mosque, distinctive building, etc." dir="auto" />
            </label>
          </div>

          <label>Discount Code (optional)
            <div className="discount-code-row">
              <input
                type="text" value={discountCode}
                onChange={(e) => { setDiscountCode(e.target.value); setAppliedDiscount(null); setDiscountError(null); }}
                placeholder="e.g. WELCOME10"
              />
              <button type="button" className="btn-edit" onClick={handleApplyCode} disabled={checkingCode || !discountCode.trim()}>
                {checkingCode ? "Checking..." : "Apply"}
              </button>
            </div>
            {appliedDiscount && <span className="discount-applied-msg">✅ Code applied: -{appliedDiscount.discount_percent}%</span>}
            {discountError && <span className="field-error">{discountError}</span>}
          </label>

          <label>Note (optional)
            <textarea name="customer_note" value={form.customer_note} onChange={handleChange} rows={3} placeholder="e.g. Please deliver after 6 PM, or any other request..." dir="auto" />
          </label>

          {error && <p className="status-msg status-error">{error}</p>}

          <button type="submit" className="btn-checkout" disabled={submitting}>
            {submitting ? "Submitting..." : "Place Order"}
          </button>
        </form>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {items.map((item) => (
            <div className="checkout-summary-row" key={item.cartKey}>
              <span dir="auto">
                {item.name} {item.selected_size && `(${item.selected_size})`}
                {item.selected_design_url && " 🎨"} × {item.quantity}
              </span>
              <span>EGP {formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="checkout-summary-row"><span>Subtotal</span><span>EGP {formatPrice(totalPrice)}</span></div>
          {discountAmount > 0 && (
            <div className="checkout-summary-row discount-row"><span>Discount</span><span>- EGP {formatPrice(discountAmount)}</span></div>
          )}
          <div className="checkout-summary-row">
            <span>Shipping</span>
            <span>{shippingFee !== null ? `EGP ${formatPrice(shippingFee)}` : "..."}</span>
          </div>
          <div className="checkout-summary-total"><span>Total</span><span>EGP {formatPrice(grandTotal)}</span></div>
        </div>
      </div>
    </div>
  );
}
