import ProductCard from "./ProductCard";

export default function ProductGrid({ title, products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="product-grid-section">
      {title && <h2 className="product-grid-title">{title}</h2>}
      <div className="product-grid-pro">
        {products.map((product) => (
          <ProductCard product={product} wishlistHoverOnly key={product.id} />
        ))}
      </div>
    </section>
  );
}
