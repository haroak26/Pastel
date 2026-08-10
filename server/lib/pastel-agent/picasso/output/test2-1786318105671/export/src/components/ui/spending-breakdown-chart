// SpendingBreakdownChart.tsx — Visualizes Wavelength spending by category so users can quickly spot where their budget is going.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const spendingBreakdownChartVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-4)] font-[var(--font-body)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
  {
    variants: {
      chartType: {
        "horizontal-bar": "flex flex-col gap-[var(--space-4)]",
        donut:
          "flex flex-col gap-[var(--space-6)] sm:flex-row sm:items-center",
      },
      size: {
        sm: "max-w-[var(--space-24)]",
        md: "max-w-[var(--space-24)]",
        lg: "max-w-[var(--space-24)]",
      },
    },
    defaultVariants: {
      chartType: "horizontal-bar",
      size: "md",
    },
  }
);

export interface SpendingBreakdownChartProps
  extends VariantProps<typeof spendingBreakdownChartVariants> {
  data: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  currency: string;
  isLoading?: boolean;
  error?: string;
  onCategoryClick?: (category: string) => void;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Spinner() {
  return (
    <svg
      className="h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function SpendingBreakdownChart({
  className,
  chartType = "horizontal-bar",
  size = "md",
  data,
  currency,
  isLoading = false,
  error,
  onCategoryClick,
}: SpendingBreakdownChartProps & { className?: string }) {
  const isInteractive = Boolean(onCategoryClick);
  const totalPercentage = data.reduce(
    (total, item) => total + item.percentage,
    0
  );

  const donutSegments = React.useMemo(() => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return data.map((item) => {
      const segmentLength =
        circumference * Math.max(0, Math.min(item.percentage, 100)) / 100;
      const segment = {
        ...item,
        radius,
        circumference,
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
        dashOffset: -offset,
      };

      offset += segmentLength;
      return segment;
    });
  }, [data]);

  const content = isLoading ? (
    <div
      className="flex min-h-[var(--space-16)] items-center gap-[var(--space-3)] text-[var(--color-text-secondary)]"
      role="status"
    >
      <Spinner />
      <span className="text-[var(--text-sm)]">Updating spending totals</span>
    </div>
  ) : error ? (
    <div
      className="flex min-h-[var(--space-16)] flex-col justify-center gap-[var(--space-1)]"
      role="alert"
    >
      <span className="font-[var(--weight-semibold)] text-[var(--color-danger-900)]">
        Spending data unavailable
      </span>
      <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        {error}
      </span>
    </div>
  ) : data.length === 0 ? (
    <div
      className="flex min-h-[var(--space-16)] items-center text-[var(--text-sm)] text-[var(--color-text-secondary)]"
      role="status"
    >
      No spending recorded yet.
    </div>
  ) : chartType === "donut" ? (
    <>
      <div className="relative flex shrink-0 items-center justify-center">
        <svg
          className={cn(
            "aspect-square",
            size === "sm" && "h-[var(--space-16)] w-[var(--space-16)]",
            size === "md" && "h-[var(--space-24)] w-[var(--space-24)]",
            size === "lg" && "h-[var(--space-24)] w-[var(--space-24)]"
          )}
          viewBox="0 0 100 100"
          role="img"
          aria-label="Spending breakdown by category"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--color-neutral-100)"
            strokeWidth="12"
          />
          <g transform="rotate(-90 50 50)">
            {donutSegments.map((item) => (
              <circle
                key={item.category}
                cx="50"
                cy="50"
                r={item.radius}
                fill="none"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={item.dashArray}
                strokeDashoffset={item.dashOffset}
                pathLength="100"
                className="transition-all duration-[var(--duration-slow)] ease-[var(--easing-standard)]"
              />
            ))}
          </g>
          <text
            x="50"
            y="47"
            textAnchor="middle"
            className="fill-[var(--color-text-primary)] font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)]"
          >
            {Math.round(totalPercentage)}%
          </text>
          <text
            x="50"
            y="61"
            textAnchor="middle"
            className="fill-[var(--color-text-muted)] font-[var(--font-body)] text-[var(--text-xs)]"
          >
            tracked
          </text>
        </svg>
      </div>

      <div className="min-w-0 flex-1 divide-y divide-[var(--color-border-subtle)]">
        {data.map((item) => {
          const itemStyle = {
            "--chart-color": item.color,
          } as React.CSSProperties;

          return (
            <button
              key={item.category}
              type="button"
              className={cn(
                "flex min-h-[var(--control-sm)] w-full items-center gap-[var(--space-2)] py-[var(--space-2)] text-left transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
                isInteractive &&
                  "hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
                !isInteractive && "cursor-default"
              )}
              style={itemStyle}
              onClick={() => onCategoryClick?.(item.category)}
              disabled={!isInteractive}
              aria-label={`${item.category}: ${item.percentage}%, ${formatAmount(
                item.amount,
                currency
              )}`}
            >
              <span
                className="h-[var(--space-2)] w-[var(--space-2)] shrink-0 rounded-[var(--radius-full)] bg-[var(--chart-color)]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                {item.category}
              </span>
              <span className="font-[var(--font-mono)] text-[var(--text-sm)] font-[var(--weight-medium)] tabular-nums">
                {item.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </>
  ) : (
    <div className="divide-y divide-[var(--color-border-subtle)]">
      {data.map((item) => {
        const itemStyle = {
          "--chart-color": item.color,
          "--bar-width": `${Math.max(0, Math.min(item.percentage, 100))}%`,
        } as React.CSSProperties;

        return (
          <button
            key={item.category}
            type="button"
            className={cn(
              "group flex min-h-[var(--control-lg)] w-full flex-col justify-center gap-[var(--space-2)] py-[var(--space-3)] text-left transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
              isInteractive &&
                "hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
              !isInteractive && "cursor-default"
            )}
            style={itemStyle}
            onClick={() => onCategoryClick?.(item.category)}
            disabled={!isInteractive}
            aria-label={`${item.category}: ${item.percentage}%, ${formatAmount(
              item.amount,
              currency
            )}`}
          >
            <span className="flex items-center gap-[var(--space-3)]">
              <span className="min-w-0 flex-1 truncate text-[var(--text-sm)] font-[var(--weight-medium)]">
                {item.category}
              </span>
              <span className="font-[var(--font-mono)] text-[var(--text-sm)] tabular-nums text-[var(--color-text-secondary)]">
                {formatAmount(item.amount, currency)}
              </span>
              <span className="w-[var(--space-8)] text-right font-[var(--font-mono)] text-[var(--text-xs)] tabular-nums text-[var(--color-text-muted)]">
                {item.percentage}%
              </span>
            </span>
            <span
              className="h-[var(--space-2)] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-neutral-100)]"
              aria-hidden="true"
            >
              <span
                className="block h-full w-[var(--bar-width)] rounded-[var(--radius-full)] bg-[var(--chart-color)] transition-[width] duration-[var(--duration-slow)] ease-[var(--easing-standard)]"
              />
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      className={cn(
        spendingBreakdownChartVariants({ chartType, size }),
        className
      )}
      aria-busy={isLoading}
      aria-label="Spending breakdown"
    >
      {content}
    </section>
  );
}