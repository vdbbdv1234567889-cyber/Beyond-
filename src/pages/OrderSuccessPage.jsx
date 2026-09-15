import { useParams, Link } from "react-router-dom";

export default function OrderSuccessPage() {
  const { orderId } = useParams();

  return (
    <div className="container">
      <div className="order-success">
        <div className="order-success-icon">✅</div>
        <h1>Your order was placed successfully</h1>
        <p className="order-success-line">Order number: <strong>#{orderId}</strong></p>
        <p className="order-success-line">We'll contact you soon to confirm delivery.</p>
        <Link to="/" className="btn-checkout">Back to Store</Link>
      </div>
    </div>
  );
}
