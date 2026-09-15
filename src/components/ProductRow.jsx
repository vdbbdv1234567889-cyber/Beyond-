import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductRow({ title, products }) {
  const scrollRef = useRef(null);

  function scroll(direction) {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? amount : -amount,
      behavior: "smooth",
    });
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="product-row-section">
      <div className="product-row-header">
        {title && <h2>{title}</h2>}
        <div className="product-row-arrows">
          <button onClick={() => scroll("right")} aria-label="Next">
            <ChevronRight size={20} />
          </button>
          <button onClick={() => scroll("left")} aria-label="Previous">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="product-row" ref={scrollRef}>
        {products.map((product) => (
          <div className="product-row-item" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
