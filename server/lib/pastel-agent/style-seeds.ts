import type { StyleSeed } from "./types";

export const STYLE_SEEDS: StyleSeed[] = [
  {
    name: "editorial",
    mood: ["typographic", "magazine", "print-legacy"],
    spatialPhilosophy: "asymmetric grid with a dominant reading column offset from center, framed by generous breathing room on one side to create visual tension",
    typographicAttitude: "headlines are statements, body text is an invitation — large display type anchored by restrained body copy, extreme size contrast with intentional white space between tiers",
    colorTemperature: "warm neutrals",
    textureApproach: "paper-like backgrounds, subtle noise, ink-feel borders",
    creativeDirection: "Imagine a high-end independent magazine. Content leads, design frames. Every element earns its placement. Generous margins signal confidence. Typography is the star — color is sparse, used only to punctuate."
  },
  {
    name: "swiss",
    mood: ["minimal", "grid-bound", "rational"],
    spatialPhilosophy: "strict modular grid — everything snaps to an invisible 8-column structure, content blocks align to a rigid but breathing proportional system",
    typographicAttitude: "one sans-serif family at two weights — medium for hierarchy, regular for everything else. No decorative typography. Size ratio follows a strict modular scale.",
    colorTemperature: "cool neutrals with a single saturated accent",
    textureApproach: "flat planes, no texture, pure vector precision",
    creativeDirection: "Swiss International Style circa 1960 meets digital. The grid is law but the grid is also invisible. Content density is low — negative space is as important as occupied space. One accent color only, used on no more than three elements per page. Borders are 1px, corners are sharp or softly rounded at 4px."
  },
  {
    name: "brutalist",
    mood: ["raw", "honest", "unpolished"],
    spatialPhilosophy: "broken grid — elements overlap, misalign intentionally, content breaks its container. The layout feels assembled, not rendered.",
    typographicAttitude: "monospace or utilitarian sans at a single size with extreme weight contrast — bold for structure, regular for content. No italic, no decoration.",
    colorTemperature: "raw — black, white, one raw primary color",
    textureApproach: "visible borders, raw HTML-feel, intentional 'broken' elements",
    creativeDirection: "Digital brutalism. The website is honest about being a website. Borders are visible 1-2px solid black. Nothing is perfectly centered. The layout has a handmade, assembled quality. Colors are unapologetically basic — think #000, #fff, and one pure primary. No gradients, no softness."
  },
  {
    name: "zen",
    mood: ["sparse", "breathing", "calm", "focused"],
    spatialPhilosophy: "single-column with dramatic negative space — content occupies at most 60% of the viewport, the rest is empty. Scrolling feels like turning pages in a quiet room.",
    typographicAttitude: "one serif family at display sizes, generous line height, letter-spacing on headings is loose and deliberate",
    colorTemperature: "warm paper + deep ink",
    textureApproach: "paper-like softness, no hard dividers, content separated by space alone",
    creativeDirection: "Japanese spatial philosophy applied to the web. Ma — the space between things — is the primary design element. Every element is surrounded by generous emptiness. Content density is extremely low. Typography is elegant, restrained. No borders between sections — only breathing room. The page feels like a meditation."
  },
  {
    name: "bauhaus",
    mood: ["geometric", "bold", "modernist"],
    spatialPhilosophy: "primary shapes anchor the layout — circles, squares, and triangles as compositional devices. Content arranged around these geometric anchors in an asymmetric but balanced arrangement.",
    typographicAttitude: "geometric sans-serif, condensed or wide, used in all caps for structural elements. Lowercase for body. Strong geometric forms.",
    colorTemperature: "primary colors — red, blue, yellow — against white and black",
    textureApproach: "flat, hard-edged, vector-feel",
    creativeDirection: "Bauhaus principles brought to the browser. The layout is constructed from primary geometric shapes. Colors are limited to the Bauhaus palette: red, blue, yellow, black, white. Borders are thick. Negative space is geometric, not organic. The page has architectural weight."
  },
  {
    name: "scandinavian",
    mood: ["warm", "tactile", "soft", "humane"],
    spatialPhilosophy: "airy grid with generous padding — elements have room to breathe, content blocks are separated by soft, warm spacing. Nothing feels crowded.",
    typographicAttitude: "warm sans-serif, slightly rounded, at comfortable sizes. Type hierarchy is gentle — size changes are subtle, not dramatic.",
    colorTemperature: "warm off-white + muted earth tones + one soft accent",
    textureApproach: "soft backgrounds, subtle grain, rounded corners at 12-16px, warm border tones",
    creativeDirection: "Scandinavian design warmth. The background is never pure white — always a warm off-white. Borders are soft and warm-toned. Corners are generously rounded (12-16px). Typography is friendly, not sharp. Colors are muted and earthy. The overall feeling is approachable, human, warm."
  },
  {
    name: "monumental",
    mood: ["imposing", "timeless", "architectural"],
    spatialPhilosophy: "monumental center with dramatic margin asymmetry — primary content occupies the center third with wide, almost excessive margins. Vertical rhythm is slow and deliberate.",
    typographicAttitude: "serif display at monumental sizes paired with wide-tracked sans-serif. Type is treated as architecture — large, weighty, permanent.",
    colorTemperature: "stone + brass + deep navy",
    textureApproach: "marble-textured backgrounds, metallic accents, carved-feel typography",
    creativeDirection: "Architecture-inspired monumentalism. The page has weight — it feels built, not drawn. Typography is massive and confident. Colors are mineral: marble whites, stone grays, brass golds, deep navies. Spacing is generous to the point of excess. Every element feels permanent and considered."
  },
  {
    name: "data-dense",
    mood: ["information-rich", "utilitarian", "precise"],
    spatialPhilosophy: "multi-column dashboard grid — content is organized into clearly defined panels separated by faint dividers. Information density is high but structured.",
    typographicAttitude: "monospace for data, tight sans-serif for labels. Type is small but readable. Hierarchy comes from weight and color, not size.",
    colorTemperature: "dark mode default — deep background with high-contrast foreground",
    textureApproach: "flat with subtle panel differentiation via 1px borders",
    creativeDirection: "Bloomberg Terminal meets Stripe Dashboard. Information is dense but never chaotic. Panels are separated by 1px borders, never shadows. Typography is precise and small. Color is used only to indicate status — red for alerts, green for positive, amber for warnings. The design serves the data, not decoration."
  },
  {
    name: "luxury-fashion",
    mood: ["opulent", "refined", "exclusive", "dark"],
    spatialPhilosophy: "full-bleed imagery with floating typography — the page is dominated by large, dark-background image areas with minimal text layered over them. Content is sparse, confident, and commanding.",
    typographicAttitude: "serif at extreme weights — hairline thin or ultra bold — with dramatic tracking. Font sizes are either very large or very small. No intermediate sizes.",
    colorTemperature: "deep blacks + champagne gold + ivory",
    textureApproach: "silk-like smoothness, velvety darks, subtle light play",
    creativeDirection: "Luxury fashion house aesthetic. The page is dark and dramatic. Typography is extreme — either massive display serif or tiny tracked sans-serif. Backgrounds are deep black or rich dark tones. Accent color is limited to a single metallic gold or silver. Spacing is luxurious — everything has room. The brand communicates through restraint."
  },
  {
    name: "retro-futurist",
    mood: ["nostalgic", "optimistic", "speculative"],
    spatialPhilosophy: "angled containers and overlapping planes — sections tilt slightly, overlap, and break the rectangular web paradigm. Diagonal lines and unexpected angles create movement.",
    typographicAttitude: "geometric sans-serif at unusual angles, wide tracking, all-caps for emphasis. Type may span at slight angles.",
    colorTemperature: "synthwave — neon cyan + magenta + deep purple-black",
    textureApproach: "grain, scan lines, glow effects, gradients used intentionally as atmospheric elements",
    creativeDirection: "Retro-futurism meets synthwave. The layout defies the standard rectangular web. Elements tilt, overlap, and create depth through layering. Colors are electric: neon cyan, hot magenta, deep violet-blacks. Gradients are acceptable here — used as atmospheric effects, not generic hero backgrounds. Typography may break horizontal alignment for dramatic effect."
  },
  {
    name: "organic",
    mood: ["natural", "flowing", "warm", "earthy"],
    spatialPhilosophy: "fluid, organic arrangement — content flows naturally down the page without rigid grid constraints. Sections breathe and transition softly. The layout feels grown, not built.",
    typographicAttitude: "humanist sans-serif or warm serif, slightly irregular-feeling. Sizes are organic — no strict modular scale, just natural-feeling hierarchy.",
    colorTemperature: "earth tones — terracotta + sage + clay + warm sand",
    textureApproach: "organic textures, soft grain, irregular borders, natural-feeling shadows",
    creativeDirection: "Nature-inspired organic design. Nothing feels geometric or calculated. Colors are drawn from earth: terracotta, sage green, clay, sand, warm stone. Typography has a human, slightly imperfect quality. Spacing is generous and irregular-feeling — like nature, not mathematics. Rounded corners feel organic, not systematic."
  },
  {
    name: "neo-brutalist",
    mood: ["bold", "playful", "confrontational", "pop"],
    spatialPhilosophy: "hard grid with intentional violations — a strict underlying grid exists but elements deliberately break it. Content blocks have thick borders. Layout is architectural but playful.",
    typographicAttitude: "bold grotesk sans-serif, often uppercase, with generous tracking. Type is unapologetically large and structural.",
    colorTemperature: "pop art — electric yellow + hot pink + cyan + black + white",
    textureApproach: "thick visible borders, hard shadows used sparingly, high contrast",
    creativeDirection: "Neo-brutalism with pop art energy. Borders are thick (2-3px solid black). Elements have visible containers — but these containers are part of the aesthetic, not generic card layouts. Colors are bold and primary. Hard drop shadows are acceptable here in limited use. The design feels confident, playful, and unapologetically 'web-native.'"
  },
  {
    name: "glassmorphic",
    mood: ["ethereal", "layered", "depth-aware", "modern"],
    spatialPhilosophy: "layered floating panes — content appears on translucent glass-like surfaces that float above deep, colorful backgrounds. Depth is created through blur, not shadow.",
    typographicAttitude: "clean sans-serif, often white or near-white on dark/blurred backgrounds. Type is crisp and modern, sitting on glass surfaces.",
    colorTemperature: "deep jewel tones behind frosted glass + white/light text",
    textureApproach: "frosted glass (backdrop-blur), subtle border highlights on glass edges, depth through transparency layers",
    creativeDirection: "Apple-glass aesthetic done tastefully. Backgrounds are deep, rich colors or abstract gradients. Content panels are translucent 'glass' with backdrop blur. Borders on glass elements are 1px semi-transparent white for edge definition. Depth comes from layering and blur, never from shadows. Used sparingly — not every element is glass."
  },
  {
    name: "constructivist",
    mood: ["revolutionary", "dynamic", "angular", "propaganda-esque"],
    spatialPhilosophy: "dynamic diagonals and overlapping planes — the composition uses strong diagonal lines, overlapping geometric shapes, and asymmetric tension. Content is arranged in dynamic, almost poster-like layouts.",
    typographicAttitude: "bold condensed sans-serif, often at angles, with extreme size variation. Type is treated as a graphic element, not just text.",
    colorTemperature: "red + black + cream, limited palette with maximum impact",
    textureApproach: "bold flat colors, no gradients, occasional halftone or grain texture",
    creativeDirection: "Russian Constructivism meets modern web. The layout is dynamic and almost propagandistic in its boldness. Diagonal lines cut through the page. Typography is massive, angular, and treated as graphic art. The palette is severely limited: red, black, cream/white. No subtlety — every element makes a statement."
  },
  {
    name: "wabi-sabi",
    mood: ["imperfect", "textured", "quiet", "authentic"],
    spatialPhilosophy: "asymmetric but balanced — the layout feels natural, not calculated. Elements are slightly off-center, slightly irregular. The composition embraces the beauty of imperfection.",
    typographicAttitude: "serif or warm sans-serif at modest sizes. Type doesn't shout — it sits quietly and confidently. Line heights are generous.",
    colorTemperature: "muted earth — clay + stone + moss + aged paper",
    textureApproach: "textured backgrounds, irregular borders, paper-like surfaces, visible fiber",
    creativeDirection: "Japanese wabi-sabi philosophy. The design celebrates imperfection and transience. Backgrounds have subtle paper texture. Borders are irregular or absent. Colors are the color of earth, stone, moss, and aged materials. Nothing is perfectly aligned. The page feels ancient and wise, not new and shiny. Asymmetry is the default state, not a choice."
  },
  {
    name: "high-contrast",
    mood: ["stark", "graphic", "binary", "dramatic"],
    spatialPhilosophy: "polarized layout — the page is divided between areas of intense density and areas of pure emptiness. Content blocks are either full-width black or full-width white, creating a stark rhythm.",
    typographicAttitude: "bold sans-serif or serif in black on white (or inverse). Only two sizes: large and small. No intermediate. Type is a binary statement.",
    colorTemperature: "binary — pure black + pure white, with a single optional accent",
    textureApproach: "none — pure flatness, maximum contrast",
    creativeDirection: "Binary design language. The page alternates between black and white sections, creating a dramatic visual rhythm. Typography is either black on white or white on black. There is exactly one accent color, used on fewer than five elements total. No gray — only black and white. The design communicates through contrast, not nuance."
  },
  {
    name: "dieter-rams",
    mood: ["functional", "pure", "essential", "timeless"],
    spatialPhilosophy: "rational grid — everything has a reason and a place. Content is organized into a clean, modular grid with consistent proportional relationships. Nothing is arbitrary.",
    typographicAttitude: "Helvetica or equivalent neutral sans-serif. One weight for body, one for headings. No decoration. Pure communication.",
    colorTemperature: "pure white + charcoal + one functional accent",
    textureApproach: "none — pure, flat surfaces, 2px borders only where functionally necessary",
    creativeDirection: "Dieter Rams' ten principles as a design language. Every element must serve a purpose. Remove everything non-essential. The grid is modular and rational. Typography is purely functional — Helvetica or equivalent. Colors are limited to white, near-black, and a single accent used only for functional emphasis. The design is quiet, confident, and timeless."
  },
  {
    name: "art-deco",
    mood: ["glamorous", "geometric", "ornate", "vertical"],
    spatialPhilosophy: "symmetrical with vertical emphasis — the composition is centered and vertically oriented, with strong vertical lines, stepped geometric forms, and symmetrical balance.",
    typographicAttitude: "elegant serif or geometric sans-serif with tall ascenders, wide tracking, and generous leading. Type is ornamental but readable.",
    colorTemperature: "gold + deep green/teal + cream + black",
    textureApproach: "metallic accents, hairline geometric borders, stepped ornamentation",
    creativeDirection: "Art Deco revival for the web. The layout is symmetrical and vertically driven. Typography is tall, elegant, and widely tracked. Borders are fine hairline gold or metallic. Geometric ornamentation — chevrons, fans, stepped forms — appears as subtle decorative elements. The palette is rich: golds, deep teals, creams, blacks. The design feels luxurious but not gaudy."
  },
  {
    name: "motion-first",
    mood: ["kinetic", "scroll-driven", "narrative", "cinematic"],
    spatialPhilosophy: "full-viewport sections that reveal through scroll — each section occupies the full viewport and content reveals progressively as the user scrolls. The page is a narrative journey.",
    typographicAttitude: "cinematic — large display type, often split across sections. Type is orchestrated to enter and exit with scroll position.",
    colorTemperature: "cinematic color grading — each section can have its own color temperature as part of the narrative arc",
    textureApproach: "cinematic transitions, parallax depth, fade-reveal effects",
    creativeDirection: "Apple product page storytelling. Each section is a full-viewport statement. Content reveals progressively — typography fades in, images slide, statistics count up. The scroll position tells a story. Each section has a distinct color temperature that progresses like a film. Transitions are smooth and cinematic. The page is a journey, not a document."
  },
  {
    name: "industrial",
    mood: ["raw", "utilitarian", "unglossed", "honest"],
    spatialPhilosophy: "functional layout — content is arranged by necessity, not aesthetics. The layout serves the information, without decorative framing. Elements are placed where they're needed.",
    typographicAttitude: "monospace or system fonts, single size for body, slightly larger for headings. Type is raw, unpretentious, functional.",
    colorTemperature: "warehouse — concrete gray + safety orange + steel blue",
    textureApproach: "visible system elements, steel-like backgrounds, raw edges",
    creativeDirection: "Industrial warehouse aesthetic. The website feels like a functional space, not a designed artifact. Backgrounds are concrete gray. Typography is monospace or raw system fonts. Buttons look like physical controls — utilitarian, not decorative. The palette is industrial: grays, safety orange, steel blue. Nothing is polished — the design communicates through its rawness."
  },
  {
    name: "memphis",
    mood: ["playful", "irreverent", "postmodern", "energetic"],
    spatialPhilosophy: "chaotic grid — elements are arranged in an intentionally chaotic but compositionally balanced layout. Geometric shapes (squiggles, triangles, dots) act as compositional devices scattered across the page.",
    typographicAttitude: "bold, playful sans-serif at varying sizes and angles. Type is decorative and energetic. Multiple type treatments coexist.",
    colorTemperature: "bright pastels — mint + peach + lavender + yellow + coral",
    textureApproach: "geometric patterns, confetti-like scatter, playful borders",
    creativeDirection: "Memphis Milano design movement. The layout is intentionally chaotic and playful. Colors are bright pastels used in unusual combinations. Geometric shapes — squiggles, triangles, dots, zigzags — scatter across the page as decorative elements. Typography is bold, varying, and unapologetically playful. The design rejects minimalism entirely and celebrates visual joy."
  }
];

export function selectStyleSeed(recentSeeds: string[] = []): StyleSeed {
  const available = STYLE_SEEDS.filter(s => !recentSeeds.includes(s.name));
  const pool = available.length > 0 ? available : STYLE_SEEDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function selectStyleSeedByName(name: string): StyleSeed | undefined {
  return STYLE_SEEDS.find(s => s.name === name);
}
