export interface PastelIntent {
  pageType: string;
  subject: string;
  audience?: string;
  brandName?: string;
  industry?: string;
  sections: string[];
  requirements: string[];
  rawPrompt: string;
}

export interface DesignConcept {
  mood: string[];
  spatialPhilosophy: string;
  typographicAttitude: string;
  colorTemperature: string;
  textureApproach: string;
  creativeDirection: string;
  styleSeed: string;
}

export interface TypographySpec {
  display: { size: string; weight: string; lineHeight: string; tracking: string };
  h1: { size: string; weight: string; lineHeight: string; tracking: string };
  h2: { size: string; weight: string; lineHeight: string; tracking: string };
  body: { size: string; weight: string; lineHeight: string };
  caption: { size: string; weight: string; lineHeight: string };
  meta: { size: string; weight: string; lineHeight: string };
}

export interface SpacingSpec {
  unit: number;
  sectionGap: number;
  contentPadding: number;
  elementGap: number;
}

export interface DesignSystem {
  colors: {
    background: string;
    foreground: string;
    muted: string;
    subtle: string;
    faint: string;
    accent: string;
    accentForeground: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderSubtle: string;
    success: string;
    warning: string;
    danger: string;
  };
  typography: TypographySpec;
  spacing: SpacingSpec;
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

export interface LayoutBlueprint {
  sections: LayoutSection[];
  overallWidth: number;
  overallMinHeight: number;
}

export interface LayoutSection {
  id: string;
  name: string;
  yOffset: number;
  height: number;
  width: number;
  contentType: string;
  structure: string;
}

export interface CritiqueResult {
  passed: boolean;
  issues: CritiqueIssue[];
  score: number;
}

export interface CritiqueIssue {
  severity: "high" | "medium" | "low";
  type: string;
  location: string;
  description: string;
  fix: string;
}

export interface PastelGeneration {
  concept: DesignConcept;
  designSystem: DesignSystem;
  code: string;
  critique?: CritiqueResult;
  finalCode?: string;
}

export interface PastelEvent {
  type: "phase" | "progress" | "done" | "error";
  phase?: string;
  status?: "running" | "done";
  result?: unknown;
  message?: string;
}

export type StyleSeed = {
  name: string;
  mood: string[];
  spatialPhilosophy: string;
  typographicAttitude: string;
  colorTemperature: string;
  textureApproach: string;
  creativeDirection: string;
};
