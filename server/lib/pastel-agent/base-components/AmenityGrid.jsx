import { Wifi, Car, Tv, Droplets, Flame, Utensils, Dumbbell, Mountain } from "lucide-react";

const ICONS = { wifi: Wifi, car: Car, tv: Tv, pool: Droplets, heat: Flame, kitchen: Utensils, gym: Dumbbell, view: Mountain };

/** Icon amenity grid — product feature/facility lists as quiet tiles. */
export default function AmenityGrid({ items = [], columns = 2, className = "" }) {
  return (
    <ul className={`grid gap-x-6 gap-y-3 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${className}`}>
      {items.slice(0, 8).map((item) => {
        const Icon = ICONS[String(item?.icon ?? "").toLowerCase()] ?? null;
        return (
          <li key={item?.name ?? item} className="flex items-center gap-2.5 text-sm">
            {Icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            ) : (
              <span className="h-8 w-8 shrink-0 rounded-full bg-muted/60" />
            )}
            <span className="font-medium">{item?.name ?? item}</span>
          </li>
        );
      })}
    </ul>
  );
}
