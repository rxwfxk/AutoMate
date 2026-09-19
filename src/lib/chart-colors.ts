/** Single JS-side source for the expense palette (maintenance vs documents).
 * Mirrors the `--rd-chart-maintenance` / `--rd-chart-documents` tokens in
 * globals.css — needed as literals because Recharts and inline SVG fills
 * can't take Tailwind classes. Validated against the app background with
 * scripts/validate_palette.js; change all three together. */
export const MAINTENANCE_COLOR = "#3987e5";
export const DOCUMENTS_COLOR = "#d95926";
