import React, { useState } from "react";
import { Heart, Grid, Share2, Compass, Maximize2 } from "lucide-react";

export default function PhotoMosaic({
  images = [],
  propertyName = "Sanctuary Retreat"
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Curated fallback architectural timber & wilderness imagery
  const defaultImages = [
    {
      url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
      caption: "Main Timber Great Room & Panoramic Lakefront Deck"
    },
    {
      url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
      caption: "Handcrafted Cedar Barrel Sauna"
    },
    {
      url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      caption: "Master Loft with Forest Canopy Vista"
    },
    {
      url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
      caption: "Cast Iron Fire Hearth & Reading Alcove"
    },
    {
      url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
      caption: "Private Shoreline Dock at Morning Fog"
    }
  ];

  // Normalize image data to guarantee at least 5 frames
  const normalizedImages = Array.from({ length: 5 }).map((_, idx) => {
    const raw = images[idx];
    if (!raw) return defaultImages[idx];
    if (typeof raw === "string") {
      return { url: raw, caption: `${propertyName} view ${idx + 1}` };
    }
    return {
      url: raw.url || defaultImages[idx].url,
      caption: raw.caption || `${propertyName} architectural detail ${idx + 1}`
    };
  });

  const heroImage = normalizedImages[0];
  const supportingImages = normalizedImages.slice(1, 5);

  return (
    <section 
      aria-label={`Photo gallery for ${propertyName}`}
      className="relative w-full select-none"
    >
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium tracking-wide uppercase text-secondary-foreground bg-input/60 rounded-[var(--radius-full)] border border-border">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Architectural Overview
          </span>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
            5 Curated Perspectives
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: propertyName, url: window.location.href }).catch(() => {});
              }
            }}
            aria-label="Share this property"
            className="inline-flex items-center justify-center gap-1.5 h-[var(--control-sm)] px-3 text-xs font-medium text-foreground bg-card hover:bg-background active:scale-[0.98] transition-all rounded-[var(--radius-full)] border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Share2 className="w-3.5 h-3.5 text-muted" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            aria-label={isSaved ? "Remove from saved retreats" : "Save this retreat"}
            className="inline-flex items-center justify-center gap-1.5 h-[var(--control-sm)] px-3 text-xs font-medium text-foreground bg-card hover:bg-background active:scale-[0.98] transition-all rounded-[var(--radius-full)] border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isSaved ? "fill-primary text-primary" : "text-muted"
              }`}
            />
            <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Main Asymmetric 5-Photo Mosaic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-2.5 rounded-[var(--radius-xl)] overflow-hidden bg-border/40 p-1.5 border border-border">
        {/* Frame 1: Dominant Hero Panoramic Frame (Spans 2 cols, 2 rows) */}
        <div
          className="relative md:col-span-2 md:row-span-2 group overflow-hidden rounded-[var(--radius-lg)] bg-input/40 min-h-[260px] md:min-h-[440px] cursor-pointer"
          onClick={() => setActivePhotoIndex(0)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActivePhotoIndex(0)}
          aria-label={`View hero photograph: ${heroImage.caption}`}
        >
          <img
            src={heroImage.url}
            alt={heroImage.caption}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Hero Caption Tag */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-card bg-foreground/75 backdrop-blur-sm rounded-[var(--radius-md)] line-clamp-1 max-w-[85%] border border-card/10">
              {heroImage.caption}
            </span>
            <span className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-full)] bg-card/90 text-foreground shadow-sm">
              <Maximize2 className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Frames 2 - 5: 2x2 Sub-Grid of Supporting Perspectives */}
        {supportingImages.map((img, idx) => {
          const photoIndex = idx + 1;
          return (
            <div
              key={photoIndex}
              className="relative group overflow-hidden rounded-[var(--radius-lg)] bg-input/40 aspect-[4/3] md:aspect-auto min-h-[140px] md:min-h-[214px] cursor-pointer"
              onClick={() => setActivePhotoIndex(photoIndex)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActivePhotoIndex(photoIndex)}
              aria-label={`View photograph ${photoIndex + 1}: ${img.caption}`}
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Sub-frame Hover Caption Badge */}
              <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="block px-2 py-0.5 text-[11px] font-medium text-card bg-foreground/80 backdrop-blur-sm rounded-[var(--radius-sm)] truncate">
                  {img.caption}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Pill: View All Gallery Photos */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setActivePhotoIndex(0)}
          className="inline-flex items-center justify-center gap-2 h-[var(--control-md)] px-4 bg-card/95 hover:bg-card text-foreground font-medium text-xs tracking-tight rounded-[var(--radius-full)] border border-border shadow-sm active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Grid className="w-3.5 h-3.5 text-primary" />
          <span>Show all 5 photos</span>
        </button>
      </div>

      {/* Lightbox / Focused Frame Drawer Backdrop */}
      {activePhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-card rounded-[var(--radius-xl)] overflow-hidden border border-border p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full bg-input/20 rounded-[var(--radius-lg)] overflow-hidden">
              <img
                src={normalizedImages[activePhotoIndex].url}
                alt={normalizedImages[activePhotoIndex].caption}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Perspective {activePhotoIndex + 1} of {normalizedImages.length}
                </p>
                <h4 className="text-sm font-medium text-foreground">
                  {normalizedImages[activePhotoIndex].caption}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="h-[var(--control-sm)] px-3 text-xs font-medium rounded-[var(--radius-full)] bg-input/60 hover:bg-input text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}