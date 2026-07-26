import type { ElementType } from 'react';

export type PrimarySection = {
  id: string;
  label: string;
  icon: ElementType;
  href: string;
  adminOnly?: boolean;
};

export type SubNavItem = {
  id: string;
  label: string;
  href: string;
  count?: number;
};

export type SectionConfig = {
  primary: PrimarySection;
  getSubItems: (counts: Record<string, number>) => SubNavItem[];
};
