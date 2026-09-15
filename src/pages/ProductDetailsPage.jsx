import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProductById, getProducts, getBanners, resolveImageUrl,
  getEffectivePrice, LOW_STOCK_THRESHOLD, formatPrice,
} from "../services/api";
import { useCart } from "../context/CartContext";
import ProductRow from "../components/ProductRow";
import BannerCarousel from "../components/BannerCarousel";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [customerWeight, setCustomerWeight] = useState("");
  const [customerHeight, setCustomerHeight] = useState("");
  const [sizeError, setSizeError] = useState(null);
  const [colorError, setColorError] = useState(null);
  const [designError, setDesignError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAdded(false);
    setQuantity(1);
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedDesign(null);
    setSizeError(null);
    setColorError(null);
    setDesignError(null);

    Promise.all([getProductById(id), getProducts(), getBanners("product")])
      .then(([productData, allProducts, bannersData]) => {
        setProduct(productData);
        setActiveImage(productData.image_url);
        setBanners(bannersData);
        setRelatedProducts(allProducts.filter((p) => p.id !== productData.id && p.stock > 0));
      })
      .catch(() => setError("Product not found or failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="status-msg">Loading...</p>;
  if (error) return <p className="status-msg status-error">{error}</p>;
  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const { hasDiscount, currentPrice, originalPrice, discountPercent } = getEffectivePrice(product);
  const showLowStock = !isOutOfStock && product.stock <= LOW_STOCK_THRESHOLD;
  const availableSizes = product.sizes ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const availableColors = product.colors ? product.colors.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const gallery = [product.image_url, ...(product.gallery || []).map((g) => g.image_url)].filter(Boolean);

  function handleAddToCart() {
    if (availableSizes.length > 0 && !selectedSize) { setSizeError("Please select a size first"); return; }
    if (availableColors.length > 0 && !selectedColor) { setColorError("Please select a color first"); return; }
    if (product.designs && product.designs.length > 0 && !selectedDesign) { setDesignError("Please select a design first"); return; }

    setSizeError(null); setColorError(null); setDesignError(null);
    addToCart(product, quantity, {
      selected_size: selectedSize,
      selected_color: selectedColor,
      selected_design_url: selectedDesign,
      customer_weight: customerWeight ? parseFloat(customerWeight) : null,
      customer_height: customerHeight ? parseFloat(customerHeight) : null,
    });
    setAdded(true);
  }
  function increaseQty() { setQuantity((q) => Math.min(q + 1, product.stock)); }
  function decreaseQty() { setQuantity((q) => Math.max(q - 1, 1)); }

  const specs = [
    { label: "Fit", value: product.fit },
    { label: "Length", value: product.length_cm ? `${product.length_cm} cm` : null },
    { label: "Width", value: product.width_cm ? `${product.width_cm} cm` : null },
    { label: "Suitable weight range", value: (product.weight_min && product.weight_max) ? `${product.weight_min} - ${product.weight_max} kg` : null },
  ].filter((s) => s.value);

  return (
    <div>
      <BannerCarousel banners={banners} small />

      <div className="container product-details">
        <Link to="/" className="back-link">← Back to products</Link>

        <div className="product-details-grid">
          <div>
            <img src={resolveImageUrl(activeImage)} alt={product.name} className="product-details-image" />
            {gallery.length > 1 && (
              <div className="product-gallery-thumbs">
                {gallery.map((img, i) => (
                  <img
                    key={i} src={resolveImageUrl(img)} alt={`Image ${i + 1}`}
                    className={`gallery-thumb ${activeImage === img ? "active" : ""}`}
                    onClick={() => setActiveImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-details-info">
            <h1 dir="auto">{product.name}</h1>
            <p className="product-details-desc" dir="auto">{product.description}</p>

            <div className="price-row">
              {hasDiscount ? (
                <>
                  <span className="price-new-lg">EGP {formatPrice(currentPrice)}</span>
                  <span className="price-old-lg">EGP {formatPrice(originalPrice)}</span>
                  <span className="discount-percent-badge">-{discountPercent}%</span>
                </>
              ) : (
                <span className="product-details-price">EGP {formatPrice(currentPrice)}</span>
              )}
            </div>

            {isOutOfStock ? (
              <span className="badge badge-out">Out of Stock</span>
            ) : (
              <span className="badge badge-in">In Stock</span>
            )}

            {showLowStock && <p className="low-stock-alert">⚡ Very limited stock: only {product.stock} left!</p>}

            {specs.length > 0 && (
              <table className="specs-table">
                <tbody>{specs.map((s) => (<tr key={s.label}><td>{s.label}</td><td>{s.value}</td></tr>))}</tbody>
              </table>
            )}

            {!isOutOfStock && (
              <>
                {availableColors.length > 0 && (
                  <div className="size-selector">
                    <span className="size-selector-label">Select Color:</span>
                    <div className="size-options">
                      {availableColors.map((color) => (
                        <button
                          key={color} type="button"
                          className={`size-option ${selectedColor === color ? "selected" : ""}`}
                          onClick={() => { setSelectedColor(color); setColorError(null); }}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                    {colorError && <span className="field-error">{colorError}</span>}
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="size-selector">
                    <span className="size-selector-label">Select Size:</span>
                    <div className="size-options">
                      {availableSizes.map((size) => (
                        <button
                          key={size} type="button"
                          className={`size-option ${selectedSize === size ? "selected" : ""}`}
                          onClick={() => { setSelectedSize(size); setSizeError(null); }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {sizeError && <span className="field-error">{sizeError}</span>}
                  </div>
                )}

                {product.designs && product.designs.length > 0 && (
                  <div className="size-selector">
                    <span className="size-selector-label">Select Design:</span>
                    <div className="design-options">
                      {product.designs.map((design) => (
                        <button
                          key={design.id} type="button"
                          className={`design-option ${selectedDesign === design.image_url ? "selected" : ""}`}
                          onClick={() => { setSelectedDesign(design.image_url); setDesignError(null); setPreviewDesign(design.image_url); }}
                          title={design.name || ""}
                        >
                          <img src={resolveImageUrl(design.image_url)} alt={design.name || "Design"} />
                        </button>
                      ))}
                    </div>
                    {designError && <span className="field-error">{designError}</span>}
                  </div>
                )}

                <div className="optional-measurements">
                  <span className="size-selector-label">Want us to suggest the best size? (optional)</span>
                  <div className="measurements-row">
                    <label>Weight (kg)
                      <input type="number" value={customerWeight} onChange={(e) => setCustomerWeight(e.target.value)} min="0" />
                    </label>
                    <label>Height (cm)
                      <input type="number" value={customerHeight} onChange={(e) => setCustomerHeight(e.target.value)} min="0" />
                    </label>
                  </div>
                </div>

                <div className="qty-selector">
                  <button onClick={decreaseQty} disabled={quantity <= 1}>−</button>
                  <span>{quantity}</span>
                  <button onClick={increaseQty} disabled={quantity >= product.stock}>+</button>
                </div>
                <button className="btn-add-cart" onClick={handleAddToCart}>
                  {added ? "✅ Added to Cart" : "Add to Cart"}
                </button>
              </>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <ProductRow title="You might also like" products={relatedProducts} />
        )}
      </div>

      {previewDesign && (
        <div className="design-preview-overlay" onClick={() => setPreviewDesign(null)}>
          <img src={resolveImageUrl(previewDesign)} alt="Design preview" className="design-preview-image" />
        </div>
      )}
    </div>
  );
}
