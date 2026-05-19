import { IconPhoto, IconTypography, IconLayoutGrid } from "@tabler/icons-react";

export const FONT_OPTIONS = [
  {
    label: "Cormorant Garamond",
    value: "Cormorant Garamond",
    category: "Serif",
  },
  { label: "Playfair Display", value: "Playfair Display", category: "Serif" },
  { label: "DM Serif Display", value: "DM Serif Display", category: "Serif" },
  { label: "Josefin Sans", value: "Josefin Sans", category: "Sans" },
  { label: "Outfit", value: "Outfit", category: "Sans" },
  { label: "Raleway", value: "Raleway", category: "Sans" },
];

export const COVER_STYLES = [
  {
    label: "Full Bleed",
    value: "fullbleed",
    desc: "Title centered over image",
  },
  { label: "Novel", value: "novel", desc: "Split — text left, image right" },
  { label: "Frame", value: "frame", desc: "Bordered title over image" },
  { label: "Stripe", value: "stripe", desc: "Dark bar anchored at bottom" },
  { label: "Vintage", value: "vintage", desc: "Title beneath the image" },
  { label: "Minimal", value: "minimal", desc: "No image, text only" },
];

export const GRID_STYLES = [
  { label: "Masonry", value: "masonry" },
  { label: "Grid", value: "grid" },
  { label: "Rows", value: "rows" },
  { label: "Compact", value: "compact" },
];

export const EDITOR_TABS = [
  { id: "cover", label: "Cover", icon: IconPhoto },
  { id: "typography", label: "Type", icon: IconTypography },
  { id: "grid", label: "Grid", icon: IconLayoutGrid },
];
