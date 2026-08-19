import React, { useState } from "react";
import { Heart, Star, MapPin, ShieldCheck, Waves, MountainSnow, Trees, Sparkles } from "lucide-react";

export default function CabinCard({
  title = "Tahoe Lakefront Sanctuary",
  location = "Carnelian Bay, Lake Tahoe",
  pricePerNight = 385,
  rating = 4.98,
  hostName = "Elena Rostova",
  imageUrl = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
  terrain = "Lakefront"
}) {
  const [isSaved, setIsSaved] = useState(false);

  const getTerrainIcon = (type) => {
    const key = (type || "").toLowerCase();
    if (key.includes("lake") || key.includes("water") || key.includes("beach")) {
      return <Waves className="w-3.5 h-3.5" />;
    }
    if (key.includes("mountain") || key.includes("alpine") || key.includes("chalet")) {
      return <MountainSnow className="w-3.5 h-3.5" />;
    }
    if (key.includes("forest") || key.includes("timber") || key.includes("wood")) {
      return <Trees className="w-3.5 h-3.5" />;
    }
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <article className="group relative flex flex-col w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground overflow-hidden transition-all duration-200 hover:border-primary/50 focus-within:ring-2 focus-within:ring-[var(--ring)]">
      {/* High-Aspect Ratio Photography Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Terrain Archetype Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-card/90 backdrop-blur-sm border border-border/80 text-foreground text-xs font-semibold tracking-tight shadow-sm">
          <span className="text-primary">{getTerrainIcon(terrain)}</span>
          <span className="capitalize">{terrain}</span>
        </div>

        {/* Overlaid Heart Bookmark Pill */}
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          aria-label={isSaved ? `Remove ${title} from saved retreats` : `Save ${title} to wishlist`}
          aria-pressed={isSaved}
          className="absolute top-3 right-3 h-[var(--control-sm)] w-[var(--control-sm)] flex items-center justify-center rounded-[var(--radius-full)] bg-card/90 backdrop-blur-sm border border-border/80 text-foreground transition-all duration-200 hover:bg-card hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${
              isSaved
                ? "fill-primary text-primary"
                : "text-foreground group-hover/btn:text-primary"
            }`}
          />
        </button>

        {/* Tactile Inset Host Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-foreground/75 backdrop-blur-sm text-[11px] font-medium text-[var(--primary-foreground)]">
            <ShieldCheck className="w-3 h-3 text-accent" />
            <span>Host: {hostName}</span>
          </span>
        </div>
      </div>

      {/* Content & Architectural Details */}
      <div className="flex flex-col p-4 gap-3">
        {/* Geo & Rating Meta Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 truncate max-w-[70%]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-foreground shrink-0">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span>{Number(rating).toFixed(2)}</span>
          </div>
        </div>

        {/* Cabin Title */}
        <h3 className="text-base font-bold text-foreground tracking-tight leading-snug line-clamp-1 group-hover:text-primary transition-colors font-[family-name:var(--font-display)]">
          {title}
        </h3>

        {/* Divider & Transparent Nightly Pricing */}
        <div className="pt-3 border-t border-border flex items-baseline justify-between mt-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black tracking-tight text-foreground font-[family-name:var(--font-display)]">
              ${pricePerNight}
            </span>
            <span className="text-xs text-muted-foreground font-medium">/ night</span>
          </div>

          <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-4">
            View retreat &rarr;
          </span>
        </div>
      </div>
    </article>
  );
}