import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveImageUrl, getOrderById, formatPrice } from "../services/api";
import { getMyOrderIds } from "../services/myOrders";

function MyPreviousOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getMyOrderIds();
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(ids.map((id) => getOrderById(id).catch(() => null)))
      .then((results) => setOrders(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || orders.length === 0) return null;

  return (
    <div className="my-orders-section">
      <h2>Your Previous Orders</h2>
      <div className="my-orders-list">
        {orders.map((order) => (
          <div className="my-order-card" key={order.id}>
            <div>
              <strong>Order #{order.id}</strong>
              <span className="order-status-chip">{order.status}</span>
            </div>
            <span>EGP {formatPrice(order.total)}</span>
            {order.status === "Preparing Order" && (
              <Link to={`/order/${order.id}/edit`} className="btn-edit">Edit</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container">
        <MyPreviousOrders />
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/" className="back-link">← Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <MyPreviousOrders />
      <h1>Shopping Cart</h1>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <div className="cart-item" key={item.cartKey}>
              <img src={resolveImageUrl(item.image_url)} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <h3 dir="auto">{item.name}</h3>
                <p className="cart-item-price">
                  EGP {formatPrice(item.price)} each
                  {item.selected_size && ` | Size: ${item.selected_size}`}
                  {item.selected_color && ` | Color: ${item.selected_color}`}
                </p>
              </div>
              <div className="qty-selector">
                <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
              </div>
              <p className="cart-item-subtotal">EGP {formatPrice(item.price * item.quantity)}</p>
              <button className="btn-remove" onClick={() => removeFromCart(item.cartKey)} title="Remove from cart">🗑️</button>
            </div>
          ))}
        </div>

        <aside className="cart-sidebar">
          <div className="cart-summary-row"><span>Subtotal</span><span>EGP {formatPrice(totalPrice)}</span></div>
          <p className="shipping-note">* Shipping fee is determined by governorate at checkout</p>
          <Link to="/checkout" className="btn-checkout btn-full">Checkout</Link>
        </aside>
      </div>
    </div>
  );
}
