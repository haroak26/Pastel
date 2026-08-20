"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/screens/home.jsx
  var import_react5 = __toESM(__require("react"), 1);
  var import_lucide_react5 = __require("lucide-react");

  // src/lib/shell.jsx
  var import_lucide_react = __require("lucide-react");

  // src/data.js
  var DATA = {
    "brand": {
      "name": "Build A Premium Airbnb-style",
      "tagline": "Build a premium Airbnb-style cabin rental marketplace. The app should have:\n\nHOME SCREEN:\n"
    },
    "user": {
      "name": "Avery Quinn",
      "role": "Owner",
      "initials": "AQ",
      "hue": 75
    },
    "nav": [
      {
        "id": "home",
        "label": "Home",
        "icon": "home"
      },
      {
        "id": "detail",
        "label": "Detail",
        "icon": "file"
      }
    ],
    "metrics": [
      {
        "label": "Active items",
        "value": "24",
        "unit": "",
        "delta": 8,
        "positive": true
      },
      {
        "label": "This week",
        "value": "6",
        "unit": "",
        "delta": 12,
        "positive": true
      },
      {
        "label": "Completion",
        "value": "82",
        "unit": "%",
        "delta": 3,
        "positive": true
      }
    ],
    "list": {
      "name": "Records",
      "rows": [
        {
          "id": "row-1",
          "title": "Harbor Line",
          "subtitle": "Reviewed twice, ready to move",
          "meta": "Updated 2d ago",
          "status": "Active",
          "date": "Jul 21"
        },
        {
          "id": "row-2",
          "title": "North Peak",
          "subtitle": "Waiting on one confirmation",
          "meta": "Updated 4d ago",
          "status": "Pending",
          "date": "Jul 27"
        },
        {
          "id": "row-3",
          "title": "Harbor Line 3",
          "subtitle": "Reviewed twice, ready to move",
          "meta": "Updated 2d ago",
          "status": "Active",
          "date": "Aug 2"
        },
        {
          "id": "row-4",
          "title": "North Peak 4",
          "subtitle": "Waiting on one confirmation",
          "meta": "Updated 5d ago",
          "status": "Pending",
          "date": "Aug 7"
        },
        {
          "id": "row-5",
          "title": "Harbor Line 5",
          "subtitle": "Reviewed twice, ready to move",
          "meta": "Updated 2d ago",
          "status": "Active",
          "date": "Aug 13"
        },
        {
          "id": "row-6",
          "title": "North Peak 6",
          "subtitle": "Waiting on one confirmation",
          "meta": "Updated 6d ago",
          "status": "Pending",
          "date": "Aug 19"
        }
      ]
    },
    "detail": {
      "title": "Harbor Line",
      "fields": [
        {
          "label": "Status",
          "value": "Active"
        },
        {
          "label": "Owner",
          "value": "Avery Quinn"
        },
        {
          "label": "Started",
          "value": "2026-07-21"
        },
        {
          "label": "Items",
          "value": "12"
        }
      ]
    },
    "activity": [
      {
        "actor": "Avery Quinn",
        "action": "updated the status of",
        "target": "Harbor Line",
        "time": "2h ago"
      },
      {
        "actor": "Avery Quinn",
        "action": "added 3 items to",
        "target": "North Peak",
        "time": "1d ago"
      },
      {
        "actor": "Avery Quinn",
        "action": "created",
        "target": "Harbor Line",
        "time": "5d ago"
      }
    ],
    "spark": [
      59.3,
      66.8,
      80.4,
      83.7,
      77.5,
      81.5,
      76.4,
      89.5,
      96,
      84.5,
      95,
      96
    ],
    "primaryCta": "Log entry"
  };

  // src/lib/shell.jsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  function IconOf({ name, className = "h-4 w-4" }) {
    const icons = {
      home: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Home, { className }),
      list: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.List, { className }),
      chart: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.LineChart, { className }),
      settings: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Settings, { className }),
      users: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Users, { className }),
      bell: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Bell, { className }),
      search: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Search, { className }),
      plus: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Plus, { className }),
      download: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Download, { className }),
      filter: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Filter, { className }),
      arrowRight: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ArrowRight, { className }),
      mail: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Mail, { className }),
      alert: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.AlertCircle, { className }),
      file: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.FileText, { className }),
      edit: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Edit, { className }),
      check: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CheckCircle2, { className }),
      zap: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Zap, { className }),
      card: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CreditCard, { className }),
      trendingUp: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.TrendingUp, { className }),
      play: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Play, { className }),
      heart: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Heart, { className }),
      mapPin: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MapPin, { className }),
      star: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Star, { className }),
      clock: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Clock, { className }),
      image: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Image, { className }),
      more: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MoreHorizontal, { className }),
      chevronDown: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.ChevronDown, { className }),
      calendarDays: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.CalendarDays, { className })
    };
    return icons[name] ?? null;
  }
  function NavAdapter({ nav, activeId, onNavigate, children }) {
    const hasSidebar = nav === "sidebar" || nav === "sidebar+topbar";
    const hasTopbar = nav === "topbar" || nav === "sidebar+topbar";
    if (!hasSidebar && !hasTopbar) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
    const brand = DATA.brand.name;
    const user = DATA.user;
    const topbarInner = hasTopbar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground", "aria-hidden": "true", children: brand.slice(0, 1) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden truncate font-semibold sm:inline", style: { fontFamily: "var(--font-display)" }, children: brand }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex shrink-0 items-center gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-label": user.name, className: "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold", style: { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }, children: user.initials }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden text-sm font-medium md:inline", children: user.name })
      ] })
    ] }) : null;
    if (!hasSidebar) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        topbarInner,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { className: "w-full min-w-0", children })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex min-h-screen", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background lg:flex", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex h-16 items-center gap-2 px-6", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground", children: brand.slice(0, 1) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "truncate font-semibold", style: { fontFamily: "var(--font-display)" }, children: brand })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "mt-2 flex-1 space-y-1 px-4", "aria-label": "Primary navigation", children: DATA.nav.map((item) => {
          const current = item.id === activeId;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => onNavigate(item.id),
              "aria-current": current ? "page" : void 0,
              className: "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " + (current ? "bg-muted/50 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconOf, { name: item.icon, className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "truncate", children: item.label })
              ]
            },
            item.id
          );
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border p-4", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-label": user.name, className: "flex h-[var(--control-sm)] w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", style: { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }, children: user.initials }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "truncate text-sm font-medium", children: user.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "truncate text-xs text-muted-foreground", children: user.role })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex min-w-0 flex-1 flex-col", children: [
        topbarInner,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { className: "w-full min-w-0", children })
      ] })
    ] });
  }

  // src/components/Button.jsx
  var import_react = __toESM(__require("react"), 1);
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function Button({
    label = "Continue",
    variant = "primary",
    size = "md",
    onClick,
    disabled = false,
    ...props
  }) {
    const sizeStyles = {
      sm: "h-[var(--control-sm)] px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]",
      md: "h-[var(--control-md)] px-5 text-sm font-semibold rounded-[var(--radius-md)]",
      lg: "h-[var(--control-lg)] px-6 text-base font-semibold rounded-[var(--radius-lg)]"
    };
    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 border border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-[var(--border)] active:opacity-90 border border-transparent",
      outline: "bg-background text-foreground border border-border hover:bg-secondary active:opacity-90",
      ghost: "bg-transparent text-foreground hover:bg-secondary active:opacity-80 border border-transparent",
      accent: "bg-accent text-accent-foreground hover:brightness-105 active:brightness-95 border border-transparent"
    };
    const currentSize = sizeStyles[size] || sizeStyles.md;
    const currentVariant = variantStyles[variant] || variantStyles.primary;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        onClick,
        disabled,
        className: `inline-flex items-center justify-center gap-2 whitespace-nowrap font-[family-name:var(--font-body)] tracking-tight transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 active:scale-[0.98] ${currentSize} ${currentVariant}`,
        ...props,
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: label })
      }
    );
  }

  // src/components/Badge.jsx
  var import_react2 = __toESM(__require("react"), 1);
  var import_lucide_react2 = __require("lucide-react");
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function Badge({
    label = "",
    tone = "secondary"
  }) {
    const normalizedTone = String(tone).toLowerCase();
    const getToneStyle = () => {
      switch (normalizedTone) {
        case "primary":
        case "accent":
          return "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent";
        case "success":
        case "active":
          return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
        case "warning":
        case "pending":
          return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25";
        case "destructive":
        case "danger":
        case "error":
          return "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20";
        case "superhost":
        case "featured":
          return "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
        case "muted":
          return "bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent";
        case "outline":
          return "bg-transparent text-[var(--foreground)] border-[var(--border)]";
        case "secondary":
        default:
          return "bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)]";
      }
    };
    const renderIcon = () => {
      switch (normalizedTone) {
        case "superhost":
        case "featured":
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.Award, { className: "w-3 h-3 text-[var(--primary)] shrink-0", "aria-hidden": "true" });
        case "active":
        case "success":
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[var(--success)] shrink-0", "aria-hidden": "true" });
        case "pending":
        case "warning":
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0", "aria-hidden": "true" });
        case "destructive":
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react2.AlertCircle, { className: "w-3 h-3 shrink-0", "aria-hidden": "true" });
        default:
          return null;
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "span",
      {
        className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-tight rounded-[var(--radius-full)] border transition-colors select-none ${getToneStyle()}`,
        children: [
          renderIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: label })
        ]
      }
    );
  }

  // src/components/MetricCard.jsx
  var import_react3 = __toESM(__require("react"), 1);
  var import_lucide_react3 = __require("lucide-react");
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function MetricCard({
    label = "Metric",
    value = "0",
    unit = "",
    delta,
    positive = true
  }) {
    const hasDelta = typeof delta === "number";
    const isNeutral = delta === 0;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col justify-between p-5 bg-card text-card-foreground border border-border rounded-[var(--radius-lg)] hover:border-foreground/30 transition-colors", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between gap-2 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-xs font-semibold tracking-wider uppercase text-muted-foreground font-[var(--font-display)]", children: label }),
        hasDelta && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold tabular-nums ${isNeutral ? "bg-muted text-muted-foreground" : positive ? "bg-secondary text-success" : "bg-secondary text-destructive"}`,
            children: [
              isNeutral ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.Minus, { className: "w-3 h-3" }) : positive ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.TrendingUp, { className: "w-3 h-3" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react3.TrendingDown, { className: "w-3 h-3" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
                positive && !isNeutral ? "+" : "",
                delta,
                "%"
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-baseline gap-1 mt-auto", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-4xl font-black tracking-tight text-foreground font-[var(--font-display)] tabular-nums", children: value }),
        unit && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-lg font-bold text-muted-foreground font-[var(--font-display)]", children: unit })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "vs. previous period" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "svg",
          {
            className: "w-16 h-4 stroke-current opacity-70",
            viewBox: "0 0 64 16",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            "aria-hidden": "true",
            children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "path",
              {
                d: positive ? "M2 14 L18 10 L34 12 L50 4 L62 2" : "M2 3 L18 5 L34 8 L50 7 L62 13",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            )
          }
        )
      ] })
    ] });
  }

  // src/components/RecordList.jsx
  var import_react4 = __toESM(__require("react"), 1);
  var import_lucide_react4 = __require("lucide-react");
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  function RecordList({ rows = [], onSelect }) {
    const [selectedId, setSelectedId] = (0, import_react4.useState)(null);
    const handleRowClick = (row) => {
      setSelectedId(row.id);
      if (onSelect) {
        onSelect(row);
      }
    };
    const handleKeyDown = (e, row) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleRowClick(row);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "w-full bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center justify-between px-5 py-3.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "Record" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-secondary text-foreground text-[11px] font-medium", children: rows.length })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "hidden sm:flex items-center gap-8 text-right", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "w-28 text-left", children: "Activity" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "w-24 text-center", children: "Status" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "w-16", children: "Timeline" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "divide-y divide-border/80", role: "list", children: rows.map((row) => {
        const isActive = row.status?.toLowerCase() === "active";
        const isSelected = selectedId === row.id;
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            role: "button",
            tabIndex: 0,
            "aria-selected": isSelected,
            onClick: () => handleRowClick(row),
            onKeyDown: (e) => handleKeyDown(e, row),
            className: `group relative flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset ${isSelected ? "bg-secondary" : "bg-card hover:bg-secondary/40"}`,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-start gap-3.5 min-w-0 pr-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "mt-0.5 flex-shrink-0", children: isActive ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.CheckCircle2, { className: "w-4 h-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.AlertCircle, { className: "w-4 h-4 text-muted-foreground" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors font-display", children: row.title }),
                    isSelected && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" })
                  ] }),
                  row.subtitle && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "text-xs text-muted-foreground truncate mt-0.5", children: row.subtitle })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 sm:gap-8 flex-shrink-0 text-xs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-1.5 text-muted-foreground sm:w-28", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.Clock, { className: "w-3.5 h-3.5 flex-shrink-0" }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "truncate", children: row.meta })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "sm:w-24 flex sm:justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                  "span",
                  {
                    className: `inline-flex items-center px-2.5 py-1 rounded-[var(--radius-full)] text-[11px] font-medium leading-none ${isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground border border-border"}`,
                    children: row.status
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-3 sm:w-16 justify-end text-muted-foreground", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.Calendar, { className: "w-3.5 h-3.5 hidden sm:inline" }),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "font-medium text-foreground text-xs", children: row.date })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react4.ChevronRight, { className: "w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" })
                ] })
              ] })
            ]
          },
          row.id
        );
      }) })
    ] });
  }

  // src/screens/home.jsx
  var import_jsx_runtime6 = __require("react/jsx-runtime");
  function Home2() {
    const [activeNav, setActiveNav] = (0, import_react5.useState)("home");
    const [activeFilter, setActiveFilter] = (0, import_react5.useState)("all");
    const [searchQuery, setSearchQuery] = (0, import_react5.useState)("");
    const primaryMetric = DATA.metrics[0];
    const secondaryMetrics = DATA.metrics.slice(1);
    const sparkPoints = DATA.spark || [];
    const minVal = Math.min(...sparkPoints);
    const maxVal = Math.max(...sparkPoints);
    const range = maxVal - minVal || 1;
    const svgWidth = 240;
    const svgHeight = 44;
    const pointsString = sparkPoints.map((val, idx) => {
      const x = idx / (sparkPoints.length - 1) * svgWidth;
      const y = svgHeight - (val - minVal) / range * (svgHeight - 8) - 4;
      return `${x},${y}`;
    }).join(" ");
    const filterCategories = [
      { id: "all", label: "All properties" },
      { id: "active", label: "Lakefront & Peak" },
      { id: "pending", label: "Under review" }
    ];
    const filteredRows = DATA.list.rows.filter((row) => {
      if (activeFilter === "active") return row.status === "Active";
      if (activeFilter === "pending") return row.status === "Pending";
      return true;
    });
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(NavAdapter, { nav: "sidebar", activeId: activeNav, onNavigate: setActiveNav, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border pb-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Sparkles, { className: "w-3.5 h-3.5" }),
            "Cabin Marketplace"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: DATA.brand.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2 bg-secondary border border-border rounded-full px-4 h-[var(--control-md)] text-sm shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Search, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { htmlFor: "property-search-input", className: "sr-only", children: "Search cabins and reservations" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "input",
              {
                id: "property-search-input",
                type: "text",
                placeholder: "Where to? Location, status, dates...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-48 sm:w-64 text-sm",
                "aria-label": "Search cabins and reservations"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            Button,
            {
              label: DATA.primaryCta,
              variant: "primary",
              size: "md",
              onClick: () => {
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { "aria-labelledby": "overview-heading", className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "lg:col-span-8 bg-card border border-border rounded-[var(--radius-xl)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Portfolio Operations" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { id: "overview-heading", className: "text-base font-semibold text-foreground mt-0.5", children: primaryMetric.label })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.ArrowUpRight, { className: "w-3.5 h-3.5 text-primary" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                "+",
                primaryMetric.delta,
                "% vs last cycle"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col sm:flex-row items-baseline sm:items-end justify-between gap-6 my-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-baseline gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-4xl font-black tracking-tight text-foreground tabular-nums", children: primaryMetric.value }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-muted-foreground text-sm font-medium", children: "units managed" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-full sm:w-auto flex flex-col items-start sm:items-end gap-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[11px] font-medium text-muted-foreground", children: "30-day velocity" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-full sm:w-60 h-[var(--control-sm)]", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { className: "w-full h-full overflow-visible", viewBox: "0 0 240 44", fill: "none", children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "path",
                  {
                    d: `M 0,${svgHeight} L ${pointsString.split(" ")[0]} L ${pointsString} L ${svgWidth},${svgHeight} Z`,
                    className: "fill-primary/10"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "polyline",
                  {
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    points: pointsString,
                    className: "text-primary"
                  }
                )
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "pt-6 mt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.CheckCircle2, { className: "w-4 h-4 text-primary" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                "Owner: ",
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { className: "text-foreground", children: DATA.user.name }),
                " (",
                DATA.user.role,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Calendar, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                "Next turnover: ",
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { className: "text-foreground", children: "Jul 21, 2026" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4", children: [
          secondaryMetrics.map((m, idx) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            MetricCard,
            {
              label: m.label,
              value: m.value,
              unit: m.unit,
              delta: m.delta,
              positive: m.positive
            }
          ) }, idx)),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-secondary rounded-[var(--radius-lg)] p-4 border border-border flex items-center justify-between", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted-foreground font-medium", children: "Host Rating" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-lg font-bold text-foreground mt-0.5", children: [
                "4.98 ",
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-xs font-normal text-muted-foreground", children: "/ 5.0" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Badge, { label: "Superhost", tone: "primary" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "lg:col-span-8 flex flex-col gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "text-lg font-bold text-foreground", children: DATA.list.name }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-xs text-muted-foreground", children: [
                "Showing ",
                filteredRows.length,
                " properties requiring attention"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex items-center gap-1.5 p-1 bg-secondary rounded-[var(--radius-md)] border border-border self-start sm:self-auto", children: filterCategories.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "button",
              {
                onClick: () => setActiveFilter(tab.id),
                className: `px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${activeFilter === tab.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`,
                children: tab.label
              },
              tab.id
            )) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            RecordList,
            {
              rows: filteredRows,
              onSelect: (row) => {
              }
            }
          ) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "lg:col-span-4 flex flex-col gap-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-card border border-border rounded-[var(--radius-xl)] p-5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-10 h-[var(--control-md)] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm", children: DATA.user.initials }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h4", { className: "text-sm font-bold text-foreground", children: DATA.user.name }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-xs text-muted-foreground", children: [
                  DATA.user.role,
                  " \u2022 Fast response"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-2.5 pt-3 border-t border-border text-xs", children: DATA.detail.fields.map((field, idx) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-muted-foreground", children: field.label }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-semibold text-foreground", children: field.value })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-secondary/60 border border-border rounded-[var(--radius-xl)] p-5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h4", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: "Recent Audit Trail" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react5.Clock, { className: "w-3.5 h-3.5 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "space-y-4", children: DATA.activity.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-start gap-3 text-xs", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-foreground", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-semibold", children: item.actor }),
                  " ",
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-muted-foreground", children: item.action }),
                  " ",
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-semibold", children: item.target })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: item.time })
              ] })
            ] }, idx)) })
          ] })
        ] })
      ] })
    ] }) });
  }
})();
