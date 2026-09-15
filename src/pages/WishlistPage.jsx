import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function WishlistPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <p>You haven't liked any products yet. Tap the heart icon on a product to save it here.</p>
        <Link to="/" className="back-link">← Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Wishlist</h1>
      <div className="product-grid-pro">
        {items.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </div>
  );
}
