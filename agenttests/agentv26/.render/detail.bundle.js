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

  // .render/detail.jsx
  var import_react6 = __toESM(__require("react"), 1);
  var import_lucide_react6 = __require("lucide-react");

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

  // src/components/PhotoMosaic.jsx
  var import_react = __toESM(__require("react"), 1);
  var import_lucide_react2 = __require("lucide-react");
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  function PhotoMosaic({
    images = [],
    propertyName = "Sanctuary Retreat"
  }) {
    const [isSaved, setIsSaved] = (0, import_react.useState)(false);
    const [activePhotoIndex, setActivePhotoIndex] = (0, import_react.useState)(null);
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "section",
      {
        "aria-label": `Photo gallery for ${propertyName}`,
        className: "relative w-full select-none",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between pb-3 px-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium tracking-wide uppercase text-secondary-foreground bg-input/60 rounded-[var(--radius-full)] border border-border", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react2.Compass, { className: "w-3.5 h-3.5 text-primary" }),
                "Architectural Overview"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-medium text-muted-foreground hidden sm:inline-block", children: "5 Curated Perspectives" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (navigator.share) {
                      navigator.share({ title: propertyName, url: window.location.href }).catch(() => {
                      });
                    }
                  },
                  "aria-label": "Share this property",
                  className: "inline-flex items-center justify-center gap-1.5 h-[var(--control-sm)] px-3 text-xs font-medium text-foreground bg-card hover:bg-background active:scale-[0.98] transition-all rounded-[var(--radius-full)] border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react2.Share2, { className: "w-3.5 h-3.5 text-muted" }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "hidden sm:inline", children: "Share" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setIsSaved(!isSaved),
                  "aria-label": isSaved ? "Remove from saved retreats" : "Save this retreat",
                  className: "inline-flex items-center justify-center gap-1.5 h-[var(--control-sm)] px-3 text-xs font-medium text-foreground bg-card hover:bg-background active:scale-[0.98] transition-all rounded-[var(--radius-full)] border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      import_lucide_react2.Heart,
                      {
                        className: `w-3.5 h-3.5 transition-colors ${isSaved ? "fill-primary text-primary" : "text-muted"}`
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "hidden sm:inline", children: isSaved ? "Saved" : "Save" })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-2.5 rounded-[var(--radius-xl)] overflow-hidden bg-border/40 p-1.5 border border-border", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "div",
              {
                className: "relative md:col-span-2 md:row-span-2 group overflow-hidden rounded-[var(--radius-lg)] bg-input/40 min-h-[260px] md:min-h-[440px] cursor-pointer",
                onClick: () => setActivePhotoIndex(0),
                role: "button",
                tabIndex: 0,
                onKeyDown: (e) => e.key === "Enter" && setActivePhotoIndex(0),
                "aria-label": `View hero photograph: ${heroImage.caption}`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "img",
                    {
                      src: heroImage.url,
                      alt: heroImage.caption,
                      className: "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]",
                      loading: "eager"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "inline-flex items-center px-2.5 py-1 text-xs font-medium text-card bg-foreground/75 backdrop-blur-sm rounded-[var(--radius-md)] line-clamp-1 max-w-[85%] border border-card/10", children: heroImage.caption }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "hidden md:inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-full)] bg-card/90 text-foreground shadow-sm", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react2.Maximize2, { className: "w-3.5 h-3.5" }) })
                  ] })
                ]
              }
            ),
            supportingImages.map((img, idx) => {
              const photoIndex = idx + 1;
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "div",
                {
                  className: "relative group overflow-hidden rounded-[var(--radius-lg)] bg-input/40 aspect-[4/3] md:aspect-auto min-h-[140px] md:min-h-[214px] cursor-pointer",
                  onClick: () => setActivePhotoIndex(photoIndex),
                  role: "button",
                  tabIndex: 0,
                  onKeyDown: (e) => e.key === "Enter" && setActivePhotoIndex(photoIndex),
                  "aria-label": `View photograph ${photoIndex + 1}: ${img.caption}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "img",
                      {
                        src: img.url,
                        alt: img.caption,
                        className: "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                        loading: "lazy"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "block px-2 py-0.5 text-[11px] font-medium text-card bg-foreground/80 backdrop-blur-sm rounded-[var(--radius-sm)] truncate", children: img.caption }) })
                  ]
                },
                photoIndex
              );
            })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute bottom-4 right-4 z-10", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => setActivePhotoIndex(0),
              className: "inline-flex items-center justify-center gap-2 h-[var(--control-md)] px-4 bg-card/95 hover:bg-card text-foreground font-medium text-xs tracking-tight rounded-[var(--radius-full)] border border-border shadow-sm active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_lucide_react2.Grid, { className: "w-3.5 h-3.5 text-primary" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Show all 5 photos" })
              ]
            }
          ) }),
          activePhotoIndex !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              role: "dialog",
              "aria-modal": "true",
              "aria-label": "Image modal",
              className: "fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4 animate-in fade-in duration-200",
              onClick: () => setActivePhotoIndex(null),
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "div",
                {
                  className: "relative max-w-4xl w-full bg-card rounded-[var(--radius-xl)] overflow-hidden border border-border p-2",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "relative aspect-[16/10] w-full bg-input/20 rounded-[var(--radius-lg)] overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "img",
                      {
                        src: normalizedImages[activePhotoIndex].url,
                        alt: normalizedImages[activePhotoIndex].caption,
                        className: "w-full h-full object-cover"
                      }
                    ) }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between p-3", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "text-xs font-semibold text-primary uppercase tracking-wider", children: [
                          "Perspective ",
                          activePhotoIndex + 1,
                          " of ",
                          normalizedImages.length
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { className: "text-sm font-medium text-foreground", children: normalizedImages[activePhotoIndex].caption })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                        "button",
                        {
                          type: "button",
                          onClick: () => setActivePhotoIndex(null),
                          className: "h-[var(--control-sm)] px-3 text-xs font-medium rounded-[var(--radius-full)] bg-input/60 hover:bg-input text-foreground transition-colors",
                          children: "Close"
                        }
                      )
                    ] })
                  ]
                }
              )
            }
          )
        ]
      }
    );
  }

  // src/components/BookingSummaryCard.jsx
  var import_react2 = __toESM(__require("react"), 1);
  var import_lucide_react3 = __require("lucide-react");
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function BookingSummaryCard({
    pricePerNight = 385,
    checkIn = "Mar 12, 2026",
    checkOut = "Mar 17, 2026",
    guestCount = 4,
    cleaningFee = 160,
    serviceFee = 112
  }) {
    const [nights, setNights] = (0, import_react2.useState)(5);
    const [guests, setGuests] = (0, import_react2.useState)(guestCount);
    const [isTooltipOpen, setIsTooltipOpen] = (0, import_react2.useState)(false);
    const baseTotal = pricePerNight * nights;
    const grandTotal = baseTotal + cleaningFee + serviceFee;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "w-full max-w-sm rounded-[var(--radius-xl)] border border-border bg-card p-6 text-card-foreground shadow-sm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-baseline justify-between pb-5 border-b border-border", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-baseline gap-1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "text-3xl sm:text-4xl font-black tracking-tight text-foreground", children: [
            "$",
            pricePerNight
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-sm font-medium text-muted-foreground", children: "/ night" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-1.5 text-xs font-semibold text-foreground bg-background px-2.5 py-1 rounded-[var(--radius-full)] border border-border", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-primary font-bold", children: "\u2605" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "4.98" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-muted-foreground font-normal", children: "(128)" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-5 rounded-[var(--radius-lg)] border border-border bg-background p-1 divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "grid grid-cols-2 divide-x divide-border", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              type: "button",
              className: "flex flex-col text-left px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-l-[var(--radius-md)]",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Check-In" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-xs font-semibold text-foreground truncate mt-0.5", children: checkIn })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "button",
            {
              type: "button",
              className: "flex flex-col text-left px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-r-[var(--radius-md)]",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Check-Out" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-xs font-semibold text-foreground truncate mt-0.5", children: checkOut })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pt-1 sm:pt-0", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => setGuests((prev) => prev >= 8 ? 1 : prev + 1),
            className: "w-full flex items-center justify-between px-3 py-2 hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-md)]",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col text-left", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Guests" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "text-xs font-semibold text-foreground mt-0.5", children: [
                  guests,
                  " ",
                  guests === 1 ? "guest" : "guests"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react3.ChevronDown, { className: "w-3.5 h-3.5 text-muted-foreground" })
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "w-full mt-4 h-[var(--control-lg)] rounded-[var(--radius-full)] bg-primary text-primary-foreground font-semibold text-sm tracking-tight flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "Reserve Sanctuary" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "mt-2.5 text-center text-xs text-muted-foreground", children: "You won't be charged yet" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-5 space-y-2.5 pt-4 border-t border-border text-xs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex justify-between items-center text-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "text-muted-foreground underline decoration-border decoration-1 underline-offset-4", children: [
            "$",
            pricePerNight,
            " \xD7 ",
            nights,
            " nights"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-medium", children: [
            "$",
            baseTotal
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex justify-between items-center text-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-muted-foreground underline decoration-border decoration-1 underline-offset-4", children: "Cleaning fee" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-medium", children: [
            "$",
            cleaningFee
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex justify-between items-center text-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-muted-foreground underline decoration-border decoration-1 underline-offset-4", children: "Hearth service fee" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                onClick: () => setIsTooltipOpen(!isTooltipOpen),
                className: "text-muted-foreground hover:text-foreground focus-visible:outline-none",
                "aria-label": "Service fee details",
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react3.Info, { className: "w-3 h-3" })
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-medium", children: [
            "$",
            serviceFee
          ] })
        ] }),
        isTooltipOpen && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "p-2.5 rounded-[var(--radius-md)] bg-background border border-border text-[11px] text-muted-foreground leading-relaxed", children: "Direct host insurance, 24/7 wilderness concierge, and keyless check-in guarantee." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-4 pt-4 border-t border-border flex items-baseline justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-sm font-bold text-foreground", children: "Total before taxes" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-[11px] text-muted-foreground", children: "Includes all mandatory fees" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "text-xl font-black tracking-tight text-foreground", children: [
          "$",
          grandTotal
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mt-5 pt-4 border-t border-border flex items-start gap-2.5 text-muted-foreground", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_lucide_react3.ShieldCheck, { className: "w-4 h-4 text-primary shrink-0 mt-0.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "text-[11px] leading-snug", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { className: "text-foreground font-semibold", children: "Architectural Guarantee:" }),
          " Full refund up to 5 days before check-in."
        ] })
      ] })
    ] });
  }

  // src/components/ReviewList.jsx
  var import_react3 = __toESM(__require("react"), 1);
  var import_lucide_react4 = __require("lucide-react");
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function ReviewList({
    reviews = [],
    averageRating = 4.98,
    totalReviews = 128
  }) {
    const [searchTerm, setSearchTerm] = (0, import_react3.useState)("");
    const [selectedFilter, setSelectedFilter] = (0, import_react3.useState)("all");
    const [helpfulCounts, setHelpfulCounts] = (0, import_react3.useState)({});
    const toggleHelpful = (idx) => {
      setHelpfulCounts((prev) => ({
        ...prev,
        [idx]: (prev[idx] || 0) + 1
      }));
    };
    const filteredReviews = (0, import_react3.useMemo)(() => {
      return reviews.filter((rev) => {
        const matchesSearch = rev.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || rev.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedFilter === "all" ? true : selectedFilter === "5" ? rev.rating >= 5 : rev.rating === Number(selectedFilter);
        return matchesSearch && matchesFilter;
      });
    }, [reviews, searchTerm, selectedFilter]);
    const ratingCategories = [
      { label: "Architectural craft", score: "5.0", fillPct: "100%" },
      { label: "Hearth & firewood", score: "4.9", fillPct: "98%" },
      { label: "Wilderness seclusion", score: "5.0", fillPct: "100%" },
      { label: "Cleanliness & care", score: "4.9", fillPct: "98%" }
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "w-full text-foreground font-sans", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "border-b border-border pb-8 mb-8", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8 items-start", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "md:col-span-4 flex flex-col justify-between", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-baseline gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-4xl font-black tracking-tight text-foreground", children: Number(averageRating).toFixed(2) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex items-center gap-1 text-primary", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.Star, { className: "w-5 h-5 fill-primary text-primary" }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm font-semibold text-foreground mt-1", children: "Sanctuary Guest Favorite" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "Based on ",
              totalReviews,
              " verified stays and architectural logs"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-border/40 text-xs font-medium text-secondary", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.Sparkles, { className: "w-3.5 h-3.5 text-primary" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Top 1% wilderness cabins worldwide" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 pt-1", children: ratingCategories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex justify-between items-center text-xs font-medium", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-foreground", children: cat.label }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "font-bold tabular-nums text-foreground", children: cat.score })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "h-1.5 w-full bg-border rounded-full overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "div",
              {
                className: "h-full bg-primary rounded-full transition-all duration-300",
                style: { width: cat.fillPct }
              }
            ) })
          ] }, cat.label)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative flex-1 max-w-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.Search, { className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search timber, sauna, stars...",
                className: "w-full h-[var(--control-md)] pl-10 pr-4 bg-background border border-border rounded-[var(--radius-lg)] text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition",
                "aria-label": "Search guest reviews"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1.5 p-1 bg-border/40 rounded-[var(--radius-lg)] self-start sm:self-auto", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "button",
              {
                type: "button",
                onClick: () => setSelectedFilter("all"),
                className: `h-[var(--control-sm)] px-3.5 rounded-full text-xs font-medium transition-all ${selectedFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                children: "All reviews"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "button",
              {
                type: "button",
                onClick: () => setSelectedFilter("5"),
                className: `h-[var(--control-sm)] px-3.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${selectedFilter === "5" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.Star, { className: "w-3 h-3 fill-primary text-primary" }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "5.0 only" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "divide-y divide-border", children: filteredReviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "py-12 text-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.SlidersHorizontal, { className: "w-6 h-6 text-muted-foreground mx-auto mb-2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm font-medium text-foreground", children: "No verified reviews found" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: "Try adjusting your search query or filter tags." })
      ] }) : filteredReviews.map((rev, index) => {
        const initials = rev.name ? rev.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "GT";
        const helpfulCount = helpfulCounts[index] || 0;
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "py-6 first:pt-0 last:pb-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-10 h-[var(--control-md)] rounded-full bg-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 select-none", children: initials }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "text-sm font-bold text-foreground leading-tight", children: rev.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "inline-flex items-center text-[10px] font-semibold text-success gap-0.5 bg-background border border-border px-1.5 py-0.5 rounded-full", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.ShieldCheck, { className: "w-2.5 h-2.5" }),
                    "Verified Stay"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-muted-foreground mt-0.5", children: rev.date || "Stayed recently" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-1 text-primary", children: [
              Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                import_lucide_react4.Star,
                {
                  className: `w-3.5 h-3.5 ${i < (rev.rating || 5) ? "fill-primary text-primary" : "text-border"}`
                },
                i
              )),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "ml-1 text-xs font-semibold text-foreground", children: Number(rev.rating || 5).toFixed(1) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "mt-3 text-sm text-foreground leading-relaxed", children: rev.comment }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "mt-3.5 flex items-center gap-4", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => toggleHelpful(index),
              "aria-label": `Mark review by ${rev.name} as helpful`,
              className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-sm)] py-1 pr-2 transition-colors",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_lucide_react4.ThumbsUp, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
                  "Helpful ",
                  helpfulCount > 0 && `(${helpfulCount})`
                ] })
              ]
            }
          ) })
        ] }, rev.id || `${rev.name}-${index}`);
      }) })
    ] });
  }

  // src/components/Badge.jsx
  var import_react4 = __toESM(__require("react"), 1);
  var import_lucide_react5 = __require("lucide-react");
  var import_jsx_runtime5 = __require("react/jsx-runtime");
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
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react5.Award, { className: "w-3 h-3 text-[var(--primary)] shrink-0", "aria-hidden": "true" });
        case "active":
        case "success":
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[var(--success)] shrink-0", "aria-hidden": "true" });
        case "pending":
        case "warning":
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0", "aria-hidden": "true" });
        case "destructive":
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_lucide_react5.AlertCircle, { className: "w-3 h-3 shrink-0", "aria-hidden": "true" });
        default:
          return null;
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "span",
      {
        className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-tight rounded-[var(--radius-full)] border transition-colors select-none ${getToneStyle()}`,
        children: [
          renderIcon(),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: label })
        ]
      }
    );
  }

  // src/components/Button.jsx
  var import_react5 = __toESM(__require("react"), 1);
  var import_jsx_runtime6 = __require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "button",
      {
        type: "button",
        onClick,
        disabled,
        className: `inline-flex items-center justify-center gap-2 whitespace-nowrap font-[family-name:var(--font-body)] tracking-tight transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 active:scale-[0.98] ${currentSize} ${currentVariant}`,
        ...props,
        children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: label })
      }
    );
  }

  // .render/detail.jsx
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  var CABIN = {
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
    amenities: ["WiFi", "Kitchen", "Hot Tub", "Parking", "Fireplace", "Pet Friendly"]
  };
  var REVIEWS = [
    { id: "r1", name: "Daniel Okafor", date: "July 2026", rating: 5, comment: "The morning light over the lake from the great room is unreal. Kayaks were ready at the dock, the sauna was spotless, and Maya's house manual had every answer before we asked." },
    { id: "r2", name: "Priya Raghavan", date: "June 2026", rating: 5, comment: "Exactly the quiet weekend we needed. Kitchen is beautifully stocked, beds are hotel-grade, and the hot tub under the pines at dusk is pure magic." },
    { id: "r3", name: "Tom Whitfield", date: "May 2026", rating: 4.5, comment: "Gorgeous cabin, unbeatable location. Only note: the driveway is steep in the winter months \u2014 bring AWD. Everything else was flawless." },
    { id: "r4", name: "Sofia Alvarez", date: "April 2026", rating: 5, comment: "We came for our anniversary and Maya left a bottle of local wine and a handwritten card. That kind of care is why we'll be back every year." },
    { id: "r5", name: "James Park", date: "March 2026", rating: 5, comment: "Three couples, three nights, zero complaints. The layout gives everyone privacy and the lakefront deck is the best room in the house." }
  ];
  function Detail() {
    const [activeNav, setActiveNav] = (0, import_react6.useState)("detail");
    const [saved, setSaved] = (0, import_react6.useState)(false);
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(NavAdapter, { nav: "sidebar", activeId: activeNav, onNavigate: setActiveNav, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PhotoMosaic, { propertyName: CABIN.name }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "mt-8 flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Badge, { label: "Superhost", tone: "accent" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.MapPin, { className: "h-3.5 w-3.5" }),
              " ",
              CABIN.location
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h1", { className: "mt-2 text-3xl font-black tracking-tight text-foreground font-[var(--font-display)] sm:text-4xl", children: CABIN.name }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "mt-1 flex items-center gap-1 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Star, { className: "h-4 w-4 fill-primary text-primary" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "font-semibold text-foreground", children: CABIN.rating }),
            " \xB7 ",
            CABIN.reviews,
            " reviews \xB7 ",
            CABIN.guests,
            " guests \xB7 ",
            CABIN.bedrooms,
            " bedrooms \xB7 ",
            CABIN.beds,
            " beds \xB7 ",
            CABIN.baths,
            " baths"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": "Save listing", onClick: () => setSaved(!saved), className: "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Heart, { className: "h-4 w-4 " + (saved ? "fill-primary text-primary" : "") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", "aria-label": "Share listing", className: "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Share2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-8", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-base leading-relaxed text-foreground/90", children: CABIN.description }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { "aria-labelledby": "amenities-heading", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { id: "amenities-heading", className: "text-xl font-bold tracking-tight text-foreground font-[var(--font-display)]", children: "What this place offers" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3", children: CABIN.amenities.map((a) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-2 rounded-[var(--radius-lg)] border border-border p-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react6.Check, { className: "h-4 w-4 text-success" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-sm font-medium text-foreground", children: a })
            ] }, a)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "flex items-center gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-5", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground", "aria-hidden": "true", children: "MC" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "min-w-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "text-sm font-semibold text-foreground", children: [
                "Hosted by ",
                CABIN.host
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-muted-foreground", children: "Superhost \xB7 8 years hosting \xB7 Responds within an hour" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            BookingSummaryCard,
            {
              pricePerNight: CABIN.pricePerNight,
              checkIn: "Aug 22, 2026",
              checkOut: "Aug 27, 2026",
              guestCount: 4,
              cleaningFee: 160,
              serviceFee: 112
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { label: "Reserve", size: "lg" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "mt-12", "aria-labelledby": "reviews-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { id: "reviews-heading", className: "text-xl font-bold tracking-tight text-foreground font-[var(--font-display)]", children: "Guest reviews" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "mt-4", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ReviewList, { reviews: REVIEWS, averageRating: CABIN.rating, totalReviews: CABIN.reviews }) })
      ] })
    ] }) });
  }
})();
