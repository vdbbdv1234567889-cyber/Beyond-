import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "../services/api";

export default function ReviewsCarousel({ reviews }) {
  const [index, setIndex] = useState(0);

  if (!reviews || reviews.length === 0) return null;

  function getSlide(offset) {
    const total = reviews.length;
    return reviews[(index + offset + total) % total];
  }

  function goNext() { setIndex((prev) => (prev + 1) % reviews.length); }
  function goPrev() { setIndex((prev) => (prev - 1 + reviews.length) % reviews.length); }

  const prevSlide = reviews.length > 1 ? getSlide(-1) : null;
  const nextSlide = reviews.length > 1 ? getSlide(1) : null;
  const currentSlide = getSlide(0);

  return (
    <section className="reviews-section">
      <h2>Customer Reviews</h2>
      <div className="reviews-carousel">
        <button className="reviews-arrow reviews-arrow-left" onClick={goPrev} aria-label="Previous review">
          <ChevronLeft size={22} />
        </button>

        <div className="reviews-track">
          {prevSlide && (
            <img
              key={`prev-${index}`}
              src={resolveImageUrl(prevSlide.image_url)}
              alt="Previous review"
              className="review-slide review-slide-side review-slide-prev"
            />
          )}
          <img
            key={`current-${index}`}
            src={resolveImageUrl(currentSlide.image_url)}
            alt="Customer review"
            className="review-slide review-slide-center"
          />
          {nextSlide && (
            <img
              key={`next-${index}`}
              src={resolveImageUrl(nextSlide.image_url)}
              alt="Next review"
              className="review-slide review-slide-side review-slide-next"
            />
          )}
        </div>

        <button className="reviews-arrow reviews-arrow-right" onClick={goNext} aria-label="Next review">
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}
