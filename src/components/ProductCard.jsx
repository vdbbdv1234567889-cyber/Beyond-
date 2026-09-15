import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { Heart } from "lucide-react";
import { resolveImageUrl, getEffectivePrice, LOW_STOCK_THRESHOLD, formatPrice } from "../services/api";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({ product, wishlistHoverOnly = false }) {
  const isOutOfStock = product.stock === 0;
  const { hasDiscount, currentPrice, originalPrice, discountPercent } = getEffectivePrice(product);
  const showLowStock = !isOutOfStock && product.stock <= LOW_STOCK_THRESHOLD;
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(product.id);

  const allImages = [product.image_url, ...(product.gallery || []).map((g) => g.image_url)].filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const intervalRef = useRef(null);

  function startCycling() {
    if (allImages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1500);
  }
  function stopCycling() { clearInterval(intervalRef.current); }

  function handleToggleWishlist(e) {
    e.preventDefault();
    toggleWishlist(product);
  }

  return (
    <div className="product-card-pro" onMouseEnter={startCycling} onMouseLeave={stopCycling}>
      <Link to={`/product/${product.id}`} className="product-card-pro-link">
        <div className="product-card-pro-image-wrap">
          <img src={resolveImageUrl(allImages[activeImageIndex])} alt={product.name} className="product-card-pro-image" />
          {isOutOfStock && <span className="ribbon-out">Out of Stock</span>}
          {hasDiscount && !isOutOfStock && <span className="ribbon-discount">-{discountPercent}%</span>}

          <button className={`wishlist-btn ${wishlistHoverOnly ? "wishlist-btn-hover-only" : ""}`} onClick={handleToggleWishlist} aria-label="Add to wishlist">
            <Heart size={18} fill={liked ? "#e63946" : "none"} color={liked ? "#e63946" : "#333"} />
          </button>
        </div>

        <div className="product-card-pro-body">
          <h3 dir="auto">{product.name}</h3>
          <div className="price-row">
            {hasDiscount ? (
              <>
                <span className="price-new">EGP {formatPrice(currentPrice)}</span>
                <span className="price-old">EGP {formatPrice(originalPrice)}</span>
              </>
            ) : (
              <span className="product-card-price">EGP {formatPrice(currentPrice)}</span>
            )}
          </div>
          {showLowStock && <span className="low-stock-badge">Only {product.stock} left! 🔥</span>}
        </div>
      </Link>

      {allImages.length > 1 && (
        <div className="product-card-thumbs">
          {allImages.slice(0, 4).map((img, i) => (
            <button
              key={i}
              className={`product-card-thumb ${activeImageIndex === i ? "active" : ""}`}
              onMouseEnter={() => { clearInterval(intervalRef.current); setActiveImageIndex(i); }}
              onClick={(e) => { e.preventDefault(); setActiveImageIndex(i); }}
            >
              <img src={resolveImageUrl(img)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
