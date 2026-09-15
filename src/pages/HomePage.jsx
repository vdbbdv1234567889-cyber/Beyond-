import { useEffect, useState } from "react";
import { getProducts, getSettings, getBanners, getReviews } from "../services/api";
import ProductGrid from "../components/ProductGrid";
import BannerCarousel from "../components/BannerCarousel";
import ReviewsCarousel from "../components/ReviewsCarousel";
import { Music2, Facebook, Instagram } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [banners, setBanners] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getProducts(), getSettings(), getBanners("home"), getReviews()])
      .then(([productsData, settingsData, bannersData, reviewsData]) => {
        setProducts(productsData);
        setSettings(settingsData);
        setBanners(bannersData);
        setReviews(reviewsData);
      })
      .catch(() => setError("Couldn't load products. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status-msg">Loading products...</p>;
  if (error) return <p className="status-msg status-error">{error}</p>;

  const availableProducts = products.filter((p) => p.stock > 0);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  const socialLinks = [
    { key: "tiktok_link", label: "TikTok", Icon: Music2, className: "tiktok" },
    { key: "facebook_link", label: "Facebook", Icon: Facebook, className: "facebook" },
    { key: "instagram_link", label: "Instagram", Icon: Instagram, className: "instagram" },
  ].filter((s) => settings?.[s.key]);

  return (
    <div>
      <BannerCarousel banners={banners} />

      <div className="container">
        {products.length === 0 ? (
          <p className="status-msg">No products available right now.</p>
        ) : (
          <>
            <ProductGrid title="New Arrivals" products={availableProducts} />
            {outOfStockProducts.length > 0 && (
              <ProductGrid title="Coming Back Soon" products={outOfStockProducts} />
            )}
          </>
        )}

        <ReviewsCarousel reviews={reviews} />

        {socialLinks.length > 0 && (
          <section className="contact-footer">
            <h2>Contact Us</h2>
            <div className="contact-footer-icons">
              {socialLinks.map(({ key, label, Icon, className }) => (
                <a key={key} href={settings[key]} target="_blank" rel="noreferrer" className={`contact-icon-btn ${className}`}>
                  <Icon size={26} />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
