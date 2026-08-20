import React, { useState } from "react";
import { MapPin, Star, Heart, Share2, Check } from "lucide-react";
import { NavAdapter } from "../src/lib/shell.jsx";
import PhotoMosaic from "../src/components/PhotoMosaic.jsx";
import BookingSummaryCard from "../src/components/BookingSummaryCard.jsx";
import ReviewList from "../src/components/ReviewList.jsx";
import Badge from "../src/components/Badge.jsx";
import Button from "../src/components/Button.jsx";

const CABIN = {
  name: "Tahoe Lakefront Retreat",
  location: "Lake Tahoe, California",
  pricePerNight: 285,
  rating: 4.97,
  reviews: 128,
  host: "Maya Chen",
  superhost: true,
  guests: 6,
  bedrooms: 3,
  beds: 4,
  baths: 2,
  description: "A quiet timber-and-glass cabin on the western shore of Lake Tahoe. Wake to still water, spend the day on the dock, and end it in the cedar sauna under the pines.",
  amenities: ["WiFi", "Kitchen", "Hot Tub", "Parking", "Fireplace", "Pet Friendly"],
};

const REVIEWS = [
  { id: "r1", name: "Daniel Okafor", date: "July 2026", rating: 5, comment: "The morning light over the lake from the great room is unreal. Kayaks were ready at the dock, the sauna was spotless, and Maya's house manual had every answer before we asked." },
  { id: "r2", name: "Priya Raghavan", date: "June 2026", rating: 5, comment: "Exactly the quiet weekend we needed. Kitchen is beautifully stocked, beds are hotel-grade, and the hot tub under the pines at dusk is pure magic." },
  { id: "r3", name: "Tom Whitfield", date: "May 2026", rating: 4.5, comment: "Gorgeous cabin, unbeatable location. Only note: the driveway is steep in the winter months — bring AWD. Everything else was flawless." },
  { id: "r4", name: "Sofia Alvarez", date: "April 2026", rating: 5, comment: "We came for our anniversary and Maya left a bottle of local wine and a handwritten card. That kind of care is why we'll be back every year." },
  { id: "r5", name: "James Park", date: "March 2026", rating: 5, comment: "Three couples, three nights, zero complaints. The layout gives everyone privacy and the lakefront deck is the best room in the house." },
];

export default function Detail() {
  const [activeNav, setActiveNav] = useState("detail");
  const [saved, setSaved] = useState(false);
  return (
    <NavAdapter nav="sidebar" activeId={activeNav} onNavigate={setActiveNav}>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10">
        <PhotoMosaic propertyName={CABIN.name} />

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge label="Superhost" tone="accent" />
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {CABIN.location}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground font-[var(--font-display)] sm:text-4xl">{CABIN.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{CABIN.rating}</span> · {CABIN.reviews} reviews · {CABIN.guests} guests · {CABIN.bedrooms} bedrooms · {CABIN.beds} beds · {CABIN.baths} baths
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Save listing" onClick={() => setSaved(!saved)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
              <Heart className={"h-4 w-4 " + (saved ? "fill-primary text-primary" : "")} />
            </button>
            <button type="button" aria-label="Share listing" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <p className="text-base leading-relaxed text-foreground/90">{CABIN.description}</p>

            <section aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="text-xl font-bold tracking-tight text-foreground font-[var(--font-display)]">What this place offers</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CABIN.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border p-3">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">MC</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Hosted by {CABIN.host}</p>
                <p className="text-xs text-muted-foreground">Superhost · 8 years hosting · Responds within an hour</p>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <BookingSummaryCard
              pricePerNight={CABIN.pricePerNight}
              checkIn="Aug 22, 2026"
              checkOut="Aug 27, 2026"
              guestCount={4}
              cleaningFee={160}
              serviceFee={112}
            />
            <Button label="Reserve" size="lg" />
          </div>
        </div>

        <section className="mt-12" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="text-xl font-bold tracking-tight text-foreground font-[var(--font-display)]">Guest reviews</h2>
          <div className="mt-4">
            <ReviewList reviews={REVIEWS} averageRating={CABIN.rating} totalReviews={CABIN.reviews} />
          </div>
        </section>
      </div>
    </NavAdapter>
  );
}
