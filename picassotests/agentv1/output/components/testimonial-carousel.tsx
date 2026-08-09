// TestimonialCarousel.tsx — Rotating user testimonials with manual controls and optional autoplay. Use for social proof focused on Wavelength’s friendly money-management experience.
import { useEffect, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const testimonialCarouselVariants = cva(
  "relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] shadow-[var(--shadow-md)]",
  {
    variants: {
      autoplay: {
        true: "transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
        false: "transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
      },
    },
    defaultVariants: {
      autoplay: false,
    },
  }
);

export interface TestimonialCarouselProps
  extends VariantProps<typeof testimonialCarouselVariants> {
  testimonials: Array<{
    avatar: string;
    quote: string;
    name: string;
    role?: string;
  }>;
  interval?: number;
  className?: string;
}

export default function TestimonialCarousel({
  testimonials,
  autoplay = false,
  interval = 5000,
  className,
}: TestimonialCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || testimonials.length < 2 || interval <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoplay, interval, testimonials.length]);

  if (testimonials.length === 0) {
    return null;
  }

  const activeTestimonial = testimonials[activeIndex] ?? testimonials[0];

  const showPrevious = () => {
    setActiveIndex(
      (currentIndex) =>
        (currentIndex - 1 + testimonials.length) % testimonials.length
    );
  };

  const showNext = () => {
    setActiveIndex(
      (currentIndex) => (currentIndex + 1) % testimonials.length
    );
  };

  return (
    <section
      className={cn(testimonialCarouselVariants({ autoplay }), className)}
      aria-roledescription="carousel"
      aria-label="Wavelength user testimonials"
    >
      <div className="flex items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
        <div>
          <p className="font-[var(--font-body)] text-[var(--color-accent-600)] text-[var(--text-sm)] font-[var(--weight-semibold)]">
            Real people, real progress
          </p>
          <h2 className="mt-[var(--space-1)] font-[var(--font-display)] text-[var(--color-text-primary)] text-[var(--text-xl)] font-[var(--weight-bold)]">
            Money wins from the Wavelength crew
          </h2>
        </div>

        <span
          className="rounded-[var(--radius-full)] bg-[var(--color-accent-50)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-mono)] text-[var(--color-accent-900)] text-[var(--text-xs)] font-[var(--weight-semibold)]"
          aria-label={`Testimonial ${activeIndex + 1} of ${testimonials.length}`}
        >
          {activeIndex + 1}/{testimonials.length}
        </span>
      </div>

      <div
        className="grid gap-[var(--space-6)] pt-[var(--space-6)] md:grid-cols-[auto_1fr]"
        aria-live={autoplay ? "polite" : "off"}
      >
        <img
          src={activeTestimonial.avatar}
          alt={activeTestimonial.name}
          className="h-[var(--control-lg)] w-[var(--control-lg)] rounded-[var(--radius-full)] border-2 border-[var(--color-accent-500)] object-cover"
        />

        <div className="min-w-0">
          <blockquote className="font-[var(--font-display)] text-[var(--color-text-primary)] text-[var(--text-3xl)] font-[var(--weight-semibold)]">
            “{activeTestimonial.quote}”
          </blockquote>

          <footer className="mt-[var(--space-6)]">
            <p className="font-[var(--font-body)] text-[var(--color-text-primary)] text-[var(--text-base)] font-[var(--weight-semibold)]">
              {activeTestimonial.name}
            </p>
            {activeTestimonial.role && (
              <p className="mt-[var(--space-1)] font-[var(--font-body)] text-[var(--color-text-muted)] text-[var(--text-sm)]">
                {activeTestimonial.role}
              </p>
            )}
          </footer>
        </div>
      </div>

      <div className="mt-[var(--space-6)] flex items-center justify-between gap-[var(--space-4)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]">
        <div className="flex items-center gap-[var(--space-2)]">
          {testimonials.map((testimonial, index) => (
            <button
              key={`${testimonial.name}-${index}`}
              type="button"
              className={cn(
                "h-[var(--control-sm)] w-[var(--control-sm)] rounded-[var(--radius-full)] border border-[var(--color-border-default)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-border-focus)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                index === activeIndex &&
                  "border-[var(--color-accent-500)] bg-[var(--color-accent-500)]"
              )}
              aria-label={`Show testimonial from ${testimonial.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <div className="flex items-center gap-[var(--space-2)]">
          <button
            type="button"
            className="inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-border-focus)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Show previous testimonial"
            onClick={showPrevious}
          >
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className="inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-border-focus)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label="Show next testimonial"
            onClick={showNext}
          >
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}