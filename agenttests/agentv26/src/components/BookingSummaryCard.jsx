import React, { useState } from 'react';
import { Sparkles, ShieldCheck, ChevronDown, Calendar, Users, Info } from 'lucide-react';

export default function BookingSummaryCard({
  pricePerNight = 385,
  checkIn = "Mar 12, 2026",
  checkOut = "Mar 17, 2026",
  guestCount = 4,
  cleaningFee = 160,
  serviceFee = 112,
}) {
  const [nights, setNights] = useState(5);
  const [guests, setGuests] = useState(guestCount);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const baseTotal = pricePerNight * nights;
  const grandTotal = baseTotal + cleaningFee + serviceFee;

  return (
    <aside className="w-full max-w-sm rounded-[var(--radius-xl)] border border-border bg-card p-6 text-card-foreground shadow-sm">
      {/* Price Header */}
      <div className="flex items-baseline justify-between pb-5 border-b border-border">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            ${pricePerNight}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/ night</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-background px-2.5 py-1 rounded-[var(--radius-full)] border border-border">
          <span className="text-primary font-bold">★</span>
          <span>4.98</span>
          <span className="text-muted-foreground font-normal">(128)</span>
        </div>
      </div>

      {/* Segmented Reservation Input Pill */}
      <div className="mt-5 rounded-[var(--radius-lg)] border border-border bg-background p-1 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border">
          <button
            type="button"
            className="flex flex-col text-left px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-l-[var(--radius-md)]"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Check-In
            </span>
            <span className="text-xs font-semibold text-foreground truncate mt-0.5">
              {checkIn}
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col text-left px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-r-[var(--radius-md)]"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Check-Out
            </span>
            <span className="text-xs font-semibold text-foreground truncate mt-0.5">
              {checkOut}
            </span>
          </button>
        </div>

        <div className="pt-1 sm:pt-0">
          <button
            type="button"
            onClick={() => setGuests((prev) => (prev >= 8 ? 1 : prev + 1))}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-md)]"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Guests
              </span>
              <span className="text-xs font-semibold text-foreground mt-0.5">
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        className="w-full mt-4 h-[var(--control-lg)] rounded-[var(--radius-full)] bg-primary text-primary-foreground font-semibold text-sm tracking-tight flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      >
        <span>Reserve Sanctuary</span>
      </button>

      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        You won't be charged yet
      </p>

      {/* Transparent Fee Breakdown */}
      <div className="mt-5 space-y-2.5 pt-4 border-t border-border text-xs">
        <div className="flex justify-between items-center text-foreground">
          <span className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4">
            ${pricePerNight} × {nights} nights
          </span>
          <span className="font-medium">${baseTotal}</span>
        </div>

        <div className="flex justify-between items-center text-foreground">
          <span className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4">
            Cleaning fee
          </span>
          <span className="font-medium">${cleaningFee}</span>
        </div>

        <div className="flex justify-between items-center text-foreground">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground underline decoration-border decoration-1 underline-offset-4">
              Hearth service fee
            </span>
            <button
              type="button"
              onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none"
              aria-label="Service fee details"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <span className="font-medium">${serviceFee}</span>
        </div>

        {isTooltipOpen && (
          <div className="p-2.5 rounded-[var(--radius-md)] bg-background border border-border text-[11px] text-muted-foreground leading-relaxed">
            Direct host insurance, 24/7 wilderness concierge, and keyless check-in guarantee.
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">Total before taxes</span>
          <span className="text-[11px] text-muted-foreground">Includes all mandatory fees</span>
        </div>
        <span className="text-xl font-black tracking-tight text-foreground">
          ${grandTotal}
        </span>
      </div>

      {/* Guarantee Footer */}
      <div className="mt-5 pt-4 border-t border-border flex items-start gap-2.5 text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug">
          <strong className="text-foreground font-semibold">Architectural Guarantee:</strong> Full refund up to 5 days before check-in.
        </p>
      </div>
    </aside>
  );
}