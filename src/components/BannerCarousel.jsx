import { useState, useEffect } from "react";
import { resolveImageUrl } from "../services/api";

export default function BannerCarousel({ banners, small }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className={`hero-banner ${small ? "hero-banner-small" : ""}`}
      style={{ backgroundImage: `url(${resolveImageUrl(banners[index].image_url)})` }}
    />
  );
}
