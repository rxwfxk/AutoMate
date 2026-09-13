import {
  Battery,
  CircleDot,
  ClipboardCheck,
  Disc,
  Droplet,
  Droplets,
  Link as LinkIcon,
  Link2,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Keyed by the `icon` string seeded in supabase/seed.sql for maintenance_types.
const MAINTENANCE_ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  wind: Wind,
  disc: Disc,
  droplets: Droplets,
  "circle-dot": CircleDot,
  link: LinkIcon,
  "link-2": Link2,
  zap: Zap,
  battery: Battery,
  "clipboard-check": ClipboardCheck,
};

export function getMaintenanceIcon(icon: string | null): LucideIcon {
  return (icon && MAINTENANCE_ICONS[icon]) || Wrench;
}
