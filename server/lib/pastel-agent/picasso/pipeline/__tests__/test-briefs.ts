import type { Brief } from "../types";

export const testBriefs: { name: string; brief: Brief; expectedContext: "app" | "landing" | "docs" | "social" }[] = [
  {
    name: "Wavelength",
    brief: {
      productName: "Wavelength",
      description:
        "A budgeting app that makes tracking money feel like a game. Users log in to see spending breakdowns, set savings goals, and compete with friends on leaderboards. Primary use case is dashboard + onboarding flow.",
      audience: "Gen Z, age 18-28, first-time budgeters",
      niche: "fintech",
      personality: ["playful", "bold", "minimal"],
      density: "balanced",
      mode: "light",
      platform: "web",
      companyRefs: ["stripe", "duolingo"],
    },
    expectedContext: "app",
  },
  {
    name: "Taskflow",
    brief: {
      productName: "Taskflow",
      description:
        "A project management dashboard where teams track tasks, sprints, and deadlines. Users log in to see their task board, team activity feed, and project analytics.",
      audience: "Remote teams, project managers, developers",
      niche: "productivity",
      personality: ["professional", "minimal", "calm"],
      density: "dense",
      mode: "both",
      platform: "web",
      companyRefs: ["linear", "notion"],
    },
    expectedContext: "app",
  },
  {
    name: "LaunchKit",
    brief: {
      productName: "LaunchKit",
      description:
        "A marketing landing page for LaunchKit, a no-code website builder. The page needs a hero section with product demo, feature highlights, customer testimonials, pricing tiers, and a CTA-driven conversion flow.",
      audience: "Entrepreneurs, marketers, small business owners",
      niche: "creative",
      personality: ["bold", "friendly", "inspiring"],
      density: "airy",
      mode: "light",
      platform: "marketing",
      companyRefs: ["vercel", "stripe"],
    },
    expectedContext: "landing",
  },
  {
    name: "Tribes",
    brief: {
      productName: "Tribes",
      description:
        "A social platform where users join communities around shared interests, post updates, comment, and message each other. The home screen shows a personalized feed of posts from communities you follow.",
      audience: "Hobbyists, creators, community members age 16-35",
      niche: "social",
      personality: ["energetic", "friendly", "colorful"],
      density: "balanced",
      mode: "light",
      platform: "web+mobile",
      companyRefs: ["discord", "spotify"],
    },
    expectedContext: "social",
  },
  {
    name: "APIkit",
    brief: {
      productName: "APIkit",
      description:
        "Technical documentation for APIkit, a payment processing SDK. The site includes API reference pages with code examples, getting started guides, SDK documentation, and a searchable sidebar navigation.",
      audience: "Software engineers, technical founders, integration developers",
      niche: "devtools",
      personality: ["technical", "clean", "precise"],
      density: "balanced",
      mode: "both",
      platform: "web",
      companyRefs: ["stripe", "vercel"],
    },
    expectedContext: "docs",
  },
];
